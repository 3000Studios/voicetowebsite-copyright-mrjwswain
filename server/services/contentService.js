import fs from 'node:fs/promises'
import path from 'node:path'
import {
  blogRoot,
  contentRoot,
  frontendBackgroundsRoot,
  pagesRoot,
  productsRoot,
  repoRoot,
  systemRoot
} from './platformPaths.js'

const DEFAULT_FILES = {
  pages: {
    'homepage.json': {
      headline: 'AI builds your app pipeline',
      subheadline:
        'Route local-model commands into content, assets, commits, and Cloudflare-ready builds from one workspace.',
      cta: 'Open the admin console',
      secondaryCta: 'View architecture',
      heroStats: [
        { label: 'Local models online', value: '3' },
        { label: 'Automated deploy path', value: 'Git -> Cloudflare' },
        { label: 'Editable content source', value: '/content' }
      ],
      sections: [
        {
          title: 'Command-first publishing',
          description:
            'Send structured JSON actions to a router that validates intent before touching the workspace.'
        },
        {
          title: 'Local AI orchestration',
          description:
            'Use Ollama-hosted models for code, reasoning, analysis, and content generation without leaving the repo.'
        },
        {
          title: 'Deploy from source control',
          description:
            'Every accepted content mutation can stage, commit, and push for Cloudflare Pages to rebuild automatically.'
        }
      ],
      updatedAt: '2026-03-14T00:00:00.000Z'
    },
    'features.json': {
      headline: 'Five systems, one platform',
      intro:
        'The repository now acts as an AI control plane, content engine, deployment surface, and public website.',
      items: [
        {
          slug: 'command-router',
          title: 'Command Router API',
          description:
            'Validates structured actions and dispatches them to generators, media providers, file editors, and deploy agents.'
        },
        {
          slug: 'content-engine',
          title: 'Content Engine',
          description:
            'Creates and edits JSON-driven pages, blog posts, feature blocks, pricing data, and product copy under /content.'
        },
        {
          slug: 'media-engine',
          title: 'Media Engine',
          description:
            'Discovers free assets from Unsplash, Pexels, and Pixabay, then stores local copies in frontend/assets.'
        },
        {
          slug: 'deploy-agent',
          title: 'Deploy Agent',
          description:
            'Stages workspace changes, commits them with AI-aware messages, pushes upstream, and records deployment status.'
        }
      ],
      updatedAt: '2026-03-14T00:00:00.000Z'
    },
    'pricing.json': {
      headline: 'Start local, scale with confidence',
      tiers: [
        {
          name: 'Launch',
          price: '$0',
          description: 'Local development, manual commands, and one deploy operator.',
          features: ['Ollama model routing', 'JSON content engine', 'Cloudflare-ready build output']
        },
        {
          name: 'Studio',
          price: '$79',
          description: 'Daily content automation with deploy telemetry and admin workflows.',
          features: ['Automated blog generation', 'Media asset discovery', 'Deployment history and analytics']
        },
        {
          name: 'Operator',
          price: '$199',
          description: 'High-touch orchestration for products, landing pages, and scheduled AI jobs.',
          features: ['Multi-product content lanes', 'Workspace file editing', 'Advanced local model switching']
        }
      ],
      updatedAt: '2026-03-14T00:00:00.000Z'
    },
    'theme.json': {
      name: 'Signal Sunrise',
      palette: {
        canvas: '#0d1021',
        surface: '#151a35',
        ink: '#f7f2e8',
        accent: '#ff8a3d',
        highlight: '#5be7c4',
        line: '#2b335f'
      },
      motion: {
        hero: 'stagger-rise',
        sections: 'soft-slide'
      },
      updatedAt: '2026-03-14T00:00:00.000Z'
    }
  },
  blog: {
    'index.json': {
      posts: [
        {
          slug: 'ai-automation-platform',
          title: 'Building an AI-Controlled Web Platform with Local Models',
          excerpt:
            'How to combine Ollama, a command router, JSON content, and Cloudflare Pages into one deployable workflow.',
          publishedAt: '2026-03-14',
          tags: ['automation', 'ollama', 'cloudflare']
        }
      ]
    },
    'ai-automation-platform.json': {
      slug: 'ai-automation-platform',
      title: 'Building an AI-Controlled Web Platform with Local Models',
      excerpt:
        'A blueprint for pairing an AI command router with a content engine, git deployment agent, and Cloudflare Pages.',
      publishedAt: '2026-03-14',
      tags: ['automation', 'ollama', 'cloudflare'],
      sections: [
        {
          heading: 'Start with a command contract',
          body:
            'Treat every AI request as structured data. When a router validates actions first, automation stops feeling fragile and starts behaving like a system.'
        },
        {
          heading: 'Keep content in JSON',
          body:
            'Pages, features, pricing, and blog posts become diffable artifacts when the engine writes them into the repository. That makes review, rollback, and deploy straightforward.'
        },
        {
          heading: 'Deploy through git',
          body:
            'Committing and pushing content changes is the cleanest bridge from an AI editor to Cloudflare Pages. The platform stays deterministic because production is always built from source.'
        }
      ]
    }
  },
  products: {
    'catalog.json': {
      products: [
        {
          slug: 'platform-studio',
          name: 'Platform Studio',
          summary:
            'A command-driven website builder for teams that want content generation, media sourcing, and deploy automation inside one repo.',
          outcome: 'Launch product pages and campaigns from structured commands.',
          priceAnchor: '$79 / month'
        },
        {
          slug: 'deploy-ops',
          name: 'Deploy Ops',
          summary:
            'A deployment monitor that tracks content changes, commit history, and Cloudflare rebuild expectations.',
          outcome: 'Move from ad-hoc publishing to predictable AI-assisted releases.',
          priceAnchor: '$199 / month'
        }
      ]
    },
    'platform-studio.json': {
      slug: 'platform-studio',
      name: 'Platform Studio',
      headline: 'Run your marketing site like an AI-operated product',
      description:
        'Platform Studio combines local-model task routing, content generation, media sourcing, and git deployment orchestration in one repository.',
      bullets: [
        'Create landing pages from structured JSON commands',
        'Generate feature sections tied to product messaging',
        'Push updates directly into a Cloudflare-ready build flow'
      ]
    }
  },
  system: {
    'analytics.json': {
      aiActivity: {
        commandsToday: 0,
        deploymentsToday: 0,
        lastAction: 'idle'
      },
      updatedAt: null
    },
    'traffic.json': {
      queue: [],
      published: [],
      updatedAt: null
    },
    'deployments.json': {
      history: [
        {
          id: 'bootstrap-20260314',
          status: 'idle',
          message: 'Platform bootstrap ready for first AI-managed deploy.',
          branch: 'main',
          commitSha: null,
          startedAt: '2026-03-14T00:00:00.000Z',
          finishedAt: '2026-03-14T00:00:00.000Z'
        }
      ]
    },
    'events.json': {
      events: [],
      updatedAt: null
    },
    'leads.json': {
      leads: [],
      updatedAt: null
    },
    'payments.json': {
      payments: [],
      updatedAt: null
    }
  }
}

