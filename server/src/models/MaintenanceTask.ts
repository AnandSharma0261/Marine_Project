import mongoose, { Document, Schema, Types } from 'mongoose';

export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface IMaintenanceNote {
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IMaintenanceTask extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  ship: Types.ObjectId;
  assignedTo?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  dueDate: Date;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  completedAt?: Date | null;
  notes: IMaintenanceNote[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<IMaintenanceNote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const maintenanceSchema = new Schema<IMaintenanceTask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ship: { type: Schema.Types.ObjectId, ref: 'Ship', required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    completedAt: { type: Date, default: null },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true }
);

maintenanceSchema.virtual('isOverdue').get(function (this: IMaintenanceTask) {
  return this.status !== 'Completed' && this.dueDate.getTime() < Date.now();
});

maintenanceSchema.set('toJSON', { virtuals: true });
maintenanceSchema.set('toObject', { virtuals: true });

export const MaintenanceTask = mongoose.model<IMaintenanceTask>(
  'MaintenanceTask',
  maintenanceSchema
);
