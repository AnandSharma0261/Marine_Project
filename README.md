Maritime Operations & Compliance System

Context
This is a platform for a marine organization to manage:
● Ship maintenance activities
● Safety drills and crew participation
● Compliance monitoring across ships

The goal is to help make sure ships are operationally safe and compliant with regulations.

What it does
● Admins manage maintenance tasks and safety drills
● Crew members participate and log activities
● The system tracks compliance and shows the risks

Tech Stack

Frontend
● React with TypeScript
● Vite
● Tailwind CSS + shadcn/ui
● Recharts for charts
● React Query for data
● React Router for pages

Backend
● Node.js with Express (TypeScript)
● MongoDB with Mongoose
● JWT for authentication
● bcrypt for password hashing

Database
● MongoDB

Features

1. Ship Maintenance Module

Admin can:
● Create maintenance tasks for ships
● Assign tasks to crew members
● Update task status: Pending / In Progress / Completed
● Set priority and due date

Crew can:
● View their assigned tasks
● Update status
● Add notes and comments

2. Safety Drill Management

Admin:
● Schedule safety drills (fire, evacuation, man-overboard, etc.)
● Assign drills to ships

Crew:
● View upcoming drills on their ship
● Mark attendance
● Submit drill completion

3. Compliance Dashboard

Shows:
● Pending maintenance tasks
● Missed drills
● Completed vs pending activities

Highlights:
● Overdue maintenance
● Missed safety drills

Business Rules
● A maintenance task has a due date
● A drill has a scheduled date
● If not completed on time, it is marked as non-compliant
● Compliance is calculated from:
   ○ Completed maintenance %
   ○ Drill participation %

Bonus Features (all included)
● Role-based access control (admin / crew)
● Filters by ship, status, date, type
● Notifications for overdue tasks and scheduled drills
● Charts for compliance (pie + bar charts)
● Docker setup with docker-compose

Folder Structure

Marine/
├── client/                 React frontend (Vite + TS)
│   ├── src/
│   │   ├── pages/          Login, Dashboard, Maintenance, Drills, Ships, Users, MyTasks, MyDrills
│   │   ├── components/     Layout, Sidebar, NotificationBell, ProtectedRoute, ui/
│   │   ├── context/        AuthContext
│   │   ├── lib/            axios + utils
│   │   └── types/          shared types
│   └── Dockerfile
│
├── server/                 Node backend (Express + TS)
│   ├── src/
│   │   ├── models/         User, Ship, MaintenanceTask, Drill, DrillAttendance, Notification
│   │   ├── controllers/    one per resource
│   │   ├── routes/         one per resource
│   │   ├── middleware/     auth (JWT), authorize (role), error handlers
│   │   ├── utils/          compliance calculator, JWT signer
│   │   ├── config/db.ts    mongoose connection
│   │   ├── app.ts          express app
│   │   ├── server.ts       entry point
│   │   └── seed.ts         demo data
│   └── Dockerfile
│
├── docker-compose.yml
├── README.md               this file
├── BUSINESS_FLOW.md        end-to-end flow with diagrams
└── DEPLOYMENT.md           step by step deploy guide


Setup Steps

You can run this in two ways: Docker (one command) or locally.

Option 1: Docker

You need Docker Desktop installed.

cd Marine
docker compose up --build

In a new terminal, seed the demo data once:
docker compose exec server npm run seed

Open http://localhost:5173

To stop: docker compose down
To wipe data: docker compose down -v

Option 2: Run locally

You need Node 20+ and MongoDB running on localhost:27017.

Backend:
cd server
cp .env.example .env
npm install
npm run seed
npm run dev