const LEGACY_MIRROR_MAP = {
  homepage: path.join(contentRoot, 'homepage.json'),
  features: path.join(contentRoot, 'features.json'),
  pricing: path.join(contentRoot, 'pricing.json')
}

function normalize(value) {
  return value.replace(/\\/g, '/')
}

function nowIso() {
  return new Date().toISOString()
}

export function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeObjects(base, patch) {
  if (!isObject(base) || !isObject(patch)) {
    return patch
  }

  const merged = { ...base }

  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      merged[key] = value
      continue
    }

    if (isObject(value)) {
      merged[key] = mergeObjects(base[key] ?? {}, value)
      continue
    }

    merged[key] = value
  }

  return merged
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true })
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== null) {
      await writeJson(filePath, fallback)
      return fallback
    }

    throw error
  }
}

export async function writeJson(filePath, payload) {
  await ensureDirectory(path.dirname(filePath))
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function ensureDefaultFiles() {
  const directories = [contentRoot, pagesRoot, blogRoot, productsRoot, systemRoot, frontendBackgroundsRoot]
  await Promise.all(directories.map(ensureDirectory))

  for (const [bucket, files] of Object.entries(DEFAULT_FILES)) {
    const bucketRoot =
      bucket === 'pages'
        ? pagesRoot
        : bucket === 'blog'
          ? blogRoot
          : bucket === 'products'
            ? productsRoot
            : systemRoot

    for (const [fileName, contents] of Object.entries(files)) {
      const filePath = path.join(bucketRoot, fileName)
      if (!(await pathExists(filePath))) {
        await writeJson(filePath, contents)
      }
    }
  }
}

async function writeLegacyMirror(slug, payload) {
  const legacyPath = LEGACY_MIRROR_MAP[slug]
  if (!legacyPath) {
    return
  }

  await writeJson(legacyPath, payload)
}

async function listJsonDirectory(directory) {
  await ensureDirectory(directory)

  const entries = await fs.readdir(directory, { withFileTypes: true })
  const jsonEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))

  const records = await Promise.all(
    jsonEntries.map(async (entry) => {
      const filePath = path.join(directory, entry.name)
      return {
        slug: entry.name.replace(/\.json$/i, ''),
        filePath: normalize(path.relative(repoRoot, filePath)),
        data: await readJson(filePath)
      }
    })
  )

  return records.sort((left, right) => left.slug.localeCompare(right.slug))
}

function resolveRepoPath(targetPath) {
  const resolvedPath = path.resolve(repoRoot, targetPath)

  if (!resolvedPath.startsWith(repoRoot)) {
    throw new Error('Target path must stay inside the repository.')
  }

  return resolvedPath
}

function setByPath(target, pathExpression, value) {
  const segments = pathExpression.split('.').filter(Boolean)
  if (segments.length === 0) {
    throw new Error('Field path is required.')
  }

  let pointer = target

  for (const segment of segments.slice(0, -1)) {
    if (!isObject(pointer[segment])) {
      pointer[segment] = {}
    }

    pointer = pointer[segment]
  }

  pointer[segments.at(-1)] = value
}

