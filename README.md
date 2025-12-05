# JGK Planner - Sports Calendar & Budget Tracker

A web application for managing sports training schedules and budgets. Features a visual yearly calendar, training type management, trainer costs, and automatic budget calculations.

## Features

- **Visual Calendar**: Yearly view with months vertical, days horizontal (Norwegian style)
- **Training Types**: Define types with colors, default trainer, and default hours
- **Trainers**: Manage trainers with hourly costs (admin only)
- **Recurring Events**: Create weekly recurring activities (1-2 days per week)
- **Exception Handling**: Delete single occurrences from recurring series
- **Budget Summary**: Per-year cost calculations by type and trainer
- **Role-based Access**: Admin, Trainer, and User roles

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Auth**: Google OAuth + Facebook OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone git@github.com:kjarisk/jgkplanner.git
cd jgkplanner
```

2. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

3. Create environment file:
```bash
cp server/.env.example server/.env
```

4. Configure OAuth (optional for development):
   - Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Get Facebook OAuth credentials from [Facebook Developers](https://developers.facebook.com/)
   - Update `server/.env` with your credentials

### Development

Run both frontend and backend:
```bash
npm run dev
```

Or run separately:
```bash
# Backend (port 3001)
cd server && npm run dev

# Frontend (port 5173)
cd client && npm run dev
```

### Development Login

In development mode, you can use the dev login buttons on the login page to test different roles without OAuth setup.

## User Roles

| Permission | Admin | Trainer | User |
|------------|-------|---------|------|
| View calendar | Yes | Yes | Yes |
| Create/edit activities | Yes | Yes | No |
| Manage training types | Yes | Yes | No |
| Manage trainers/costs | Yes | No | No |
| View costs/prices | Yes | No | No |
| Manage users | Yes | No | No |

## Deployment

1. Build the frontend:
```bash
npm run build
```

2. Set production environment variables
3. Run:
```bash
npm start
```

## API Endpoints

### Auth
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/facebook` - Facebook OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Activities
- `GET /api/activities/year/:year` - Get activities for a year
- `POST /api/activities` - Create single activity
- `POST /api/activities/recurring` - Create recurring series
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `GET /api/activities/budget/:year` - Get budget summary (admin)

### Training Types
- `GET /api/types` - List all types
- `POST /api/types` - Create type
- `PUT /api/types/:id` - Update type
- `DELETE /api/types/:id` - Delete type

### Trainers (admin only)
- `GET /api/trainers` - List trainers
- `POST /api/trainers` - Create trainer
- `PUT /api/trainers/:id` - Update trainer
- `DELETE /api/trainers/:id` - Delete trainer

### Users (admin only)
- `GET /api/users` - List users
- `PATCH /api/users/:id/role` - Update user role

## License

MIT

