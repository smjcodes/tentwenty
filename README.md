# Contest Participation System

Backend-only interview assignment built with Strapi v5, TypeScript, and PostgreSQL.

## Overview

This project implements a complete contest participation backend where:

- guests can browse contests
- normal authenticated users can join and submit only `NORMAL` contests
- VIP users can join and submit both `NORMAL` and `VIP` contests
- contest submissions are scored automatically
- users can view leaderboard, history, in-progress contests, and prizes
- admins manage content from Strapi Admin Panel
- a dedicated content API admin role can award prizes through the custom API

## Tech Stack

- Strapi `5.49.0`
- TypeScript
- PostgreSQL
- Strapi Users & Permissions plugin
- `pg` PostgreSQL driver

## Quick review/test Guide

##  Test Online

I have deployed this assignment on the cloud for quick and easy review/testing.

### Backend (Strapi)
- **Strapi Live API URL**: [https://effortless-chickens-aca8e2539a.strapiapp.com/](https://effortless-chickens-aca8e2539a.strapiapp.com/)
- **Strapi Admin Panel**: [https://effortless-chickens-aca8e2539a.strapiapp.com/admin](https://effortless-chickens-aca8e2539a.strapiapp.com/admin)

**Super Admin Credentials**
- **Email**: `smjcodes@gmail.com`
- **Password**: `Pakistan1`

### Frontend (Next.js)
- **Live URL**: [https://frontend-umber-mu-36.vercel.app/](https://frontend-umber-mu-36.vercel.app/)

**Pre-saved Test Accounts**  
Normal User, VIP User, and Admin accounts are available with pre-configured credentials for easy testing.




## Testing Locally with Postman

Follow these steps to get the project running locally and test the APIs.

### Step 1: Clone the repository

### Step 2: Create the PostgreSQL database

Create a database named:

`contest_participation_system`

### Step 3: Install dependencies and build

Run the following commands from the project root:

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
- `pnpm develop`



### Step 4: Copy `.env.example` to `.env`. and set database username and password according to yours


### Step 5: Import the Postman collection

Open Postman and import the collection from the `postman/` folder.

### Step 6: Run "List Contests" first

Before testing other endpoints, run the **List Contests** request. This returns the contest IDs you'll need as inputs for the rest of the requests.

### Step 7: Test the remaining APIs

Once you have contest IDs, proceed to test the rest of the endpoints in the collection also Run Get Contest Detail once to auto-fill questionId and optionId for the sample Submit Answers request.

Follow Postman guide : https://github.com/smjcodes/tentwenty#postman-collection 

> For setup details on environment variables, authentication, and role-based access, see the relevant sections in the main README.md.




## Verification Status

This project has been verified locally with PostgreSQL.

Verified locally:

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
- `pnpm develop`
- authentication flows
- contest join and submit flows
- leaderboard behavior
- history and prize endpoints
- VIP access restrictions
- rate limiting on target endpoints

Verification note:

- the application was run locally against PostgreSQL, not only against a fallback development database



## Local Run Commands

Run these commands in order:

```powershell
pnpm install
pnpm typecheck
pnpm build
pnpm develop
```

## PostgreSQL Setup

### Option 1: pgAdmin

1. Open pgAdmin.
2. Connect to your local PostgreSQL server.
3. Create a new database named `contest_participation_system`.
4. Keep note of:
   - host
   - port
   - database name
   - username
   - password
5. Update your `.env` file with those values.

### Option 2: psql

```powershell
psql -U postgres -c "CREATE DATABASE contest_participation_system;"
```

If your PostgreSQL user is not `postgres`, replace it with your local username.

## Environment Variables

Copy `.env.example` to `.env`.

### Exact PostgreSQL `.env` example

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS="replace-me-1,replace-me-2"
API_TOKEN_SALT=replace-me
ADMIN_JWT_SECRET=replace-me
TRANSFER_TOKEN_SALT=replace-me
JWT_SECRET=replace-me
ENCRYPTION_KEY=replace-me

DATABASE_CLIENT=postgres
DATABASE_URL=
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=contest_participation_system
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
DATABASE_SCHEMA=public
DATABASE_SSL_REJECT_UNAUTHORIZED=true

SEED_SAMPLE_DATA=true
SEED_NORMAL_USER_EMAIL=normal@example.com
SEED_NORMAL_USER_PASSWORD=Pakistan1
SEED_VIP_USER_EMAIL=vip@example.com
SEED_VIP_USER_PASSWORD=Pakistan1
SEED_CONTEST_ADMIN_EMAIL=contestadmin@example.com
SEED_CONTEST_ADMIN_PASSWORD=Pakistan1
```

Notes:

- You can use either `DATABASE_URL` or the individual `DATABASE_*` values.
- Replace `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and any other `DATABASE_*` values as needed to match your local PostgreSQL setup.
- For a normal local PostgreSQL setup, keep `DATABASE_SSL=false`.
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, and `ENCRYPTION_KEY` must be replaced with your own random secret values on each machine/environment.
- In other words, do not keep `replace-me` for `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, or `ENCRYPTION_KEY` when setting up the project locally.
- `.env` is gitignored and should contain only local machine secrets.
- `.env.example` contains placeholders plus intentionally documented sample seed credentials.

## Database Initialization And Schema Sync

This project uses Strapi content-type schemas as the source of truth for the database model.

That means:

- no manual SQL migration files are included in this submission
- Strapi synchronizes the PostgreSQL schema from the content-type definitions when the app starts
- the content models in `src/api/**/content-types/**/schema.json` define the database structure

Practical local flow:

1. create the PostgreSQL database
2. configure `.env`
3. run `pnpm develop`
4. let Strapi create or synchronize the required tables in PostgreSQL

This is the intended setup for this submission and is reflected in the linked schema documentation.

## Project Structure

```text
config/
  admin.ts
  api.ts
  database.ts
  middlewares.ts
src/
  api/
    contest/
      content-types/
      controllers/
      routes/
      services/
    question/
      content-types/
    option/
      content-types/
    participation/
      content-types/
    user-answer/
      content-types/
    prize-winner/
      content-types/
  bootstrap/
    contest-system.ts
  extensions/
    users-permissions/
      strapi-server.ts
  middlewares/
    api-rate-limit.ts
  policies/
    has-admin-api-access.ts
    is-authenticated.ts
  utils/
    contest.ts
    http.ts
```

## Role Access

### Public / Guest

- can list contests
- can view contest details
- can view leaderboards
- cannot join contests
- cannot submit answers

### Normal User

- can join `NORMAL` contests only
- can submit `NORMAL` contests only
- can view own history
- can view own in-progress contests
- can view own prizes

### VIP User

- can join `NORMAL` and `VIP` contests
- can submit `NORMAL` and `VIP` contests
- can view own history
- can view own in-progress contests
- can view own prizes

### Admin

- Strapi admin user can fully manage content through `/admin`
- dedicated `contest-admin` API role can call `POST /api/contests/:id/award-prize`

Clarification:

- Strapi admin authentication and content API authentication are separate in Strapi
- because of that separation, the custom prize-award API is intentionally protected by a dedicated Users & Permissions role rather than a Strapi admin session token

## Seed / Test Users

These are created automatically when `SEED_SAMPLE_DATA=true`:

- Normal user
  - email: `normal@example.com`
  - password: `Pakistan1`
- VIP user
  - email: `vip@example.com`
  - password: `Pakistan1`
- Contest API admin
  - email: `contestadmin@example.com`
  - password: `Pakistan1`

These are sample interview credentials for local testing, not production credentials.

Strapi Admin Panel user:

- create the first admin manually through `http://localhost:1337/admin`

## Content Model Summary

### Contest

- `title`
- `description`
- `startTime`
- `endTime`
- `accessLevel`
- `prizeInfo`
- `isActive`
- relation to questions
- relation to participations
- relation to prize winner

### Question

- relation to contest
- `text`
- `questionType`
- `points`
- relation to options

### Option

- relation to question
- `text`
- `isCorrect`

### Participation

- relation to user
- relation to contest
- `status`
- `score`
- `startedAt`
- `submittedAt`

### UserAnswer

- relation to participation
- relation to question
- `selectedOptionIds`
- `isCorrect`
- `pointsAwarded`

### PrizeWinner

- relation to user
- relation to contest
- relation to participation
- `prizeInfoSnapshot`
- `awardedAt`

Full schema explanation:

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

## Scoring Rules

- correct answer gives `question.points`
- incorrect answer gives `0`
- no negative marking
- `SINGLE_SELECT` requires exact single-option match
- `TRUE_FALSE` requires exact single-option match
- `MULTI_SELECT` requires exact full-set match
- no partial score for multi-select

## Security Notes

- `isCorrect` is not returned in public contest/question responses
- option ownership is validated per question on submit
- question ownership is validated per contest on submit
- duplicate joins are blocked
- duplicate submissions are blocked
- JWT auth is required for join, submit, history, in-progress, prizes, and prize award
- VIP contest participation is enforced for both join and submit flows

## API Overview

### Public

- `GET /api/contests`
- `GET /api/contests/:id`
- `GET /api/contests/:id/leaderboard`

### Authenticated

- `POST /api/auth/local`
- `POST /api/auth/logout`
- `POST /api/contests/:id/join`
- `POST /api/contests/:id/submit`
- `GET /api/me/history`
- `GET /api/me/in-progress`
- `GET /api/me/prizes`

### Contest API Admin

- `POST /api/contests/:id/award-prize`

## Complete API Testing Order

Recommended manual testing order before submission:

1. `POST /api/auth/local` with `normal@example.com`
2. `POST /api/auth/local` with `vip@example.com`
3. `POST /api/auth/local` with `contestadmin@example.com`
4. `GET /api/contests`
5. `GET /api/contests/:contestId`
6. `POST /api/contests/:contestId/join` as normal user on a `NORMAL` contest
7. `POST /api/contests/:vipContestId/join` as normal user and confirm `403`
8. `POST /api/contests/:vipContestId/join` as VIP user
9. `POST /api/contests/:contestId/join` again and confirm duplicate join is blocked
10. `POST /api/contests/:contestId/submit` with valid answers
11. `POST /api/contests/:contestId/submit` again and confirm duplicate submit is blocked
12. `GET /api/contests/:contestId/leaderboard`
13. `GET /api/me/history`
14. `GET /api/me/in-progress`
15. `POST /api/contests/:contestId/award-prize` with contest admin token
16. `GET /api/me/prizes`

Additional negative tests:

- submit with a question from another contest
- submit with an option from another question
- submit VIP contest as a normal user

## Postman Collection

Collection file:

- [Contest Participation System.postman_collection.json](./postman/Contest%20Participation%20System.postman_collection.json)

### Import steps

1. Open Postman.
2. Click `Import`.
3. Select the collection file from the `postman/` folder.
4. Set `baseUrl` to `http://localhost:1337`.
5. Run `Get Contest Detail` once to auto-fill `questionId` and `optionId` for the sample `Submit Answers` request.

### Important dependency note

Some Postman requests depend on variables created by earlier requests.

Examples:

- `Join Contest` needs `jwt` from `Login - Normal User` and `contestId` from `List Contests`
- `Join VIP Contest - VIP User` needs `vipJwt` and `vipContestId`
- `Award Prize` needs `contestAdminJwt` and `contestId`
- `Submit Answers` needs `jwt`, `contestId`, `questionId`, and `optionId`

If you run a dependent request before those variables are filled, the request URL or auth header may be invalid and the API test can fail.

### Collection behavior

The collection already supports:

- automatic JWT capture for normal user login
- automatic JWT capture for VIP user login
- automatic JWT capture for contest admin login
- automatic contest ID capture from contest listing
- automatic sample `questionId` and `optionId` capture from `Get Contest Detail`

### Recommended Postman order

#### Normal user flow

1. `Login - Normal User`
2. `List Contests`
3. `Get Contest Detail`
4. `My Profile`
5. `Join Contest`
6. `Submit Answers`
7. `Leaderboard`
8. `My History`
9. `My In Progress`
10. `My Prizes`

#### VIP flow

1. `Login - VIP User`
2. `List Contests`
3. `Join VIP Contest - VIP User`
4. `VIP Profile With Role`
5. `My Prizes - VIP User`

#### Negative test

1. `Login - Normal User`
2. `List Contests`
3. `Join VIP Contest - Normal User Should Fail`

#### Contest admin flow

1. `Login - Contest Admin`
2. `List Contests`
3. `My Profile With Role`
4. `Award Prize`

#### Switching users in Postman

Use `Logout - Revoke Active Token` whenever you want to revoke the currently active session stored in `activeJwt` before testing with another user.

## Rate Limiting

Rate limiting is registered globally but only targets the intended endpoints:

- `POST /api/auth/local`
- `POST /api/auth/local/register`
- `POST /api/contests/:id/join`
- `POST /api/contests/:id/submit`
- `GET /api/contests/:id/leaderboard`

It does not target Strapi admin panel routes or static/public asset routes.

## Final Assignment Checklist

- [x] Strapi v5 backend used
- [x] PostgreSQL-first project setup
- [x] Users & Permissions JWT authentication used
- [x] Public users can only view contests
- [x] Normal users can join and submit only `NORMAL` contests
- [x] VIP users can join and submit `NORMAL` and `VIP` contests
- [x] Admin content management handled through Strapi Admin Panel
- [x] Contest content type includes required fields
- [x] Question content type supports `SINGLE_SELECT`, `MULTI_SELECT`, and `TRUE_FALSE`
- [x] Option content type includes `isCorrect`
- [x] Participation model implemented
- [x] UserAnswer model implemented
- [x] PrizeWinner model implemented
- [x] Join contest endpoint implemented
- [x] Submit contest endpoint implemented
- [x] Leaderboard endpoint implemented
- [x] My history endpoint implemented
- [x] My in-progress endpoint implemented
- [x] My prizes endpoint implemented
- [x] Award prize endpoint implemented
- [x] Correct answers hidden from public/user responses
- [x] Question and option ownership validation implemented
- [x] Duplicate join blocked
- [x] Duplicate submit blocked
- [x] Score uses `question.points`
- [x] No negative marking
- [x] Exact-match scoring for all supported question types
- [x] Leaderboard sorted by score DESC and submittedAt ASC
- [x] Rate limiting registered for target endpoints
- [x] README includes setup, env, roles, test users, API order, and Postman guidance

## Known Limitations

- Rate limiting is in-memory, so it is best suited to a single-instance deployment or interview assignment scope.
- Prize award API uses a dedicated content API admin role instead of Strapi admin JWT, because Strapi admin authentication and content API authentication are separate concerns.
- The project relies on Strapi’s automatic schema synchronization rather than versioned SQL migration files, which is standard for many Strapi interview projects but less explicit than a migration-managed system.
