import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Drill } from '../models/Drill';
import { DrillAttendance } from '../models/DrillAttendance';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

interface DrillQuery {
  ship?: string;
  status?: string;
  type?: string;
  scheduledBefore?: string;
  scheduledAfter?: string;
}

export const listDrills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = req.query as DrillQuery;
  const filter: Record<string, unknown> = {};

  if (req.user!.role === 'crew' && req.user!.ship) {
    filter.ship = req.user!.ship;
  } else if (q.ship) {
    filter.ship = q.ship;
  }

  if (q.status) filter.status = q.status;
  if (q.type) filter.type = q.type;

  const dateFilter: Record<string, Date> = {};
  if (q.scheduledBefore) dateFilter.$lte = new Date(q.scheduledBefore);
  if (q.scheduledAfter) dateFilter.$gte = new Date(q.scheduledAfter);
  if (Object.keys(dateFilter).length) filter.scheduledDate = dateFilter;

  const drills = await Drill.find(filter)
    .populate('ship', 'name imoNumber')
    .populate('createdBy', 'name')
    .sort({ scheduledDate: 1 });

  res.json(drills);
});

export const getDrill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const drill = await Drill.findById(req.params.id)
    .populate('ship', 'name imoNumber')
    .populate('createdBy', 'name');
  if (!drill) {
    res.status(404);
    throw new Error('Drill not found');
  }
  const attendances = await DrillAttendance.find({ drill: drill._id }).populate(
    'user',
    'name email'
  );
  res.json({ drill, attendances });
});

export const createDrill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, type, ship, scheduledDate, durationMinutes, notes } = req.body;
  const drill = await Drill.create({
    title,
    type,
    ship,
    scheduledDate,
    durationMinutes: durationMinutes || 30,
    notes,
    createdBy: req.user!._id,
  });

  const crew = await User.find({ ship, role: 'crew' });
  if (crew.length) {
    await Notification.insertMany(
      crew.map((c) => ({
        user: c._id,
        type: 'drill-scheduled',
        title: 'New drill scheduled',
        message: `${title} on ${new Date(scheduledDate).toLocaleString()}`,
        link: `/drills/${drill._id}`,
      }))
    );
  }

  const populated = await drill.populate('ship', 'name imoNumber');
  res.status(201).json(populated);
});

export const updateDrill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const drill = await Drill.findById(req.params.id);
  if (!drill) {
    res.status(404);
    throw new Error('Drill not found');
  }
  const updatable = ['title', 'type', 'ship', 'scheduledDate', 'durationMinutes', 'notes', 'status'];
  for (const key of updatable) {
    if (key in req.body) (drill as unknown as Record<string, unknown>)[key] = req.body[key];
  }
  if (drill.status === 'completed' && !drill.completedAt) {
    drill.completedAt = new Date();
  }
  await drill.save();
  const populated = await drill.populate('ship', 'name imoNumber');
  res.json(populated);
});

export const deleteDrill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const drill = await Drill.findByIdAndDelete(req.params.id);
  if (!drill) {
    res.status(404);
    throw new Error('Drill not found');
  }
  await DrillAttendance.deleteMany({ drill: drill._id });
  res.json({ message: 'Drill removed' });
});

export const completeDrill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const drill = await Drill.findById(req.params.id);
  if (!drill) {
    res.status(404);
    throw new Error('Drill not found');
  }
  drill.status = 'completed';
  drill.completedAt = new Date();
  if (req.body.notes) drill.notes = req.body.notes;
  await drill.save();
  res.json(drill);
});

export const markAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { attended, notes } = req.body;
  const drillId = req.params.id;
  const drill = await Drill.findById(drillId);
  if (!drill) {
    res.status(404);
    throw new Error('Drill not found');
  }
  if (
    req.user!.role === 'crew' &&
    req.user!.ship &&
    drill.ship.toString() !== req.user!.ship.toString()
  ) {
    res.status(403);
    throw new Error('You are not on this ship');
  }
  const attendance = await DrillAttendance.findOneAndUpdate(
    { drill: drillId, user: req.user!._id },
    {
      drill: drillId,
      user: req.user!._id,
      attended: attended ?? true,
      notes,
      markedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  res.json(attendance);
});

export const myAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const records = await DrillAttendance.find({ user: req.user!._id }).populate(
    'drill',
    'title type scheduledDate ship status'
  );
  res.json(records);
});
