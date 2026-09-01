import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  clientId: string;
  clientCode: string;
  clientName: string;
  urlIdentifier: string;
  clientUrl: string;
  status: 'active' | 'inactive' | 'expired';
  qrVersion: number;
  qrStatus: 'active' | 'inactive';
  lastActive?: Date;
  isOnline: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      minlength: 6,
      maxlength: 20,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    urlIdentifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
    },
    qrVersion: {
      type: Number,
      default: 1,
    },
    qrStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastActive: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ClientSchema.index({ clientId: 1 });
ClientSchema.index({ clientCode: 1 });
ClientSchema.index({ urlIdentifier: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ isOnline: 1 });
ClientSchema.index({ createdAt: -1 });

export default mongoose.model<IClient>('Client', ClientSchema);
