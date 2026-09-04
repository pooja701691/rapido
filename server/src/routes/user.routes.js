const express = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, allowRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Validation error checking middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => `${err.path}: ${err.msg}`),
    });
  }
  next();
};

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 3 })
      .withMessage('First name must be at least 3 characters long'),
    body('lastName')
      .optional()
      .trim(),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone number must be a valid 10-digit number'),
    validate,
  ],
  userController.register
);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],
  userController.login
);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (USER only)
 */
router.get(
  '/profile',
  authenticate,
  allowRoles('USER'),
  userController.getProfile
);

/**
 * @route   POST /api/users/logout
 * @desc    Logout current user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  userController.logout
);

module.exports = router;
