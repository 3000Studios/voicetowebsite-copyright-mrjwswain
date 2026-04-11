import { Router } from 'express'
import {
  createAdminSession,
  deleteAdminSession,
  getAdminSessionStatus
} from '../controllers/adminSessionController.js'
import { validate } from '../middleware/validate.js'
import { AdminLoginSchema } from '../validation/schemas.js'

const router = Router()

router.get('/session', getAdminSessionStatus)
router.post('/session', validate(AdminLoginSchema), createAdminSession)
router.delete('/session', deleteAdminSession)

export default router
