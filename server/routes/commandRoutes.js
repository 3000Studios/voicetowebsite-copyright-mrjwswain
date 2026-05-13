import { Router } from 'express'
import commandApiRouter from '../../api/command.js'
import {
  getAnalytics,
  getContent,
  getDeployments,
  getMetrics,
} from '../controllers/commandController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = Router()

router.get('/analytics', adminAuth, getAnalytics)
router.get('/deployments', adminAuth, getDeployments)
router.get('/content', adminAuth, getContent)
router.get('/metrics', adminAuth, getMetrics)
router.use('/command', adminAuth, commandApiRouter)

export default router
