import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User';
import { Ship } from './models/Ship';
import { MaintenanceTask } from './models/MaintenanceTask';
import { Drill } from './models/Drill';
import { DrillAttendance } from './models/DrillAttendance';
import { Notification } from './models/Notification';

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const run = async () => {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Ship.deleteMany({}),
    MaintenanceTask.deleteMany({}),
    Drill.deleteMany({}),
    DrillAttendance.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('Creating ships...');
  const [neptune, poseidon, triton] = await Ship.create([
    { name: 'MV Neptune', imoNumber: 'IMO9876543', type: 'Cargo', flag: 'India', status: 'active' },
    { name: 'MV Poseidon', imoNumber: 'IMO9876544', type: 'Tanker', flag: 'India', status: 'active' },
    { name: 'MV Triton', imoNumber: 'IMO9876545', type: 'Container', flag: 'Singapore', status: 'docked' },
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@marine.com',
    password: 'admin123',
    role: 'admin',
  });

  const [crew1, crew2, crew3, crew4] = await User.create([
    { name: 'Ravi Kumar', email: 'ravi@marine.com', password: 'crew123', role: 'crew', ship: neptune._id },
    { name: 'Priya Sharma', email: 'priya@marine.com', password: 'crew123', role: 'crew', ship: neptune._id },
    { name: 'Arjun Singh', email: 'arjun@marine.com', password: 'crew123', role: 'crew', ship: poseidon._id },
    { name: 'Neha Patel', email: 'neha@marine.com', password: 'crew123', role: 'crew', ship: triton._id },
  ]);

  console.log('Creating maintenance tasks...');
  await MaintenanceTask.create([
    {
      title: 'Engine oil change',
      description: 'Replace engine oil and filters in the main engine room',
      ship: neptune._id,
      assignedTo: crew1._id,
      createdBy: admin._id,
      dueDate: daysFromNow(5),
      status: 'In Progress',
      priority: 'high',
    },
    {
      title: 'Lifeboat inspection',
      description: 'Inspect all lifeboats and ensure they are sea-worthy',
      ship: neptune._id,
      assignedTo: crew2._id,
      createdBy: admin._id,
      dueDate: daysFromNow(-3),
      status: 'Pending',
      priority: 'critical',
    },
    {
      title: 'Hull cleaning',
      description: 'Underwater hull cleaning to remove biofouling',
      ship: neptune._id,
      assignedTo: crew1._id,
      createdBy: admin._id,
      dueDate: daysFromNow(-10),
      status: 'Completed',
      priority: 'medium',
      completedAt: daysFromNow(-12),
    },
    {
      title: 'Radar calibration',
      description: 'Calibrate navigation radar on the bridge',
      ship: poseidon._id,
      assignedTo: crew3._id,
      createdBy: admin._id,
      dueDate: daysFromNow(7),
      status: 'Pending',
      priority: 'medium',
    },
    {
      title: 'Fire extinguisher refill',
      description: 'Service and refill all fire extinguishers',
      ship: poseidon._id,
      assignedTo: crew3._id,
      createdBy: admin._id,
      dueDate: daysFromNow(-1),
      status: 'In Progress',
      priority: 'high',
    },
    {
      title: 'Generator service',
      description: 'Annual maintenance of auxiliary generators',
      ship: triton._id,
      assignedTo: crew4._id,
      createdBy: admin._id,
      dueDate: daysFromNow(14),
      status: 'Pending',
      priority: 'low',
    },
    {
      title: 'GPS firmware update',
      description: 'Apply latest firmware patch to GPS unit',
      ship: triton._id,
      assignedTo: crew4._id,
      createdBy: admin._id,
      dueDate: daysFromNow(-5),
      status: 'Completed',
      priority: 'medium',
      completedAt: daysFromNow(-6),
    },
  ]);

  console.log('Creating drills...');
  const [fireDrill, evacDrill, manOverboard, abandonShip] = await Drill.create([
    {
      title: 'Monthly Fire Drill',
      type: 'fire',
      ship: neptune._id,
      scheduledDate: daysFromNow(-20),
      status: 'completed',
      completedAt: daysFromNow(-20),
      createdBy: admin._id,
    },
    {
      title: 'Evacuation Drill',
      type: 'evacuation',
      ship: neptune._id,
      scheduledDate: daysFromNow(-2),
      status: 'scheduled',
      createdBy: admin._id,
    },
    {
      title: 'Man Overboard Drill',
      type: 'man-overboard',
      ship: neptune._id,
      scheduledDate: daysFromNow(10),
      status: 'scheduled',
      createdBy: admin._id,
    },
    {
      title: 'Abandon Ship Drill',
      type: 'abandon-ship',
      ship: poseidon._id,
      scheduledDate: daysFromNow(-15),
      status: 'completed',
      completedAt: daysFromNow(-15),
      createdBy: admin._id,
    },
  ]);

  await Drill.create([
    {
      title: 'Quarterly Security Drill',
      type: 'security',
      ship: triton._id,
      scheduledDate: daysFromNow(5),
      status: 'scheduled',
      createdBy: admin._id,
    },
    {
      title: 'Medical Emergency Drill',
      type: 'medical',
      ship: poseidon._id,
      scheduledDate: daysFromNow(-25),
      status: 'completed',
      completedAt: daysFromNow(-25),
      createdBy: admin._id,
    },
  ]);

  console.log('Creating drill attendance...');
  await DrillAttendance.create([
    { drill: fireDrill._id, user: crew1._id, attended: true, markedAt: daysFromNow(-20) },
    { drill: fireDrill._id, user: crew2._id, attended: true, markedAt: daysFromNow(-20) },
    { drill: abandonShip._id, user: crew3._id, attended: true, markedAt: daysFromNow(-15) },
  ]);

  console.log('Creating notifications...');
  await Notification.create([
    {
      user: crew1._id,
      type: 'task-assigned',
      title: 'New maintenance task assigned',
      message: 'Engine oil change due in 5 days',
      link: '/tasks',
    },
    {
      user: crew2._id,
      type: 'task-overdue',
      title: 'Maintenance task overdue',
      message: 'Lifeboat inspection is past due',
      link: '/tasks',
    },
  ]);

  // Suppress unused warnings
  void evacDrill; void manOverboard;

  console.log('\nSeed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin → admin@marine.com / admin123');
  console.log('  Crew  → ravi@marine.com / crew123');
  console.log('  Crew  → priya@marine.com / crew123');
  console.log('  Crew  → arjun@marine.com / crew123');
  console.log('  Crew  → neha@marine.com / crew123');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
