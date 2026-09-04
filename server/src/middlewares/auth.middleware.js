const { verifyToken } = require('../utils/generateToken');
const User = require('../models/user.model');
const Captain = require('../models/captain.model');

/**
 * Authentication Middleware
 * Validates JWT from Authorization Bearer header or cookie
 * Extracts user/captain ID and role and attaches to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Fallback to cookie if present
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        errors: ['Authorization token is missing'],
      });
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
          errors: [err.message],
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization failed.',
        errors: [err.message],
      });
    }

    // 4. Verify entity still exists in database
    let account = null;
    if (decoded.role === 'USER') {
      account = await User.findById(decoded.id);
    } else if (decoded.role === 'CAPTAIN') {
      account = await Captain.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        errors: ['User not found'],
      });
    }

    // 5. Attach user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Middleware
 * Ensures req.user has one of the allowed roles
 * @param  {...string} roles - Array of allowed roles (e.g. 'USER', 'CAPTAIN')
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.',
        errors: ['Authentication required before role check'],
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access denied for your role.',
        errors: [`Role '${req.user.role}' is not authorized to access this route`],
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  allowRoles,
};
