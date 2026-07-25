import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getDrafts, saveDraft, deleteDraft } from '../controllers/draftController';
import { validateSaveDraft, validateIdParam } from '../middleware/validate';

const router = Router();

router.use(authMiddleware);

router.get('/', getDrafts);
router.post('/', validateSaveDraft, saveDraft);
router.delete('/:id', validateIdParam, deleteDraft);

export default router;
