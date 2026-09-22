import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cinereserve_jwt_secret_key_2026_super_secure';

/**
 * Protect middleware: validates Bearer JWT token
 */
export async function protect(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      errorCode: 'AUTH_REQUIRED',
      message: 'Authentication required. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        errorCode: 'USER_NOT_FOUND',
        message: 'Account no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      errorCode: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token. Please sign in again.'
    });
  }
}

/**
 * RequireAdmin middleware: verifies user has admin role
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      errorCode: 'ADMIN_ACCESS_DENIED',
      message: 'Forbidden. Admin privileges are required to access this resource.'
    });
  }
  next();
}
