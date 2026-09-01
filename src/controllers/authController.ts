import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { config } from '../config/config';
import { AppError } from '../middleware/errorHandler';
import AuditLog from '../models/AuditLog';
import logger from '../middleware/logger';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }],
      status: 'active',
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: { code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: { code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { id: admin._id, username: admin.username },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );

    // Log audit
    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      action: 'ADMIN_LOGIN',
      details: { loginTime: new Date().toISOString() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    throw new AppError('Login failed', 500);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const username = (req as any).user?.username;

    if (userId) {
      await AuditLog.create({
        adminId: userId,
        adminName: username,
        action: 'ADMIN_LOGOUT',
        details: { logoutTime: new Date().toISOString() },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    throw new AppError('Logout failed', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token required',
        error: { code: 'REFRESH_TOKEN_REQUIRED' },
      });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
      
      const admin = await Admin.findById(decoded.id).select('-passwordHash');
      if (!admin || admin.status !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          error: { code: 'INVALID_REFRESH_TOKEN' },
        });
        return;
      }

      const newToken = jwt.sign(
        { id: admin._id, username: admin.username, role: admin.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: { code: 'INVALID_REFRESH_TOKEN' },
      });
      return;
    }
  } catch (error) {
    logger.error('Refresh token error:', error);
    throw new AppError('Refresh token failed', 500);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
        error: { code: 'UNAUTHORIZED' },
      });
      return;
    }

    const admin = await Admin.findById(user._id).select('-passwordHash');
    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get me error:', error);
    throw new AppError('Failed to get user info', 500);
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only master_admin can create new admins
    const currentUser = (req as any).user;
    if (!currentUser || currentUser.role !== 'master_admin') {
      res.status(403).json({
        success: false,
        message: 'Only master admins can register new admins',
        error: { code: 'FORBIDDEN' },
      });
      return;
    }

    const { username, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (existingAdmin) {
      res.status(409).json({
        success: false,
        message: 'Username or email already exists',
        error: { code: 'DUPLICATE_ERROR' },
      });
      return;
    }

    const admin = new Admin({
      username,
      email,
      passwordHash: password,
      role: role || 'operator',
      status: 'active',
    });

    await admin.save();

    await AuditLog.create({
      adminId: currentUser._id,
      adminName: currentUser.username,
      action: 'ADMIN_CREATED',
      details: {
        newAdmin: username,
        role: admin.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    throw new AppError('Registration failed', 500);
  }
};
