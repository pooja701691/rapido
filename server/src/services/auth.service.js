const User = require('../models/user.model');
const Captain = require('../models/captain.model');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/generateToken');

/**
 * Custom API Error class with HTTP status codes
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Register a new User
 */
const registerUser = async ({ firstName, lastName, email, password, phone }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if email already exists
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(409, 'Email is already registered', ['A user with this email already exists']);
  }

  // 2. Check if phone already exists
  const existingPhone = await User.findOne({ phone: phone.trim() });
  if (existingPhone) {
    throw new ApiError(409, 'Phone number is already registered', ['A user with this phone number already exists']);
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(password);

  // 4. Create user in database
  const user = await User.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    role: 'USER',
  });

  // 5. Generate JWT
  const token = generateToken({ id: user._id, role: user.role });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Login User
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find user by email and explicitly include password
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials', ['Invalid email or password']);
  }

  // 2. Compare password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials', ['Invalid email or password']);
  }

  // 3. Generate JWT
  const token = generateToken({ id: user._id, role: user.role });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Get User Profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found', ['No user found with the provided ID']);
  }
  return user.toJSON();
};

/**
 * Register a new Captain
 */
const registerCaptain = async ({ firstName, lastName, email, password, phone, vehicle }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if email already exists
  const existingEmail = await Captain.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(409, 'Email is already registered', ['A captain with this email already exists']);
  }

  // 2. Check if phone already exists
  const existingPhone = await Captain.findOne({ phone: phone.trim() });
  if (existingPhone) {
    throw new ApiError(409, 'Phone number is already registered', ['A captain with this phone number already exists']);
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(password);

  // 4. Create captain in database
  const captain = await Captain.create({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone.trim(),
    vehicle: {
      color: vehicle.color,
      plate: vehicle.plate.toUpperCase().trim(),
      capacity: vehicle.capacity,
      vehicleType: vehicle.vehicleType.toLowerCase().trim(),
    },
    role: 'CAPTAIN',
  });

  // 5. Generate JWT
  const token = generateToken({ id: captain._id, role: captain.role });

  return {
    captain: captain.toJSON(),
    token,
  };
};

/**
 * Login Captain
 */
const loginCaptain = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find captain by email and explicitly include password
  const captain = await Captain.findOne({ email: normalizedEmail }).select('+password');
  if (!captain) {
    throw new ApiError(401, 'Invalid credentials', ['Invalid email or password']);
  }

  // 2. Compare password
  const isMatch = await comparePassword(password, captain.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials', ['Invalid email or password']);
  }

  // 3. Generate JWT
  const token = generateToken({ id: captain._id, role: captain.role });

  return {
    captain: captain.toJSON(),
    token,
  };
};

/**
 * Get Captain Profile
 */
const getCaptainProfile = async (captainId) => {
  const captain = await Captain.findById(captainId);
  if (!captain) {
    throw new ApiError(404, 'Captain not found', ['No captain found with the provided ID']);
  }
  return captain.toJSON();
};

module.exports = {
  ApiError,
  registerUser,
  loginUser,
  getUserProfile,
  registerCaptain,
  loginCaptain,
  getCaptainProfile,
};
