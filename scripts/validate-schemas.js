import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getValidator, listSchemas, validate } from '../server/services/schemaValidator.js'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(__filename), '..')

const MANIFEST = [
  { schema: 'page', dir: 'content/pages', exclude: new Set(['theme.json']) },
  { schema: 'theme', dir: 'content/pages', include: new Set(['theme.json']) },
  { schema: 'blog-post', dir: 'content/blog', exclude: new Set(['index.json']) },
  { schema: 'blog-index', dir: 'content/blog', include: new Set(['index.json']) },
  { schema: 'product', dir: 'content/products', exclude: new Set(['catalog.json']) },
  { schema: 'product-catalog', dir: 'content/products', include: new Set(['catalog.json']) },
  { schema: 'deployment-history', dir: 'content/system', include: new Set(['deployments.json']) }
]

const SAMPLE_COMMANDS = [
  { action: 'create_blog_post', topic: 'AI automation', length: 'medium', autoDeploy: false },
  { action: 'update_content', page: 'homepage', field: 'headline', value: 'Hello' },
  { action: 'edit_workspace_file', targetPath: 'content/system/events.json', contents: '[]' },
  { action: 'deploy_site', message: 'AI update' },
  { action: 'generate_images', query: 'voice to website', count: 2 }
]

async function readDir(dir) {
  try {
    const entries = await fs.readdir(path.join(repoRoot, dir), { withFileTypes: true })
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json')).map((entry) => entry.name)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function validateManifestEntry(entry) {
  const files = await readDir(entry.dir)
  const matched = files.filter((file) => {
    if (entry.include) return entry.include.has(file)
    if (entry.exclude) return !entry.exclude.has(file)
    return true
  })

  const results = []
  for (const file of matched) {
    const filePath = path.join(repoRoot, entry.dir, file)
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const payload = JSON.parse(raw)
      await validate(entry.schema, payload)
      results.push({ schema: entry.schema, file: `${entry.dir}/${file}`, ok: true })
    } catch (error) {
      results.push({
        schema: entry.schema,
        file: `${entry.dir}/${file}`,
        ok: false,
        error: error.message
      })
    }
  }

  return results
}

async function validateCommandSamples() {
  const results = []
  for (const command of SAMPLE_COMMANDS) {
    try {
      await validate('command', command)
      results.push({ schema: 'command', sample: command.action, ok: true })
    } catch (error) {
      results.push({ schema: 'command', sample: command.action, ok: false, error: error.message })
    }
  }
  return results
}

async function main() {
  const schemas = await listSchemas()
  for (const entry of schemas) {
    await getValidator(entry.name)
  }

  const fileResults = (await Promise.all(MANIFEST.map(validateManifestEntry))).flat()
  const commandResults = await validateCommandSamples()

  const all = [...fileResults, ...commandResults]
  const failures = all.filter((entry) => !entry.ok)
  const summary = {
    ok: failures.length === 0,
    schemas: schemas.length,
    checked: all.length,
    failed: failures.length,
    failures
  }

  console.log(JSON.stringify(summary, null, 2))

  if (!summary.ok) {
    process.exitCode = 1
  }
}

await main()
