import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Validation rules
const signupValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('username')
        .isLength({ min: 3, max: 20 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('fullName')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Full name must be between 1 and 100 characters')
];

const loginValidation = [
    body('emailOrUsername')
        .notEmpty()
        .withMessage('Email or username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const passwordResetRequestValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
];

const passwordResetValidation = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/signup', signupValidation, authController.signup.bind(authController));
router.post('/login', loginValidation, authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.get('/verify-email/:token', authController.verifyEmail.bind(authController));
router.post('/request-password-reset', passwordResetRequestValidation, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', passwordResetValidation, authController.resetPassword.bind(authController));

// Protected routes
router.get('/me', authMiddleware, authController.getMe.bind(authController));
router.put('/profile', authMiddleware, authController.updateProfile.bind(authController));

export default router;