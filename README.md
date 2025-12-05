# JGK Planner

A web application for managing sports training schedules and budgets.

## Features

- **Visual Calendar**: Yearly view with months vertical, days horizontal (Norwegian style)
- **Training Types**: Define types with colors, default trainer, and default hours
- **Trainers**: Manage trainers with hourly costs
- **Recurring Events**: Create weekly recurring activities
- **Budget Summary**: Per-year cost calculations
- **Role-based Access**: Admin, Trainer, and User roles

## Tech Stack

- React + Vite (Frontend)
- Node.js + Express (Backend)
- SQLite/JSON Database
- Google & Facebook OAuth

## Getting Started

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Run development
npm run dev
```

The app will be available at `http://localhost:5173`

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access including costs and user management |
| Trainer | Can create/edit activities and training types |
| User | View-only access to calendar |
