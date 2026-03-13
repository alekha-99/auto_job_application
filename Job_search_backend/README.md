# Job Search Microservice

A production-ready **Node.js + TypeScript + Express** microservice that integrates Google OAuth, JWT authentication, and the [RapidAPI Active Jobs DB](https://rapidapi.com/fantastic-jobs-fantastic-jobs-default/api/active-jobs-db) to fetch, cache, and serve job listings from a PostgreSQL database.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript 5
- **Framework**: Express.js
- **ORM**: Prisma 5
- **Database**: PostgreSQL
- **Auth**: Passport.js (Google OAuth 2.0) + JWT
- **Job API**: RapidAPI Active Jobs DB
- **Scheduler**: node-cron (every 6 hours)
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Pino
- **Validation**: Zod
- **Testing**: Jest + Supertest

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL running locally
- Google Cloud OAuth 2.0 credentials
- RapidAPI key for Active Jobs DB

### Setup

```bash
# Install dependencies
npm install

# Copy env and fill in your credentials
cp .env.example .env

# Push schema to database
npx prisma db push

# Start dev server
npm run dev
```

The server starts at `http://localhost:3000`.

### Google OAuth Setup

Add `http://localhost:3000/api/auth/google/callback` as an **Authorized redirect URI** in your [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 credentials.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/api/auth/google` | No | Start Google OAuth |
| `GET` | `/api/auth/google/callback` | No | OAuth callback → JWT |
| `GET` | `/api/auth/me` | JWT | Current user profile |
| `GET` | `/api/jobs` | JWT | List jobs (paginated, filterable) |
| `GET` | `/api/jobs/:id` | JWT | Get single job |
| `POST` | `/api/jobs/sync` | JWT | Trigger manual job sync |

### Query Parameters for `GET /api/jobs`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (max: 100, default: 20) |
| `title` | string | Filter by job title |
| `location` | string | Filter by location |
| `organization` | string | Filter by company |
| `remote` | boolean | Filter remote jobs |
| `source` | string | Filter by ATS source |
| `sortBy` | string | Sort field (default: datePosted) |
| `order` | asc/desc | Sort direction (default: desc) |

### Usage Example

```bash
# 1. Open in browser to authenticate:
#    http://localhost:3000/api/auth/google

# 2. Copy the JWT token from the response

# 3. Sync jobs into the database
curl -X POST http://localhost:3000/api/jobs/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title_filter": "Software Engineer", "location_filter": "United States"}'

# 4. Query cached jobs
curl http://localhost:3000/api/jobs?title=engineer&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with ts-node |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run Jest test suite |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run Prisma migrations |

## Project Structure

```
├── prisma/schema.prisma        # Database models (User, Job)
├── src/
│   ├── config/                 # env (Zod), prisma, passport
│   ├── middlewares/            # JWT auth guard, error handler
│   ├── modules/
│   │   ├── auth/               # Google OAuth + JWT
│   │   └── jobs/               # CRUD, API sync, cron
│   ├── utils/                  # ApiError class
│   ├── app.ts                  # Express setup
│   └── server.ts               # Entry point
├── tests/                      # Jest + Supertest tests
├── .env.example
└── package.json
```

## License

ISC
