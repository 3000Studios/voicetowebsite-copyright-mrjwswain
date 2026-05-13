import { routeCommand } from '../ai/router/commandRouter.js'
import { bootstrapContent } from '../server/services/contentService.js'

function parseCommand(argv) {
  const raw = argv[2]

  if (!raw) {
    return {
      action: 'create_blog_post',
      topic: 'AI automation',
      length: 'medium',
      autoDeploy: false
    }
  }

  return JSON.parse(raw)
}

await bootstrapContent()

const command = parseCommand(process.argv)
const result = await routeCommand(command)
console.log(JSON.stringify(result, null, 2))
