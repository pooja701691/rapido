const express = require('express');
const { body, validationResult } = require('express-validator');
const captainController = require('../controllers/captain.controller');
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
 * @route   POST /api/captains/register
 * @desc    Register a new captain (driver)
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
    body('vehicle')
      .isObject()
      .withMessage('Vehicle information must be an object'),
    body('vehicle.color')
      .trim()
      .notEmpty()
      .withMessage('Vehicle color is required'),
    body('vehicle.plate')
      .trim()
      .notEmpty()
      .withMessage('Vehicle plate number is required'),
    body('vehicle.capacity')
      .isInt({ min: 1 })
      .withMessage('Vehicle capacity must be an integer of at least 1'),
    body('vehicle.vehicleType')
      .trim()
      .toLowerCase()
      .isIn(['bike', 'auto', 'car'])
      .withMessage("Vehicle type must be one of: 'bike', 'auto', 'car'"),
    validate,
  ],
  captainController.register
);

/**
 * @route   POST /api/captains/login
 * @desc    Authenticate captain and get token
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
  captainController.login
);

/**
 * @route   GET /api/captains/profile
 * @desc    Get current captain profile
 * @access  Private (CAPTAIN only)
 */
router.get(
  '/profile',
  authenticate,
  allowRoles('CAPTAIN'),
  captainController.getProfile
);

/**
 * @route   POST /api/captains/logout
 * @desc    Logout current captain
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  captainController.logout
);

module.exports = router;
