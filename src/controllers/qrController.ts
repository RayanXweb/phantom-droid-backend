import { Request, Response } from 'express';
import QRCode from 'qrcode';
import Client from '../models/Client';
import ClientSession from '../models/ClientSession';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/config';
import logger from '../middleware/logger';

export const generateQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = (req as any).user;

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    // Generate QR code as base64
    const qrData = client.clientUrl;
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: config.qrFgColor,
        light: config.qrBgColor,
      },
    };

    const qrBase64 = await QRCode.toDataURL(qrData, qrOptions);

    res.json({
      success: true,
      data: {
        qrCode: qrBase64,
        clientUrl: client.clientUrl,
        clientCode: client.clientCode,
        clientName: client.clientName,
      },
    });
  } catch (error) {
    logger.error('Generate QR error:', error);
    throw new AppError('Failed to generate QR code', 500);
  }
};

export const regenerateQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const admin = (req as any).user;

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    // Increment QR version
    client.qrVersion += 1;
    await client.save();

    // Generate new QR
    const qrData = client.clientUrl;
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: config.qrFgColor,
        light: config.qrBgColor,
      },
    };

    const qrBase64 = await QRCode.toDataURL(qrData, qrOptions);

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'QR_REGENERATED',
      details: {
        clientName: client.clientName,
        version: client.qrVersion,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      data: {
        qrCode: qrBase64,
        version: client.qrVersion,
        clientUrl: client.clientUrl,
      },
    });
  } catch (error) {
    logger.error('Regenerate QR error:', error);
    throw new AppError('Failed to regenerate QR code', 500);
  }
};

export const downloadQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    const qrData = client.clientUrl;
    const qrOptions: any = {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: config.qrFgColor,
        light: config.qrBgColor,
      },
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(qrData, {
        ...qrOptions,
        type: 'svg',
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename=qr-${client.clientCode}.svg`);
      res.send(svg);
    } else {
      qrOptions.type = 'image/png';
      qrOptions.quality = 0.92;
      
      const buffer = await QRCode.toBuffer(qrData, qrOptions);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename=qr-${client.clientCode}.png`);
      res.send(buffer);
    }
  } catch (error) {
    logger.error('Download QR error:', error);
    throw new AppError('Failed to download QR code', 500);
  }
};

export const getClientQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const client = await Client.findOne({ clientCode: code });
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    if (client.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Client is inactive',
        error: { code: 'CLIENT_INACTIVE' },
      });
      return;
    }

    // Generate QR for client
    const qrData = client.clientUrl;
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: config.qrFgColor,
        light: config.qrBgColor,
      },
    };

    const qrBase64 = await QRCode.toDataURL(qrData, qrOptions);

    res.json({
      success: true,
      data: {
        qrCode: qrBase64,
        clientCode: client.clientCode,
        clientName: client.clientName,
        clientUrl: client.clientUrl,
      },
    });
  } catch (error) {
    logger.error('Get client QR error:', error);
    throw new AppError('Failed to get QR code', 500);
  }
};
