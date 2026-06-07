# AGENTS.md — AndesTur Backend

## Stack

- **Runtime:** Node.js ESM (`"type": "module"`)
- **Framework:** Express 5
- **ORM:** Sequelize 6 + PostgreSQL
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (Sequelize model hooks)
- **Validation:** Zod schemas
- **Testing:** Jest + Supertest (all models mocked, no DB needed)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Nodemon dev server on `src/server.js` |
| `npm start` | Production start |
| `npm test` | ESM Jest (see exact flags below) |
| `npm run seed` | Seeds roles (admin, user) + admin user |
| `npm run send-report` | Generates weekly report PDF + emails it |

**Test command (full):**
```
cross-env NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --runInBand --detectOpenHandles
```

Tests live in `src/tests/**/*.test.js` and mock all models via `jest.spyOn`. `afterEach: jest.restoreAllMocks()` is required.

## Project layout

```
src/
├── config/db.js           # Sequelize instance (PostgreSQL)
├── controllers/           # Named-export handler functions
├── middleware/
│   ├── index.js           # Barrel re-export of all middleware
│   ├── auth.middleware.js  # JWT: generateToken, authenticateToken, authorizeRole
│   ├── validation.middleware.js  # Zod: validateSchema(schema, source), validateData
│   └── errorHandler.middleware.js  # AppError, errorHandler, notFoundHandler, asyncHandler
├── models/
│   ├── index.js            # Imports all models, defines associations
│   └── *.models.js         # Each model; export = pascalCase, e.g. `usersModel`
├── routes/index.js         # Mounts all route groups under /api
├── routes/*.routes.js      # Route definitions
├── server.js               # App bootstrap + listener (skipped in test env)
├── tasks/weeklyReport.task.js  # node-cron weekly PDF report
├── scripts/                # One-off utilities
├── validations/schemas.js  # All Zod schemas
└── tests/                  # Jest *.test.js files
```

## Conventions

- **Imports:** Always use `../` relative paths with `.js` extensions (ESM).
- **Controllers:** Named exports, `try-catch` directly (not yet using `asyncHandler` wrapper).
- **Routes:** Import middleware from `../middleware/index.js`. Apply `authenticateToken` then optionally `authorizeRole(...roles)`.
- **Validation:** `validateSchema(schema, "body")` returns 400 on failure, sets `req.bodyValidated` on success.
- **Errors:** Throw `new AppError("message", statusCode)` in controllers; the centralized `errorHandler` at the end of the middleware stack catches all errors.

## Middleware order (server.js)

```
helmet → cors → express.json → morgan → swaggerDocs → /api routes → notFoundHandler → errorHandler
```

## Key environment variables (`.env`)

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT` (default 3000), `JWT_SECRET`, `JWT_EXPIRATION` (default `24h`), `EMAIL_USER`, `EMAIL_PASS`, `NODE_ENV`.

Copy `.env.example` to `.env`.

## Swagger

Available at `GET /api/docs`. JSDoc annotations in controllers. Swagger definition in `src/swagger.js`.

## Seeding

`npm run seed` creates roles **admin** and **user**, plus a default admin user (`admin@andestur.com` / `Admin123!`). Idempotent (skips if data exists).

## DB notes

- Sequelize `underscored: true` — model columns use `snake_case` in DB, `camelCase` in JS.
- `sequelize.sync()` runs on startup (not migrations).
- Password hashing is handled by Sequelize hooks (`beforeCreate`, `beforeUpdate`) on `usersModel`.
