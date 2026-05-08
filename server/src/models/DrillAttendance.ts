import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDrillAttendance extends Document {
  _id: Types.ObjectId;
  drill: Types.ObjectId;
  user: Types.ObjectId;
  attended: boolean;
  markedAt?: Date;
  notes?: string;
}

const attendanceSchema = new Schema<IDrillAttendance>(
  {
    drill: { type: Schema.Types.ObjectId, ref: 'Drill', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attended: { type: Boolean, default: false },
    markedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ drill: 1, user: 1 }, { unique: true });

export const DrillAttendance = mongoose.model<IDrillAttendance>(
  'DrillAttendance',
  attendanceSchema
);
