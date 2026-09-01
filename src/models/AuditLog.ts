import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId?: string;
  adminName?: string;
  clientId?: string;
  clientCode?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: String,
      index: true,
    },
    adminName: {
      type: String,
      index: true,
    },
    clientId: {
      type: String,
      index: true,
    },
    clientCode: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ clientId: 1, timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
