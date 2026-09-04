const authService = require('../services/auth.service');

/**
 * Register User Controller
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const { user, token } = await authService.registerUser({
      firstName,
      lastName,
      email,
      password,
      phone,
    });

    // Optionally set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login User Controller
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: { user },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get User Profile Controller
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout User Controller
 */
const logout = async (req, res, next) => {
  try {
    // Clear the HTTP-only cookie if used
    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully. JWT is stateless; please remove the token from client storage.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
};
