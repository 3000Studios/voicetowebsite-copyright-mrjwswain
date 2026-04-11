function fromModules(modules) {
  return Object.fromEntries(
    Object.entries(modules).map(([filePath, moduleValue]) => {
      const slug = filePath.split('/').at(-1).replace('.json', '')
      return [slug, moduleValue.default ?? moduleValue]
    })
  )
}

const pages = fromModules(import.meta.glob('../../content/pages/*.json', { eager: true }))
const blog = fromModules(import.meta.glob('../../content/blog/*.json', { eager: true }))
const products = fromModules(import.meta.glob('../../content/products/*.json', { eager: true }))

export const theme = pages.theme ?? {
  palette: {
    canvas: '#0d1021',
    surface: '#151a35',
    ink: '#f7f2e8',
    accent: '#ff8a3d',
    highlight: '#5be7c4',
    line: '#2b335f'
  }
}

export const homepage = pages.homepage ?? { sections: [], heroStats: [] }
export const featurePage = pages.features ?? { items: [] }
export const pricingPage = pages.pricing ?? { tiers: [] }
export const pageLookup = pages
export const blogIndex = blog.index ?? { posts: [] }
export const blogPosts = Object.values(blog)
  .filter((entry) => entry.slug)
  .sort((left, right) => String(right.publishedAt).localeCompare(String(left.publishedAt)))
export const blogLookup = Object.fromEntries(blogPosts.map((entry) => [entry.slug, entry]))
export const productCatalog = products.catalog?.products ?? []
export const productLookup = Object.fromEntries(
  Object.values(products)
    .filter((entry) => entry.slug)
    .map((entry) => [entry.slug, entry])
)
