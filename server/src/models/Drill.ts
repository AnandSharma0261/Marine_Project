import mongoose, { Document, Schema, Types } from 'mongoose';

export type DrillType =
  | 'fire'
  | 'evacuation'
  | 'man-overboard'
  | 'abandon-ship'
  | 'security'
  | 'medical'
  | 'other';

export type DrillStatus = 'scheduled' | 'completed' | 'missed';

export interface IDrill extends Document {
  _id: Types.ObjectId;
  title: string;
  type: DrillType;
  ship: Types.ObjectId;
  scheduledDate: Date;
  durationMinutes: number;
  status: DrillStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const drillSchema = new Schema<IDrill>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['fire', 'evacuation', 'man-overboard', 'abandon-ship', 'security', 'medical', 'other'],
      required: true,
    },
    ship: { type: Schema.Types.ObjectId, ref: 'Ship', required: true, index: true },
    scheduledDate: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

drillSchema.virtual('isMissed').get(function (this: IDrill) {
  return this.status === 'scheduled' && this.scheduledDate.getTime() < Date.now();
});

drillSchema.set('toJSON', { virtuals: true });
drillSchema.set('toObject', { virtuals: true });

export const Drill = mongoose.model<IDrill>('Drill', drillSchema);
