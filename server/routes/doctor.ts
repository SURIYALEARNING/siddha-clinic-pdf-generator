import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadDoctorImages } from '../middleware/upload';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctorController';
import { validateCreateDoctor, validateIdParam } from '../middleware/validate';

const router = Router();

router.use(authMiddleware);

router.get('/', getDoctors);
router.post('/', uploadDoctorImages, validateCreateDoctor, createDoctor);
router.put('/:id', validateIdParam, uploadDoctorImages, updateDoctor);
router.delete('/:id', validateIdParam, deleteDoctor);

export default router;
