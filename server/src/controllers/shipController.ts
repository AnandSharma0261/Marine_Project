import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ship } from '../models/Ship';
import { AuthRequest } from '../middleware/auth';

export const listShips = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const ships = await Ship.find().sort({ name: 1 });
  res.json(ships);
});

export const getShip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ship = await Ship.findById(req.params.id);
  if (!ship) {
    res.status(404);
    throw new Error('Ship not found');
  }
  res.json(ship);
});

export const createShip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ship = await Ship.create(req.body);
  res.status(201).json(ship);
});

export const updateShip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ship = await Ship.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!ship) {
    res.status(404);
    throw new Error('Ship not found');
  }
  res.json(ship);
});

export const deleteShip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ship = await Ship.findByIdAndDelete(req.params.id);
  if (!ship) {
    res.status(404);
    throw new Error('Ship not found');
  }
  res.json({ message: 'Ship removed' });
});
