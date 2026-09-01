import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IClientSession extends Document {
  sessionId: string;
  clientId: string;
  clientCode: string;
  ipHash?: string;
  userAgent?: string;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
}

const ClientSessionSchema = new Schema<IClientSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: true,
      index: true,
    },
    ipHash: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ClientSessionSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date() || this.status !== 'active';
};

// Indexes
ClientSessionSchema.index({ sessionId: 1 });
ClientSessionSchema.index({ clientId: 1 });
ClientSessionSchema.index({ clientCode: 1 });
ClientSessionSchema.index({ status: 1 });
ClientSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IClientSession>('ClientSession', ClientSessionSchema);