(server starts at http://localhost:5000)

Frontend (in a new terminal):
cd client
npm install
npm run dev

(app opens at http://localhost:5173)

The Vite dev server proxies /api/* to the backend on port 5000, so there are no CORS issues during development.

Demo Login

After running the seed script:

Role     Email                Password
Admin    admin@marine.com     admin123
Crew     ravi@marine.com      crew123
Crew     priya@marine.com     crew123
Crew     arjun@marine.com     crew123
Crew     neha@marine.com      crew123

Ravi and Priya are on MV Neptune. Arjun is on MV Poseidon. Neha is on MV Triton.


How Compliance is Calculated

The logic is in server/src/utils/compliance.ts.

For each ship:

Maintenance score
   completionRate = completed / total tasks * 100
   overduePenalty = overdue / total * 25
   maintenanceScore = max(0, completionRate - overduePenalty)

Drill score
   drillCompletionRate = completed drills / total drills * 100
   participationRate = actual attendances / (completed drills * crew count) * 100
   drillScore = (drillCompletionRate + participationRate) / 2

Overall score = average of maintenanceScore and drillScore

Status:
   85 or above   →  compliant
   60 to 84      →  at-risk
   below 60      →  non-compliant

If a ship has no tasks or no drills the score is 100 for that part (no compliance debt).

This means a ship can finish every task on time but still be at-risk if drill attendance is poor — which is the right signal.


Architecture Decisions

Why this stack
● MongoDB fits the domain well. A task has nested notes, a drill has attendance records — these are natural documents.
● Express with TypeScript keeps the backend small and easy to follow.
● React Query handles server state on the frontend so we do not need Redux or manual cache work.
● shadcn/ui gives us accessible Radix-based components without any vendor CSS.
● JWT is stateless so any server instance can serve any request.

How the code is organized
● models/ defines schemas and any instance methods (like matchPassword)
● controllers/ handle the HTTP shape (parse req, call logic, send res)
● utils/compliance.ts holds the business logic, separated so it can be unit tested
● middleware/ has auth and error handling
● routes/ only does wiring

Role-based access
● The protect middleware verifies the JWT and loads the user.
● The authorize('admin') middleware blocks crew from admin-only routes.
● List endpoints scope results based on role. Crew only see their own tasks. Crew only see drills on their ship.
● The frontend has a ProtectedRoute wrapper and a different sidebar per role.

Notifications
● Created when a task is assigned, when a drill is scheduled.
● When a user opens the bell, the server back-fills overdue/missed notifications so the bell stays accurate without a cron job.
● A real production system would use a scheduled worker for this.


API Reference (short)

All endpoints start with /api. Most need a JWT in the Authorization header.

Auth
   POST   /auth/register        public
   POST   /auth/login           public
   GET    /auth/me              any user

Ships
   GET    /ships                any user
   POST   /ships                admin
   PUT    /ships/:id            admin
   DELETE /ships/:id            admin

Maintenance Tasks
   GET    /tasks                any (crew sees only their own)
                                filters: ship, status, assignedTo, overdue, dueBefore, dueAfter
   GET    /tasks/:id            any
   POST   /tasks                admin
   PUT    /tasks/:id            admin or assigned crew
   POST   /tasks/:id/notes      admin or assigned crew
   DELETE /tasks/:id            admin

Drills
   GET    /drills               any (crew sees only drills on their ship)
   GET    /drills/:id           any
   POST   /drills               admin
   PUT    /drills/:id           admin
   DELETE /drills/:id           admin
   POST   /drills/:id/complete  admin
   POST   /drills/:id/attendance  crew (mark own attendance)
   GET    /drills/my-attendance any (own attendance records)

Users
   GET    /users                admin
   PUT    /users/:id            admin
   DELETE /users/:id            admin

Dashboard
   GET    /dashboard/summary    admin (fleet view + compliance)
   GET    /dashboard/me         any (personal view)

Notifications
   GET    /notifications        any
   PUT    /notifications/:id/read    any
   PUT    /notifications/read-all    any


Deployment

See DEPLOYMENT.md for a step by step guide. The recommended free setup is:
● MongoDB Atlas — database
● Render — backend
● Vercel — frontend


Submission
● GitHub repo: (add your link here)
● Business flow document: BUSINESS_FLOW.md
● Setup steps and architecture: this README
● Deployed link: (add after deploy)
