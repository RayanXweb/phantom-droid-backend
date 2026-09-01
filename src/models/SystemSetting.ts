import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  category: 'website' | 'client' | 'qr' | 'api' | 'security';
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['website', 'client', 'qr', 'api', 'security'],
      required: true,
    },
    description: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
