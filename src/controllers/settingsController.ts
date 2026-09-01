import { Request, Response } from 'express';
import SystemSetting from '../models/SystemSetting';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import logger from '../middleware/logger';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await SystemSetting.find();
    
    const settingsObject: any = {};
    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: settingsObject,
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    throw new AppError('Failed to get settings', 500);
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = (req as any).user;
    const updates = req.body;

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const setting = await SystemSetting.findOneAndUpdate(
        { key },
        { 
          value,
          updatedAt: new Date(),
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      results.push(setting);
    }

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      action: 'SETTINGS_UPDATED',
      details: {
        updatedKeys: Object.keys(updates),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: results,
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    throw new AppError('Failed to update settings', 500);
  }
};

export const getSetting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const setting = await SystemSetting.findOne({ key });
    if (!setting) {
      res.status(404).json({
        success: false,
        message: 'Setting not found',
        error: { code: 'SETTING_NOT_FOUND' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        key: setting.key,
        value: setting.value,
      },
    });
  } catch (error) {
    logger.error('Get setting error:', error);
    throw new AppError('Failed to get setting', 500);
  }
};
