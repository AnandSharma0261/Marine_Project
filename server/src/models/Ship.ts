import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShip extends Document {
  _id: Types.ObjectId;
  name: string;
  imoNumber: string;
  type: string;
  flag?: string;
  status: 'active' | 'docked' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const shipSchema = new Schema<IShip>(
  {
    name: { type: String, required: true, trim: true },
    imoNumber: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    flag: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'docked', 'maintenance'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Ship = mongoose.model<IShip>('Ship', shipSchema);
