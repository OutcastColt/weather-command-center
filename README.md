# Weather Command Center

A real-time weather monitoring and command dashboard application.

## Overview

Weather Command Center provides a unified interface for monitoring weather conditions, managing weather alerts, and visualizing meteorological data through an intuitive dashboard.

## Architecture

- **Frontend**: React (TypeScript) — interactive dashboard UI
- **Backend**: Node.js/Express API — weather data aggregation and processing
- **CI/CD**: GitHub Actions — automated testing and deployment

## Project Structure

```
weather-command-center/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   └── services/     # API client and data fetching
│   └── public/
├── backend/           # Express API server
│   └── src/
│       ├── routes/       # API route handlers
│       ├── middleware/   # Express middleware
│       └── services/     # Business logic and external API calls
├── .github/
│   └── workflows/    # GitHub Actions CI/CD pipelines
└── docs/             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd frontend && npm install
```

### Development

```bash
# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm start
```

### Environment Variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in the required values.

## CI/CD

GitHub Actions workflows run on every push and pull request:

- **CI**: lint, test, and build checks
- **Deploy**: automatic deployment on merge to `main`

## License

MIT
