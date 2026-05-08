import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const listUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.ship) filter.ship = req.query.ship;
  const users = await User.find(filter)
    .select('-password')
    .populate('ship', 'name imoNumber')
    .sort({ createdAt: -1 });
  res.json(users);
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, role, ship } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (ship !== undefined) user.ship = ship || null;
  await user.save();
  const populated = await user.populate('ship', 'name imoNumber');
  res.json({
    _id: populated._id,
    name: populated.name,
    email: populated.email,
    role: populated.role,
    ship: populated.ship,
  });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete yourself');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ message: 'User removed' });
});
