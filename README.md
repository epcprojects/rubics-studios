# FlexGrades (working prototype)

A rebuild of the client's single-file rubric grading prototype as a real Next.js app, with the pieces the original
did not have: a Free and a Pro plan, accounts, simulated billing, and an admin console.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (all routes prerender)
```

## What is in it

| Area | Route | Notes |
| --- | --- | --- |
| Marketing site | `/`, `/pricing` | Landing page with an interactive rubric preview, pricing cards, plan comparison, FAQ |
| Auth | `/login`, `/signup` | Split-screen forms. Login has one-click demo accounts |
| Grading workspace | `/app/grade` | Everything from the original prototype: click-to-score rubric, scales, % and no-points modes, half points, roster, comments, comment bank (EN/ES), voice notes, edit mode, builder, print |
| Rubric library | `/app/rubrics` | Search, open, duplicate, delete, create |
| Gradebook | `/app/gradebook` | Per-rubric table, class average, grade distribution, CSV, print, sync |
| Plan and billing | `/app/billing` | Plan, usage meters, simulated checkout, cancel and resume, receipts |
| Admin console | `/admin`, `/admin/users`, `/admin/billing` | KPIs, signups and revenue charts, activity feed, user search and detail, grant Pro, suspend, delete, transactions, refunds, subscriber list, CSV export |

Free users do not need an account. They grade as a guest and the work is carried into the account if they sign up later.

## Free vs Pro (placeholder numbers, change in `lib/plans.ts`)

* Free: 5 saved rubrics, 35 students, scoring, comments, print, CSV export.
* Pro: $7 per month or $60 per year. Unlimited rubrics and students, AI rubric generator, rubric upload, voice feedback, gradebook sync.

Limits are enforced where the action happens (adding a student, creating a rubric) and show an upgrade prompt.

## Demo accounts

Listed in `lib/seed.ts` and shown as buttons on the login page: a Pro teacher, a Free teacher and an admin.
The seed also contains 24 generated teachers, their payments and an activity feed so the admin console has data.
"Reset demo data" at the bottom of the admin console restores the seed.

## What is simulated

This prototype has no server. `lib/store.ts` is the entire "backend": one object saved to `localStorage`, read through
`useSyncExternalStore`. Every screen talks only to its hooks and `actions`, so replacing it is a contained job.

| Simulated here | Production replacement |
| --- | --- |
| Accounts, sessions, plain-text passwords | Auth provider or hashed passwords with secure session cookies |
| Admin role check in the browser | Server-side role check on every admin route and API |
| Checkout form and "Pay" | Stripe Checkout and webhooks for subscription state |
| Data in `localStorage` | Database (Postgres) so data follows the teacher across devices, and the admin sees real users |
| `lib/ai-mock.ts` rubric generation and upload | Server routes calling the Claude API (the original used a Netlify function) |
| Voice clips kept in memory | File storage (S3 or similar) |
| Gradebook sync toast | PowerSchool, Illuminate and Google Classroom integrations |

## Code map

* `lib/types.ts`, `lib/plans.ts`, `lib/scoring.ts`: data model, plan limits, and the scoring maths (pure functions)
* `lib/store.ts`: state, persistence, auth, billing and admin actions
* `lib/seed.ts`: sample rubrics, demo accounts, generated admin data
* `components/ui`: buttons, modal, form controls, badges, toasts
* `components/grade`, `rubrics`, `gradebook`, `billing`, `admin`, `marketing`, `auth`: one folder per area

## Changes from the original prototype

* Letter grade rounds to the nearest percent. The original rounded up, so 89.2% showed as an A.
* The gradebook table no longer repeats the percent column.
* Rubrics save automatically. The original "Save" and "Duplicate" buttons wrote to a list that never held the rubric's rows.
* Changing the scale keeps each student's selected levels and clears only manual point overrides.
* The grading screen works on one rubric at a time and each rubric keeps its own grades, instead of one shared set.
* Custom points typed in the builder are kept. The original overwrote them with an even split.
