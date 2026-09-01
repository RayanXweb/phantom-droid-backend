import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import logger from '../middleware/logger';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      adminId,
      clientId,
      startDate,
      endDate,
      search,
    } = req.query;

    const query: any = {};

    if (action) {
      query.action = action;
    }

    if (adminId) {
      query.adminId = adminId;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { adminName: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    throw new AppError('Failed to get audit logs', 500);
  }
};

export const getAuditLogActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const actions = await AuditLog.distinct('action');
    
    res.json({
      success: true,
      data: actions,
    });
  } catch (error) {
    logger.error('Get audit log actions error:', error);
    throw new AppError('Failed to get audit log actions', 500);
  }
};
