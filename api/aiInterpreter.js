import fs from 'node:fs/promises'
import path from 'node:path'
import OpenAI from 'openai'
import { repoRoot } from '../server/services/platformPaths.js'

const ALLOWED_EDIT_ROOTS = ['dashboard', 'public', 'styles', 'components']
const TEXT_EXTENSIONS = new Set(['.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.md', '.txt', '.json'])
const MAX_FILE_CONTEXT_CHARS = 12000
const MAX_TOTAL_CONTEXT_CHARS = 40000

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for natural-language repository commands.')
  }

  return new OpenAI({ apiKey })
}

async function collectFileContexts(relativeDir, bucket) {
  const absoluteDir = path.join(repoRoot, relativeDir)
  let entries = []

  try {
    entries = await fs.readdir(absoluteDir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (bucket.totalChars >= MAX_TOTAL_CONTEXT_CHARS) {
      return
    }

    if (entry.name.startsWith('.')) {
      continue
    }

    const childRelativePath = path.posix.join(relativeDir.replaceAll('\\', '/'), entry.name)

    if (entry.isDirectory()) {
      await collectFileContexts(childRelativePath, bucket)
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()

    if (!TEXT_EXTENSIONS.has(extension)) {
      continue
    }

    const absoluteFilePath = path.join(repoRoot, childRelativePath)
    const contents = await fs.readFile(absoluteFilePath, 'utf8')
    const truncated = contents.slice(0, MAX_FILE_CONTEXT_CHARS)

    bucket.files.push({
      file: childRelativePath,
      contents: truncated
    })
    bucket.totalChars += truncated.length
  }
}

async function getEditableFileContext() {
  const bucket = {
    files: [],
    totalChars: 0
  }

  for (const root of ALLOWED_EDIT_ROOTS) {
    await collectFileContexts(root, bucket)
  }

  return bucket.files
}

function validateInstruction(instruction) {
  if (!instruction || typeof instruction !== 'object' || Array.isArray(instruction)) {
    throw new Error('AI interpreter returned an invalid instruction payload.')
  }

  if (instruction.action === 'reject') {
    throw new Error(instruction.reason || 'Command rejected because it could not be converted into a safe single-file patch.')
  }

  const requiredFields = ['file', 'action', 'target', 'value']

  for (const field of requiredFields) {
    if (typeof instruction[field] !== 'string' || !instruction[field].trim()) {
      throw new Error(`AI interpreter response is missing "${field}".`)
    }
  }

  return {
    file: instruction.file.trim(),
    action: instruction.action.trim(),
    target: instruction.target,
    value: instruction.value,
    commitMessage:
      typeof instruction.commitMessage === 'string' && instruction.commitMessage.trim()
        ? instruction.commitMessage.trim().slice(0, 72)
        : 'AI voice update',
    summary:
      typeof instruction.summary === 'string' && instruction.summary.trim()
        ? instruction.summary.trim()
        : 'Natural-language repository update'
  }
}

export async function interpretCommand(command) {
  if (typeof command !== 'string' || !command.trim()) {
    throw new Error('Command must be a non-empty string.')
  }

  const editableFiles = await getEditableFileContext()
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You control a website repository.

Return JSON only.

Allowed roots: ${ALLOWED_EDIT_ROOTS.join(', ')}.
Allowed actions: replace_text, insert_before, insert_after, append_text.
Forbidden targets: .env files, secrets, GitHub workflows, deployment credentials, server code, API code, shell commands.
Only produce a single-file edit.
Use exact target text copied from the supplied file snapshots.

Respond with:
{
  "file": "dashboard/index.html",
  "action": "replace_text",
  "target": "exact existing text",
  "value": "replacement text",
  "commitMessage": "short git commit message",
  "summary": "what changed"
}

If the request cannot be completed safely as one allowed file edit, respond with:
{
  "action": "reject",
  "reason": "short reason"
}`
      },
      {
        role: 'user',
        content: `User command: ${command.trim()}

Editable file snapshots:
${JSON.stringify(editableFiles, null, 2)}`
      }
    ]
  })

  const text = completion.choices[0]?.message?.content

  if (!text) {
    throw new Error('OpenAI returned an empty interpreter response.')
  }

  return validateInstruction(JSON.parse(text))
}
