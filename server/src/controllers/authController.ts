import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../models/User';
import { signToken } from '../utils/token';
import { AuthRequest } from '../middleware/auth';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, ship } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('name, email and password are required');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already in use');
  }
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'crew',
    ship: ship || null,
  });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ship: user.ship,
    token: signToken(user._id.toString()),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('email and password are required');
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    ship: user.ship,
    token: signToken(user._id.toString()),
  });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id).populate('ship', 'name imoNumber');
  res.json(user);
});
