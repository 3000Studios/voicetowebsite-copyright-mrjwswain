import { routeCommand } from '../../ai/router/commandRouter.js'
import { getAnalyticsSnapshot } from '../services/analyticsService.js'
import { getContentBundle } from '../services/contentService.js'
import { getDeploymentHistory } from '../services/deploymentService.js'
import { getRecentCommits } from '../services/gitService.js'
import { getSystemMetrics } from '../services/metricsService.js'

export async function postCommand(request, response, next) {
  try {
    const result = await routeCommand(request.body)
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getAnalytics(request, response, next) {
  try {
    const analytics = await getAnalyticsSnapshot()
    response.json(analytics)
  } catch (error) {
    next(error)
  }
}

export async function getDeployments(request, response, next) {
  try {
    const [deployments, commits] = await Promise.all([getDeploymentHistory(), getRecentCommits(8)])
    response.json({
      ...deployments,
      commits
    })
  } catch (error) {
    next(error)
  }
}

export async function getContent(request, response, next) {
  try {
    const section = typeof request.query.section === 'string' ? request.query.section : 'all'
    const content = await getContentBundle(section)
    response.json(content)
  } catch (error) {
    next(error)
  }
}

export async function getMetrics(request, response, next) {
  try {
    const metrics = await getSystemMetrics()
    response.json(metrics)
  } catch (error) {
    next(error)
  }
}
