import { Router } from 'express';
import {
  register,
  verifyRegistrationOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import {
  validateRegister,
  validateVerifyOtp,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validate';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/verify-registration-otp', validateVerifyOtp, verifyRegistrationOtp);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/me', authMiddleware, getMe);

export default router;
