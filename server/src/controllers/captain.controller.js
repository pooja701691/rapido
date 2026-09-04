const authService = require('../services/auth.service');

/**
 * Register Captain Controller
 */
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, vehicle } = req.body;
    const { captain, token } = await authService.registerCaptain({
      firstName,
      lastName,
      email,
      password,
      phone,
      vehicle,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Captain registered successfully',
      data: { captain },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Captain Controller
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { captain, token } = await authService.loginCaptain({ email, password });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Captain logged in successfully',
      data: { captain },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Captain Profile Controller
 */
const getProfile = async (req, res, next) => {
  try {
    const captain = await authService.getCaptainProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Captain profile retrieved successfully',
      data: { captain },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout Captain Controller
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Captain logged out successfully. JWT is stateless; please remove the token from client storage.',
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
