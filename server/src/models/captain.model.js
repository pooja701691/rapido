const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: [true, 'Vehicle color is required'],
      trim: true,
    },
    plate: {
      type: String,
      required: [true, 'Vehicle plate number is required'],
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Vehicle capacity must be at least 1'],
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['bike', 'auto', 'car'],
        message: 'Vehicle type must be bike, auto, or car',
      },
      lowercase: true,
      trim: true,
    },
  },
  { _id: false }
);

const captainSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [3, 'First name must be at least 3 characters long'],
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    vehicle: {
      type: vehicleSchema,
      required: [true, 'Vehicle details are required'],
    },
    role: {
      type: String,
      enum: ['USER', 'CAPTAIN'],
      default: 'CAPTAIN',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Captain = mongoose.model('Captain', captainSchema);

module.exports = Captain;
