import { Request, Response } from 'express';
import Client from '../models/Client';
import ClientSession from '../models/ClientSession';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config/config';
import logger from '../middleware/logger';
import crypto from 'crypto';

export const createSession = async (req: Request, res: Response): Promise<void> => {
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

    // Check for existing active session
    const existingSession = await ClientSession.findOne({
      clientId: client._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (existingSession) {
      res.json({
        success: true,
        data: {
          sessionId: existingSession.sessionId,
          clientCode: client.clientCode,
          clientName: client.clientName,
          status: 'active',
          expiresAt: existingSession.expiresAt,
        },
      });
      return;
    }

    // Create new session
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.sessionExpiration);

    // Hash IP for privacy
    const ipHash = req.ip ? crypto.createHash('sha256').update(req.ip).digest('hex') : undefined;

    const session = new ClientSession({
      clientId: client._id,
      clientCode: client.clientCode,
      ipHash,
      userAgent: req.headers['user-agent']?.substring(0, 200),
      expiresAt,
      status: 'active',
      lastActivity: new Date(),
    });

    await session.save();

    // Update client last active and online status
    client.lastActive = new Date();
    client.isOnline = true;
    await client.save();

    await AuditLog.create({
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_SESSION_CREATED',
      details: {
        sessionId: session.sessionId,
        expiresAt,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        clientCode: client.clientCode,
        clientName: client.clientName,
        status: 'active',
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Create session error:', error);
    throw new AppError('Failed to create session', 500);
  }
};

export const validateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await ClientSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found',
        error: { code: 'SESSION_NOT_FOUND' },
      });
      return;
    }

    // Check if session is expired
    if (session.isExpired()) {
      session.status = 'expired';
      await session.save();

      // Update client status
      await Client.findOneAndUpdate(
        { _id: session.clientId },
        { isOnline: false }
      );

      res.status(401).json({
        success: false,
        message: 'Session expired',
        error: { code: 'SESSION_EXPIRED' },
      });
      return;
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        clientId: session.clientId,
        clientCode: session.clientCode,
        status: session.status,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Validate session error:', error);
    throw new AppError('Failed to validate session', 500);
  }
};

export const refreshSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await ClientSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found',
        error: { code: 'SESSION_NOT_FOUND' },
      });
      return;
    }

    if (session.isExpired()) {
      session.status = 'expired';
      await session.save();

      // Update client status
      await Client.findOneAndUpdate(
        { _id: session.clientId },
        { isOnline: false }
      );

      res.status(401).json({
        success: false,
        message: 'Session expired',
        error: { code: 'SESSION_EXPIRED' },
      });
      return;
    }

    // Extend session
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + config.sessionExpiration);
    session.expiresAt = newExpiresAt;
    session.lastActivity = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Refresh session error:', error);
    throw new AppError('Failed to refresh session', 500);
  }
};

export const revokeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await ClientSession.findOne({ sessionId });
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Session not found',
        error: { code: 'SESSION_NOT_FOUND' },
      });
      return;
    }

    session.status = 'revoked';
    await session.save();

    // Update client status
    await Client.findOneAndUpdate(
      { _id: session.clientId },
      { isOnline: false }
    );

    await AuditLog.create({
      clientId: session.clientId,
      clientCode: session.clientCode,
      action: 'CLIENT_SESSION_REVOKED',
      details: {
        sessionId: session.sessionId,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    logger.error('Revoke session error:', error);
    throw new AppError('Failed to revoke session', 500);
  }
};
