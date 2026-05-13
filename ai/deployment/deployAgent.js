import { recordDeployment } from '../../server/services/deploymentService.js'
import { recordDeploymentActivity } from '../../server/services/analyticsService.js'
import { commitAndPush, getRecentCommits } from '../../server/services/gitService.js'

export async function deploySite({ message = 'AI update' } = {}) {
  const startedAt = new Date().toISOString()
  const gitResult = await commitAndPush(message)
  const commits = await getRecentCommits(3)
  const deployment = {
    id: `deploy-${Date.now()}`,
    status: gitResult.status,
    message,
    branch: gitResult.branch,
    commitSha: commits[0]?.shortSha ?? null,
    startedAt,
    finishedAt: new Date().toISOString(),
    git: gitResult
  }

  await recordDeployment(deployment)

  if (gitResult.status === 'pushed') {
    await recordDeploymentActivity()
  }

  return deployment
}