export async function bootstrapContent() {
  await ensureDefaultFiles()
}

export async function getContentBundle(section = 'all') {
  await bootstrapContent()

  const bundle = {
    pages: await listJsonDirectory(pagesRoot),
    blog: await listJsonDirectory(blogRoot),
    products: await listJsonDirectory(productsRoot),
    system: await listJsonDirectory(systemRoot)
  }

  if (section === 'all') {
    return bundle
  }

  if (!bundle[section]) {
    throw new Error(`Unknown content section "${section}".`)
  }

  return { [section]: bundle[section] }
}

export async function createPage(pageName, pagePayload) {
  await bootstrapContent()
  const slug = slugify(pageName)
  const filePath = path.join(pagesRoot, `${slug}.json`)
  const current = (await pathExists(filePath)) ? await readJson(filePath) : {}
  const nextPage = mergeObjects(current, {
    slug,
    ...pagePayload,
    updatedAt: nowIso()
  })

  await writeJson(filePath, nextPage)
  await writeLegacyMirror(slug, nextPage)

  return {
    slug,
    filePath: normalize(path.relative(repoRoot, filePath)),
    data: nextPage
  }
}

export async function updatePageContent(pageName, field, value) {
  await bootstrapContent()
  const slug = slugify(pageName)
  const filePath = path.join(pagesRoot, `${slug}.json`)
  const page = await readJson(filePath, { slug })

  setByPath(page, field, value)
  page.updatedAt = nowIso()

  await writeJson(filePath, page)
  await writeLegacyMirror(slug, page)

  return {
    slug,
    filePath: normalize(path.relative(repoRoot, filePath)),
    data: page
  }
}

export async function saveBlogPost(postPayload) {
  await bootstrapContent()
  const slug = slugify(postPayload.slug ?? postPayload.title ?? postPayload.topic ?? `post-${Date.now()}`)
  const filePath = path.join(blogRoot, `${slug}.json`)
  const post = {
    ...postPayload,
    slug,
    updatedAt: nowIso()
  }

  await writeJson(filePath, post)

  const indexPath = path.join(blogRoot, 'index.json')
  const indexData = await readJson(indexPath, { posts: [] })
  const summary = {
    slug,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt ?? nowIso().slice(0, 10),
    tags: post.tags ?? []
  }

  indexData.posts = [summary, ...indexData.posts.filter((entry) => entry.slug !== slug)]
  await writeJson(indexPath, indexData)

  return {
    slug,
    filePath: normalize(path.relative(repoRoot, filePath)),
    data: post
  }
}

export async function upsertFeatureSection(featureSection) {
  await bootstrapContent()
  const filePath = path.join(pagesRoot, 'features.json')
  const featurePage = await readJson(filePath, DEFAULT_FILES.pages['features.json'])
  const nextItem = {
    slug: slugify(featureSection.slug ?? featureSection.title ?? featureSection.product ?? `feature-${Date.now()}`),
    ...featureSection
  }

  featurePage.items = [
    nextItem,
    ...featurePage.items.filter((item) => item.slug !== nextItem.slug)
  ]
  featurePage.updatedAt = nowIso()

  await writeJson(filePath, featurePage)
  await writeLegacyMirror('features', featurePage)

  return {
    slug: nextItem.slug,
    filePath: normalize(path.relative(repoRoot, filePath)),
    data: featurePage
  }
}

export async function updateTheme(themePatch) {
  await bootstrapContent()
  const filePath = path.join(pagesRoot, 'theme.json')
  const currentTheme = await readJson(filePath, DEFAULT_FILES.pages['theme.json'])
  const nextTheme = mergeObjects(currentTheme, themePatch)
  nextTheme.updatedAt = nowIso()

  await writeJson(filePath, nextTheme)

  return {
    slug: 'theme',
    filePath: normalize(path.relative(repoRoot, filePath)),
    data: nextTheme
  }
}

export async function editWorkspaceFile({ targetPath, contents, append = false }) {
  const resolvedPath = resolveRepoPath(targetPath)

  if (resolvedPath.endsWith('.json')) {
    JSON.parse(contents)
  }

  await ensureDirectory(path.dirname(resolvedPath))

  if (append) {
    await fs.appendFile(resolvedPath, contents, 'utf8')
  } else {
    await fs.writeFile(resolvedPath, contents, 'utf8')
  }

  return {
    filePath: normalize(path.relative(repoRoot, resolvedPath)),
    bytesWritten: Buffer.byteLength(contents)
  }
}

export async function readSystemDocument(fileName, fallback) {
  await bootstrapContent()
  return readJson(path.join(systemRoot, fileName), fallback)
}

export async function writeSystemDocument(fileName, payload) {
  await bootstrapContent()
  await writeJson(path.join(systemRoot, fileName), payload)
}

export function getSystemDefault(fileName) {
  return DEFAULT_FILES.system[fileName]
}
