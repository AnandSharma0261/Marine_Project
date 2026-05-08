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
<img width="2864" height="1588" alt="image" src="https://github.com/user-attachments/assets/f3b2a3bd-92d1-4b6a-8b2e-5935013be8a7" />
<img width="2864" height="1648" alt="image" src="https://github.com/user-attachments/assets/f0c7713f-9435-4e71-9fc8-760082431dd1" />
<img width="2868" height="1636" alt="image" src="https://github.com/user-attachments/assets/3f3ab172-84cd-4df1-bcfb-e79053e20ca1" />
<img width="2858" height="1640" alt="image" src="https://github.com/user-attachments/assets/668a9ce2-f5f0-42c9-84fb-7d7f951ceb9c" />
<img width="2864" height="1644" alt="image" src="https://github.com/user-attachments/assets/afcdef26-02e3-44ba-b2dc-4c973178e671" />
<img width="2864" height="2300" alt="screencapture-marine-project-tau-vercel-app-2026-05-08-17_29_35" src="https://github.com/user-attachments/assets/e6dc208f-9348-4ac9-82a0-05b5ad7eb3af" />






