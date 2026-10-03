const Captain = require('../models/captain.model');
const { hashPassword, comparePassword } = require('../utils/password');
const { ApiError } = require('./auth.service');

/**
 * Get all captains with optional filters
 */
const getAllCaptains = async (filters = {}) => {
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.email) query.email = new RegExp(filters.email, 'i');
  if (filters.phone) query.phone = new RegExp(filters.phone, 'i');

  const captains = await Captain.find(query).sort({ createdAt: -1 });
  return captains.map((captain) => captain.toJSON());
};

/**
 * Get captain by ID
 */
const getCaptainById = async (captainId) => {
  const captain = await Captain.findById(captainId);

  if (!captain) {
    throw new ApiError(404, 'Captain not found', ['No captain found with the provided ID']);
  }

  return captain.toJSON();
};

/**
 * Update captain profile details
 */
const updateCaptainProfile = async (captainId, updates) => {
  const captain = await Captain.findById(captainId);

  if (!captain) {
    throw new ApiError(404, 'Captain not found', ['No captain found with the provided ID']);
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'vehicle'];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      captain[field] = updates[field];
    }
  });

  if (updates.email && updates.email !== captain.email) {
    const existingCaptain = await Captain.findOne({ email: updates.email.toLowerCase().trim() });
    if (existingCaptain && existingCaptain._id.toString() !== captainId) {
      throw new ApiError(409, 'Email is already registered', ['A captain with this email already exists']);
    }
    captain.email = updates.email.toLowerCase().trim();
  }

  if (updates.phone && updates.phone !== captain.phone) {
    const existingCaptain = await Captain.findOne({ phone: updates.phone.trim() });
    if (existingCaptain && existingCaptain._id.toString() !== captainId) {
      throw new ApiError(409, 'Phone number is already registered', ['A captain with this phone number already exists']);
    }
    captain.phone = updates.phone.trim();
  }

  if (updates.vehicle) {
    captain.vehicle = {
      color: updates.vehicle.color,
      plate: updates.vehicle.plate?.toUpperCase().trim(),
      capacity: updates.vehicle.capacity,
      vehicleType: updates.vehicle.vehicleType?.toLowerCase().trim(),
    };
  }

  await captain.save();
  return captain.toJSON();
};

/**
 * Change captain password
 */
const changeCaptainPassword = async (captainId, currentPassword, newPassword) => {
  const captain = await Captain.findById(captainId).select('+password');

  if (!captain) {
    throw new ApiError(404, 'Captain not found', ['No captain found with the provided ID']);
  }

  const isMatch = await comparePassword(currentPassword, captain.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid current password', ['Current password is incorrect']);
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'Password too short', ['Password must be at least 6 characters long']);
  }

  captain.password = await hashPassword(newPassword);
  await captain.save();

  return {
    message: 'Password updated successfully',
  };
};

/**
 * Delete captain account
 */
const deleteCaptain = async (captainId) => {
  const captain = await Captain.findByIdAndDelete(captainId);

  if (!captain) {
    throw new ApiError(404, 'Captain not found', ['No captain found with the provided ID']);
  }

  return {
    message: 'Captain deleted successfully',
    deletedCaptain: captain.toJSON(),
  };
};

module.exports = {
  getAllCaptains,
  getCaptainById,
  updateCaptainProfile,
  changeCaptainPassword,
  deleteCaptain,
};
