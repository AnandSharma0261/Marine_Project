# Marine Operations & Compliance System

A full-stack app for a marine company to track ship maintenance, safety drills, and compliance.

- **Admins** manage ships, tasks, and drills
- **Crew** see assigned tasks and mark attendance
- **Dashboard** shows compliance scores and overdue items

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind, shadcn/ui, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB
- **Auth:** JWT

## How to Run

You need **Node 20+** and **MongoDB** running on `localhost:27017`.

**1. Backend**
```bash
cd server
cp .env.example .env
npm install
npm run seed     # adds demo data
npm run dev      # starts on http://localhost:5000
```

**2. Frontend** (new terminal)
```bash
cd client
npm install
npm run dev      # opens http://localhost:5173
```

Or with Docker (one command):
```bash
docker compose up --build
docker compose exec server npm run seed
```

## Demo Login

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@marine.com   | admin123   |
| Crew  | ravi@marine.com    | crew123    |
| Crew  | priya@marine.com   | crew123    |

## Features

**Maintenance**
- Create, assign, and update tasks
- Track due dates and overdue items
- Crew can update status and add notes

**Drills**
- Schedule drills (fire, evacuation, etc.)
- Crew marks attendance
- Track participation per ship

**Compliance Dashboard**
- Overall fleet score
- Per-ship compliance status
- Charts for maintenance and drills
- Overdue and missed alerts

**Bonus**
- Role-based access (admin / crew)
- Filters by ship, status, date
- In-app notifications
- Docker setup

## How Compliance Score Works

For each ship:

```
Maintenance score = completion %  -  overdue penalty
Drill score       = average of (completion %, attendance %)
Overall           = average of both
```

Status:
- **85+** → compliant
- **60–84** → at-risk
- **<60** → non-compliant

Logic is in `server/src/utils/compliance.ts`.

## Project Structure

```
Marine/
├── client/         React frontend
├── server/         Node backend
├── docker-compose.yml
├── BUSINESS_FLOW.md   end-to-end flow
└── DEPLOYMENT.md      step by step deploy guide
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for free deploy on Render + Vercel + MongoDB Atlas.
