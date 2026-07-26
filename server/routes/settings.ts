import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSettings, upsertSettings } from '../controllers/settingController';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', upsertSettings);

export default router;
