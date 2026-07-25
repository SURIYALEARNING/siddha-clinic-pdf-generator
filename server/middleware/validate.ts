import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export function handleValidation(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
    return;
  }
  next();
}

export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

export const validateVerifyOtp = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  handleValidation,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

export const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  handleValidation,
];

export const validateResetPassword = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation,
];

export const validateCreateDoctor = [
  body('name').trim().notEmpty().withMessage('Doctor name is required'),
  handleValidation,
];

export const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidation,
];

export const validateSaveDraft = [
  body('patientInfo').isObject().withMessage('Patient info is required'),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  handleValidation,
];
