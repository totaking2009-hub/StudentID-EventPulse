# EventPulse API

A Node.js / Express / MongoDB backend for discovering events, registering for them, and receiving live announcements — built to the EventPulse project rubric (Tasks 1–7).

> **Naming convention:** the rubric asks for the repository/file name to follow `(Student ID)-EventPulse`. Rename this folder / repository to **`<yourStudentID>-EventPulse`** before you commit and submit — it isn't set here since your student ID wasn't provided.

## Tech stack
Express, Mongoose (MongoDB), JWT + bcrypt, express-validator, Socket.io, Jest + Supertest, Swagger (OpenAPI).

## Project structure (MVC)
```
config/       db.js, swagger.js
models/       User, Category, Event, Registration, Message (one schema per file)
controllers/  business logic — routes stay thin
routes/       route definitions + Swagger JSDoc annotations
middleware/   auth (requireAuth/requireRole), validate, validators, errorMiddleware
utils/        AppError, asyncHandler
sockets/      Socket.io setup (rooms per event, admin broadcast)
seed/         seed.js — idempotent sample data
tests/        Jest unit + Supertest integration tests
```

## Setup
```bash
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed               # creates categories, sample events, and an admin user
npm run dev                 # nodemon, or `npm start` for production
```
The server reads `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from environment variables (see `.env.example`). No secret is hard-coded or committed — `.env` is git-ignored.

Seeded admin login (change `ADMIN_PASSWORD` in `.env` before running in anything but a local sandbox):
- email: value of `ADMIN_EMAIL` (default `admin@eventpulse.com`)
- password: value of `ADMIN_PASSWORD` (default `Admin@12345`)

## API docs
- Interactive Swagger UI: `GET /api-docs`
- Postman collection: `EventPulse.postman_collection.json` + `EventPulse.postman_environment.json` (import both; the collection uses `{{baseUrl}}`, `{{token}}`, etc. so no URL or secret is hard-coded)
- Health check: `GET /health` — reports server status and current DB connection state

## Auth & roles
- `POST /api/auth/register` — creates an `attendee` (role is never taken from the client)
- `POST /api/auth/login` — returns a JWT carrying the user id and role
- `requireAuth` — verifies the token and rejects missing/expired/tampered tokens with 401
- `requireRole('admin')` — reads the role from the verified token, not the request body; used to protect event-management routes with 403 for non-admins

## Events (`/api/events`)
Full CRUD, with:
- filtering: `?category=&city=&startDate=&endDate=` (combinable)
- pagination: `?page=&limit=`
- sorting: `?sortBy=date|registrations&order=asc|desc`
- text search: `?search=` across name + description
- every event response includes its category via `populate()`

## Registrations (`/api/events/:eventId/register`, `/api/registrations`)
- registering checks the event's capacity and blocks duplicate registrations (enforced both at the application level and with a unique `(user, event)` index as a race-condition safety net)
- `GET /api/registrations/my` — the current user's registrations
- `DELETE /api/registrations/:id` — cancel (frees a slot); a user cannot cancel someone else's registration (403)

## Real-time announcements (Socket.io)
Client connects with a JWT (`socket.handshake.auth.token`), then:
- emits `join_event` `{ eventId }` to join that event's room
- admin emits `send_announcement` `{ eventId, content }` — persisted to MongoDB (`Message` model) and broadcast to the room as `announcement`
- `GET /api/events/:eventId/messages` returns the full history, ordered by time, for attendees who join late

## Validation & error handling
- `express-validator` rules on every POST/PATCH route; failures return a structured `422` listing each invalid field
- `AppError` (`utils/AppError.js`) represents operational errors with a status code; `asyncHandler` (`utils/asyncHandler.js`) forwards any rejected promise to the central error middleware
- `middleware/errorMiddleware.js` translates Mongoose cast/validation/duplicate-key errors and JWT errors into clear responses, and never leaks internal error details for unexpected (non-operational) errors

## Tests
```bash
npm test
```
- `tests/appError.test.js`, `tests/asyncHandler.test.js` — unit tests (success + failure cases) using Jest
- `tests/events.test.js` — Supertest integration tests against an in-memory MongoDB (`mongodb-memory-server`), covering create/list/filter and the validation + auth failure paths

> Note: `mongodb-memory-server` downloads a local MongoDB binary the first time it runs, so `npm test` needs outbound network access on first run (it's cached after that).

## Deployment
1. Create a MongoDB Atlas cluster and put the connection string in `MONGO_URI`.
2. Deploy to Vercel and set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` as environment variables on the platform (never in code).
3. Confirm `/health` on the deployed URL.
4. Git workflow: commit using [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add event registration endpoint`), tag the release `v1.0.0`, and open a Pull Request describing the delivered work.
5. Share the repository and deployment link with "Anyone – can view" access.
