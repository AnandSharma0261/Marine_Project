import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Notification } from '../models/Notification';
import { MaintenanceTask } from '../models/MaintenanceTask';
import { Drill } from '../models/Drill';
import { AuthRequest } from '../middleware/auth';

export const listMine = asyncHandler(async (req: AuthRequest, res: Response) => {
  await syncOverdueNotifications(req.user!._id.toString(), req.user!.role);
  const notifications = await Notification.find({ user: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({
    user: req.user!._id,
    read: false,
  });
  res.json({ notifications, unreadCount });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { read: true }
  );
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ user: req.user!._id, read: false }, { read: true });
  res.json({ ok: true });
});

const syncOverdueNotifications = async (userId: string, role: string) => {
  const now = new Date();

  if (role === 'crew') {
    const overdueTasks = await MaintenanceTask.find({
      assignedTo: userId,
      status: { $ne: 'Completed' },
      dueDate: { $lt: now },
    });
    for (const t of overdueTasks) {
      const exists = await Notification.findOne({
        user: userId,
        type: 'task-overdue',
        link: `/tasks/${t._id}`,
      });
      if (!exists) {
        await Notification.create({
          user: userId,
          type: 'task-overdue',
          title: 'Maintenance task overdue',
          message: `${t.title} is past its due date`,
          link: `/tasks/${t._id}`,
        });
      }
    }
  } else {
    const overdueTasks = await MaintenanceTask.find({
      status: { $ne: 'Completed' },
      dueDate: { $lt: now },
    }).limit(20);
    for (const t of overdueTasks) {
      const exists = await Notification.findOne({
        user: userId,
        type: 'task-overdue',
        link: `/tasks/${t._id}`,
      });
      if (!exists) {
        await Notification.create({
          user: userId,
          type: 'task-overdue',
          title: 'Maintenance task overdue',
          message: `${t.title} is past its due date`,
          link: `/tasks/${t._id}`,
        });
      }
    }
    const missedDrills = await Drill.find({
      status: 'scheduled',
      scheduledDate: { $lt: now },
    }).limit(20);
    for (const d of missedDrills) {
      const exists = await Notification.findOne({
        user: userId,
        type: 'drill-missed',
        link: `/drills/${d._id}`,
      });
      if (!exists) {
        await Notification.create({
          user: userId,
          type: 'drill-missed',
          title: 'Drill missed',
          message: `${d.title} was scheduled on ${d.scheduledDate.toLocaleString()}`,
          link: `/drills/${d._id}`,
        });
      }
    }
  }
};
