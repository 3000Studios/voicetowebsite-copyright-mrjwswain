import fs from 'node:fs/promises'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { repoRoot } from './platformPaths.js'

const schemasRoot = path.join(repoRoot, 'schemas')

let ajvPromise = null
const compiledCache = new Map()
let registryPromise = null

async function loadJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

async function getRegistry() {
  if (!registryPromise) {
    registryPromise = (async () => {
      const raw = await loadJson(path.join(schemasRoot, 'index.json'))
      const entries = new Map()

      for (const entry of raw.schemas) {
        entries.set(entry.name, entry)
      }

      return { raw, entries }
    })()
  }

  return registryPromise
}

async function getAjv() {
  if (!ajvPromise) {
    ajvPromise = (async () => {
      const ajv = new Ajv2020({
        allErrors: true,
        strict: false,
        allowUnionTypes: true
      })
      addFormats(ajv)

      const registry = await getRegistry()

      for (const entry of registry.entries.values()) {
        const schemaPath = path.join(repoRoot, entry.path)
        const schema = await loadJson(schemaPath)
        if (!ajv.getSchema(schema.$id)) {
          ajv.addSchema(schema, schema.$id)
        }
      }

      return ajv
    })()
  }

  return ajvPromise
}

export async function getValidator(name) {
  if (compiledCache.has(name)) {
    return compiledCache.get(name)
  }

  const ajv = await getAjv()
  const registry = await getRegistry()
  const entry = registry.entries.get(name)

  if (!entry) {
    throw new Error(`Unknown schema "${name}". Register it in schemas/index.json.`)
  }

  const validator = ajv.getSchema(entry.id)
  if (!validator) {
    throw new Error(`Schema "${name}" (${entry.id}) failed to compile.`)
  }

  compiledCache.set(name, validator)
  return validator
}

function formatErrors(errors = []) {
  return errors
    .map((err) => {
      const location = err.instancePath || '(root)'
      return `${location} ${err.message ?? 'is invalid'}`
    })
    .join('; ')
}

export async function validate(name, payload) {
  const validator = await getValidator(name)

  if (!validator(payload)) {
    const details = formatErrors(validator.errors)
    const error = new Error(`Schema "${name}" validation failed: ${details}`)
    error.code = 'SCHEMA_VALIDATION_FAILED'
    error.schema = name
    error.errors = validator.errors
    throw error
  }

  return payload
}

export async function isValid(name, payload) {
  try {
    await validate(name, payload)
    return { valid: true, errors: [] }
  } catch (error) {
    if (error.code === 'SCHEMA_VALIDATION_FAILED') {
      return { valid: false, errors: error.errors ?? [] }
    }

    throw error
  }
}

export async function listSchemas() {
  const registry = await getRegistry()
  return Array.from(registry.entries.values())
}
