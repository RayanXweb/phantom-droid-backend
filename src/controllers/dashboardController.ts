import { Request, Response } from 'express';
import Client from '../models/Client';
import ClientSession from '../models/ClientSession';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import logger from '../middleware/logger';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const inactiveClients = await Client.countDocuments({ status: 'inactive' });
    const onlineClients = await Client.countDocuments({ isOnline: true });
    const offlineClients = await Client.countDocuments({ 
      isOnline: false,
      status: 'active',
    });
    
    const totalQR = await Client.countDocuments({ qrStatus: 'active' });

    // Recent clients
    const recentClients = await Client.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent activities
    const recentActivities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('adminId', 'username');

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        inactiveClients,
        onlineClients,
        offlineClients,
        totalQR,
        recentClients,
        recentActivities: recentActivities.map((activity: any) => ({
          id: activity._id,
          action: activity.action,
          username: activity.adminId?.username || activity.adminName || 'System',
          details: activity.details,
          createdAt: activity.timestamp,
        })),
      },
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    throw new AppError('Failed to get dashboard stats', 500);
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20 } = req.query;

    const activities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('adminId', 'username')
      .populate('clientId', 'clientName clientCode');

    res.json({
      success: true,
      data: activities.map((activity: any) => ({
        id: activity._id,
        action: activity.action,
        admin: activity.adminId?.username || activity.adminName || 'System',
        client: activity.clientId ? {
          name: activity.clientId.clientName,
          code: activity.clientId.clientCode,
        } : null,
        details: activity.details,
        timestamp: activity.timestamp,
      })),
    });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    throw new AppError('Failed to get recent activity', 500);
  }
};
