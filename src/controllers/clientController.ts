import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Client from '../models/Client';
import ClientSession from '../models/ClientSession';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import { generateClientCode, generateUrlIdentifier } from '../utils/helpers';
import { config } from '../config/config';
import logger from '../middleware/logger';

export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientName, status = 'active' } = req.body;
    const admin = (req as any).user;

    const clientCode = generateClientCode();
    const urlIdentifier = generateUrlIdentifier();
    const clientId = `cl_${uuidv4().substring(0, 12)}`;
    const clientUrl = `${config.clientBaseUrl}${config.clientUrlPrefix}${clientCode}`;

    const client = new Client({
      clientId,
      clientCode,
      clientName,
      urlIdentifier,
      clientUrl,
      status,
      qrVersion: 1,
      qrStatus: 'active',
      createdBy: admin._id,
    });

    await client.save();

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_CREATED',
      details: {
        clientName: client.clientName,
        clientCode: client.clientCode,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    logger.error('Create client error:', error);
    throw new AppError('Failed to create client', 500);
  }
};

export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get clients error:', error);
    throw new AppError('Failed to get clients', 500);
  }
};

export const getClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found',
        error: { code: 'CLIENT_NOT_FOUND' },
      });
      return;
    }

    // Get active session
    const activeSession = await ClientSession.findOne({
      clientId: client._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    res.json({
      success: true,
      data: {
        ...client.toObject(),
        session: activeSession || null,
      },
    });
  } catch (error) {
    logger.error('Get client error:', error);
    throw new AppError('Failed to get client', 500);
  }
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { clientName, status } = req.body;
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

    if (clientName) client.clientName = clientName;
    if (status) client.status = status;

    await client.save();

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_UPDATED',
      details: {
        clientName,
        status,
        updatedFields: Object.keys(req.body),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    logger.error('Update client error:', error);
    throw new AppError('Failed to update client', 500);
  }
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
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

    await client.deleteOne();

    // Delete associated sessions
    await ClientSession.deleteMany({ clientId: client._id });

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_DELETED',
      details: {
        clientName: client.clientName,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    logger.error('Delete client error:', error);
    throw new AppError('Failed to delete client', 500);
  }
};

export const activateClient = async (req: Request, res: Response): Promise<void> => {
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

    client.status = 'active';
    await client.save();

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_ACTIVATED',
      details: {
        clientName: client.clientName,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client activated successfully',
      data: client,
    });
  } catch (error) {
    logger.error('Activate client error:', error);
    throw new AppError('Failed to activate client', 500);
  }
};

export const deactivateClient = async (req: Request, res: Response): Promise<void> => {
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

    client.status = 'inactive';
    client.isOnline = false;
    await client.save();

    // Revoke all sessions
    await ClientSession.updateMany(
      { clientId: client._id, status: 'active' },
      { status: 'revoked' }
    );

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_DEACTIVATED',
      details: {
        clientName: client.clientName,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client deactivated successfully',
      data: client,
    });
  } catch (error) {
    logger.error('Deactivate client error:', error);
    throw new AppError('Failed to deactivate client', 500);
  }
};

export const regenerateUrl = async (req: Request, res: Response): Promise<void> => {
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

    // Generate new client code and URL
    const newClientCode = generateClientCode();
    const newUrlIdentifier = generateUrlIdentifier();
    const newClientUrl = `${config.clientBaseUrl}${config.clientUrlPrefix}${newClientCode}`;

    client.clientCode = newClientCode;
    client.urlIdentifier = newUrlIdentifier;
    client.clientUrl = newClientUrl;
    await client.save();

    // Revoke all existing sessions
    await ClientSession.updateMany(
      { clientId: client._id, status: 'active' },
      { status: 'revoked' }
    );

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_URL_REGENERATED',
      details: {
        clientName: client.clientName,
        oldCode: req.params.id,
        newCode: newClientCode,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client URL regenerated successfully',
      data: {
        clientCode: client.clientCode,
        clientUrl: client.clientUrl,
      },
    });
  } catch (error) {
    logger.error('Regenerate URL error:', error);
    throw new AppError('Failed to regenerate URL', 500);
  }
};

export const resetClient = async (req: Request, res: Response): Promise<void> => {
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

    // Reset client
    client.status = 'inactive';
    client.isOnline = false;
    client.qrVersion += 1;
    await client.save();

    // Revoke all sessions
    await ClientSession.updateMany(
      { clientId: client._id, status: 'active' },
      { status: 'revoked' }
    );

    await AuditLog.create({
      adminId: admin._id,
      adminName: admin.username,
      clientId: client._id,
      clientCode: client.clientCode,
      action: 'CLIENT_RESET',
      details: {
        clientName: client.clientName,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Client reset successfully',
      data: client,
    });
  } catch (error) {
    logger.error('Reset client error:', error);
    throw new AppError('Failed to reset client', 500);
  }
};
