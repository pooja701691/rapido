const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rapido API is running smoothly',
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/captains', captainRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    errors: ['Resource or endpoint not found'],
  });
});

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // 1. Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${val}' is already registered.`;
    errors = [`Duplicate value for field: ${field}`];
  }

  // 2. Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // 3. Handle Mongoose CastError (e.g. invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for parameter: ${err.path}`;
    errors = [`Cast to ${err.kind} failed for value "${err.value}"`];
  }

  // 4. Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Authorization denied.';
    errors = [err.message];
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please log in again.';
    errors = [err.message];
  }

  // Fallback for non-array errors
  if (!Array.isArray(errors) || errors.length === 0) {
    errors = [message];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
});

module.exports = app;
