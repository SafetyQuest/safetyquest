# CLAUDE.md — SafetyQuest

Workplace-safety training platform (LMS) built for Tetra Pak. Learners work through
gamified **Programs → Courses → Lessons → Steps (content/mini-games) → Quizzes**, earning
XP, levels, streaks and badges. Admins author all content, manage users, and control
access through a permission-based RBAC system.

This file is the orientation doc for anyone (human or agent) new to the repo. It records
the things you cannot infer from the file tree.

---

## 1. Stack & topology

| Layer | Choice |
|---|---|
| Framework | Next.js **15.5.4**, App Router, React **19.1.0** |
| Package manager | **pnpm 9.15.0** workspaces (no Turborepo/Nx — root scripts use `pnpm --filter`) |
| DB | **Azure SQL Server** via Prisma **5.22** (`provider = "sqlserver"`) |
| Auth | **NextAuth 4.24.11**, Credentials provider, **JWT** session strategy |
| Styling | **Tailwind CSS v4** (CSS-first `@theme inline`, no `tailwind.config.js`) |
| Media | **Azure Blob Storage** (`@azure/storage-blob`), container `safety-content` |
| Email | **Azure Communication Services** (`@azure/communication-email`) |
| Hosting | **Azure App Service** (`safetyquest-mvp-de`) via GitHub Actions |
| Data fetching | TanStack Query v5 on the client; direct Prisma calls in Server Components |

### Workspace layout

```
apps/web                 @safetyquest/web       — the only app
packages/database        @safetyquest/database  — Prisma schema, migrations, seeds, delete utils
packages/shared          @safetyquest/shared    — auth, rbac, enrollment, gamification, types
```

Dependency direction: `web → shared → database`. Note `database` also depends on `shared`
(for `hashPassword` in seeds) — a **circular workspace dependency**. pnpm tolerates it
because both packages ship raw TypeScript, but don't add a build step to either without
breaking the cycle first.

**Neither package has a build step.** `main`/`types` point straight at `index.ts`. Next
compiles them through the pnpm symlink; there is deliberately **no `transpilePackages`**
in `next.config.ts` and adding one is not needed. Consequence: importing a workspace
package from anything that is *not* compiled by Next (e.g. a bare `node` script) requires
`tsx`.

`packages/shared` uses subpath `exports`, so import from the specific entry point:

```ts
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers'
import { verifyLessonAccess } from '@safetyquest/shared/enrollment'
import { calculateXp } from '@safetyquest/shared/gamification'
import { hashPassword } from '@safetyquest/shared'   // root re-exports everything
```

---

## 2. Commands

```bash
pnpm dev              # next dev on apps/web
pnpm build            # prisma generate + next build   ← always generate first
pnpm db:generate      # prisma generate
pnpm db:push          # prisma db push (no migration file)
pnpm db:studio        # prisma studio

# migrations must be run from the package (no root alias):
pnpm --filter @safetyquest/database db:migrate
```

`prisma generate` also runs via `postinstall` in `packages/database`, so a fresh
`pnpm install` normally leaves you with a client. If you ever see
`@prisma/client did not initialize yet`, run `pnpm db:generate`.

**Seeds are run manually, one file at a time** — there is no orchestrator:

```bash
npx tsx packages/database/seed-permissions-3table.ts   # roles + permissions (run FIRST)
npx tsx packages/database/prisma/seed-badges.ts        # ~100 badge definitions
npx tsx packages/database/prisma/seed-version-3-4.ts   # demo content (latest version)
```

⚠️ `packages/database`'s `db:seed` script points at `prisma/seed.ts`, **which does not
exist**. Ignore it. The `seed-version-*.ts` files are successive snapshots of demo
content, not incremental migrations — pick one, don't run them all.

---

## 3. Data model

Schema: `packages/database/prisma/schema.prisma` (~518 lines, 10 migrations).

### Content hierarchy

```
Program ──ProgramCourse{order}── Course ──CourseLesson{order}── Lesson ──LessonStep{order}
                                    │                             │
                                    └── quizId ─→ Quiz ←──────────┘
                                                    │
                                                QuizQuestion{order, gameType, gameConfig}
```

- `Program`, `Course`, `Lesson`, `Quiz` all have **unique `title` and `slug`**. Two
  courses cannot share a title. This bites when seeding or bulk-importing.
- Join tables carry an `order` int. Reordering is done by explicit reorder endpoints
  (`.../lessons/[lessonId]/reorder`, `.../courses/[courseId]/reorder`).
- A `Quiz` can be attached to *either* a Course or a Lesson (`courseUsage` /
  `lessonUsage` back-relations) and can be shared between many.
- `LessonStep.type` is `'content' | 'game'`. Game payload lives in `gameConfig`
  (`NVarChar(Max)` **JSON string**, not a JSON column). Same for
  `QuizQuestion.gameConfig`, `QuizAttempt.answers`, `LessonProgress.completedSteps`
  and `LessonProgress.stepResults`. **Every one of these is `JSON.stringify`d on write
  and `JSON.parse`d on read by hand** — Azure SQL has no native JSON type here.

### Assignment model (the important part)

Content reaches a user through **two parallel, independent channels**:

| Channel | Table | Also via UserType |
|---|---|---|
| Program | `ProgramAssignment` | `UserTypeProgramAssignment` |
| Course (standalone) | `CourseAssignment` | `UserTypeCourseAssignment` |

Both assignment tables have a **`source` string, which is either `'manual'` or
`'usertype'`**, and the unique key is `[userId, programId, source]`. So a user can hold
the *same* program twice — once inherited, once manual — and the UI renders that as a
split diagonal badge (`.diagonal-badge.dual-badge` in `globals.css`).

`UserType` (Visitor, Contractor, …) is an **inheritance mechanism, not a role**. When a
program/course is attached to a UserType, the API loops over every user of that type and
writes `source: 'usertype'` rows. When it's detached, it deletes only `source: 'usertype'`
rows. Manual assignments always survive. See
`app/api/admin/user-types/[id]/programs/route.ts` for the canonical propagation code, and
`app/api/admin/users/[id]/route.ts` PATCH for the re-propagation on user-type change.

### Virtual programs

A standalone `CourseAssignment` has no parent program, but the whole learner UI is routed
as `/learn/programs/[id]/courses/[courseId]/...`. The fix is a **virtual program ID**:

```ts
makeVirtualProgramId(courseId) // → "course-<courseId>"
isVirtualProgram(id)           // → id.startsWith('course-')
extractCourseId(id)            // → id.replace('course-', '')
```

Every learner query and access check branches on `isVirtualProgram(programId)`: virtual →
verify `CourseAssignment`; real → verify `ProgramAssignment` **and** that the course is in
the program.

⚠️ This helper is **duplicated** in two places that must stay in sync:
`packages/shared/enrollment/virtualProgram.ts` and `apps/web/lib/learner/virtualProgram.ts`.
Prefer the shared one for new code.

### Progress & attempt tables

| Table | Meaning |
|---|---|
| `LessonProgress` | *In-flight* state — current step, completed steps, accumulated XP, per-step results. **Deleted** when the lesson is submitted. |
| `LessonAttempt` | Terminal record, unique per `[userId, lessonId]`. `passed` drives all unlocking. |
| `CourseAttempt` | Terminal record for the *course-level* quiz, unique per `[userId, courseId]`. |
| `QuizAttempt` | Append-only detailed history with the full answer JSON. Not unique. |

**Unlocking is entirely derived, never stored.** A lesson unlocks when the previous
`CourseLesson` by `order` has a passed `LessonAttempt`. A course unlocks when *all*
previous courses in the program have every lesson passed *and* (if the course has a quiz)
a passed `CourseAttempt`. First item at `order === 0` is always unlocked.

### Gamification

`Badge` / `UserBadge` / `UserStats` / `Certificate`, plus denormalised counters on `User`
(`xp`, `level`, `streak`, `longestStreak`, `perfectQuizCount`, `excellentQuizCount`).

- Level = `floor(xp / 1000) + 1`. Six tiers (Novice → Master) in
  `packages/shared/gamification/levelSystem.ts`.
- XP = `round(baseXp × difficultyMultiplier × levelMultiplier) + performanceBonus`.
  Base is **100 for a lesson**, **200 for a course quiz** (hardcoded in the submit routes).
  Difficulty: Beginner 1.0 / Intermediate 1.5 / Advanced 2.0.
- Badges are data-driven: `category` + `family` + `tier` + `requirement`.
  `BadgeChecker.checkAndAwardBadgesCascade()` recomputes stats from scratch on every
  submit and awards in cascade order (lesson → accuracy → difficulty → course → program).
  It's a lot of queries per submit; see §8.
- `UserStats` and `Certificate` tables exist but **nothing writes to them**. Dead schema.

---

## 4. Auth & RBAC

### Session shape

`app/api/auth/[...nextauth]/route.ts` is the single source. `authorize()` loads the user
plus `roleModel → rolePermissions → permission`, and **flattens all permissions into the
JWT**. So `session.user.roleModel.permissions` is an array of
`{ id, name, resource, action }` available everywhere with no extra DB hit.

Type augmentation lives in `apps/web/types/next-auth.d.ts`.

⚠️ **The JWT is a snapshot.** Changing a user's role or permissions in the DB has **no
effect until they sign out and back in**. There is no session-refresh path except the
`trigger === 'update'` branch, which only carries `mustChangePassword`.

Importing `authOptions`: the tsconfig defines a path alias

```json
"@/auth": ["./app/api/auth/[...nextauth]/route"]
```

so `import { authOptions } from '@/auth'` is the preferred form. The codebase is
inconsistent — you'll also see `@/app/api/auth/[...nextauth]/route` and long relative
paths like `'../../../../../../../../api/auth/[...nextauth]/route'`. They're all the same
module; prefer `@/auth` for new code.

### Two overlapping authorization systems

There is a **legacy string role** (`User.role`: `'ADMIN' | 'INSTRUCTOR' | 'LEARNER'`) and a
**3-table RBAC** (`Role` → `RolePermission` → `Permission`). Both are live. Every check is
of the form:

```ts
isAdmin = (user.role === 'ADMIN') || canAccessAdmin(user.roleModel)
```

`role === 'ADMIN'` is a **god-mode bypass** in `checkPermission` — a legacy admin passes
every permission check regardless of what their `Role` grants.

`canAccessAdmin()` means "has at least one permission that is *not* in the learner-only
list": `programs.view`, `courses.view`, `lessons.view`, `quizzes.view`, `badges.view`.
That list is **copy-pasted into four files** and must stay identical:

- `packages/shared/rbac/index.ts` (canonical)
- `apps/web/middleware.ts`
- `apps/web/components/shared/DashboardSwitcher.tsx`
- `apps/web/app/auth/set-password/page.tsx`

⚠️ `app/admin/(dashboard)/layout.tsx` and `components/admin/AdminSidebar.tsx` each define
their *own* inline `canAccessAdmin` that returns `permissions.length > 0` — i.e. any
permission grants admin. That contradicts the others. It's masked today because
middleware rejects learners before the layout runs, but it is a latent hole.

### Permission naming — the trap

Permission rows have a **`name`** and a separate **`resource` + `action`** pair, and the
two do not always line up:

| `name` | `resource` | `action` |
|---|---|---|
| `users.view` | `users` | `view` |
| `settings.user-types.view` | `settings` | `view` |
| `settings.roles.view` | `settings` | `view` |
| `settings.tags.view` | `settings` | `view` |

- **API routes check `resource`/`action`** via `checkPermission(session, 'settings', 'view')`
  — so *any* settings-family permission opens *every* settings endpoint. There is no
  per-sub-resource enforcement on the server.
- **The sidebar checks `name`** via `hasPermission(session, 'settings.user-types.view')`.
  So the UI is finer-grained than the API.

⚠️ Known mismatch: media routes check `checkPermission(session, 'media', 'create')` but the
seed only creates **`media.upload`**. No role is ever granted `media.create`, so **only a
legacy `role === 'ADMIN'` user can upload media or create folders.** Either add a
`media.create` permission or change the routes.

### Middleware (`apps/web/middleware.ts`)

Matcher: `/login`, `/`, `/admin/:path*`, `/api/admin/:path*`, `/learn/:path*`,
`/api/learner/:path*`, `/auth/set-password`.

Order of concerns:
1. `/api/auth/change-password` bypasses everything (explicitly, so a
   must-change-password user can actually change it).
2. If `token.mustChangePassword === true` → hard redirect to `/auth/set-password` from
   any page.
3. Signed-in users on `/login` or `/` → `/admin` or `/learn/dashboard` by admin check.
4. `/admin/*` without admin access → `/learn/dashboard`.

⚠️ Routes **outside** the matcher get no middleware protection —
`/api/media/upload` and `/api/test-email` in particular. Upload has its own in-route
session check; **`/api/test-email` has none at all** (see §8).

### Password lifecycle

`User.mustChangePassword` defaults to **`true`**, so every newly created user is forced
through `/auth/set-password` on first login. Admin creates user → random password
generated → `sendWelcomeEmail` → password shown in the API response *and* emailed.
Admin reset works the same way via `/api/admin/users/[id]/reset-password`.

Password policy (enforced both client-side and in `change-password`):
≥8 chars, upper, lower, digit, one of `!@#$%^&*.`

---

## 5. Routes

### Pages

```
/                                   → redirect to /login (middleware redirects signed-in users first)
/login                              client component, Credentials sign-in
/auth/set-password                  forced first-login password change

/admin/(dashboard)/                 route group — sidebar layout, admin gate
  ├─ page.tsx                       dashboard stats
  ├─ users/                         page.tsx (server, computes permission flags) → UsersPage.tsx (1357 lines, client)
  ├─ programs|courses|lessons|quizzes/  list · new · [id] (detail) · [id]/edit
  ├─ media/                         → <MediaLibrary/>
  └─ settings/{user-types,roles,tags,badges}/

/learn/(learner)/                   route group — LearnerNav layout + error/loading/not-found
  ├─ dashboard/
  ├─ achievements/
  ├─ programs/
  └─ programs/[id]/courses/[courseId]/
       ├─ page.tsx
       ├─ quiz/ · quiz/result/
       └─ lessons/[lessonId]/ · lessons/[lessonId]/result/
```

`[id]` in the learner tree is a **program ID or a virtual `course-*` ID**.

The `[id]/edit` pages are 10-line wrappers around the shared `*Form` components; `new/` are
6-line wrappers. All real logic is in `components/admin/{Program,Course,Lesson,Quiz}Form.tsx`.

### API

```
/api/auth/[...nextauth]             NextAuth handler
/api/auth/change-password           POST — self-service password set
/api/media/upload                   POST — Azure Blob upload (NOT under /api/admin)
/api/test-email                     GET  — ⚠️ unauthenticated debug endpoint

/api/admin/…                        badges, courses, dashboard, lessons, media, permissions,
                                    programs, quizzes, roles, tags, users, user-types
/api/learner/programs               GET  — list (real + virtual)
/api/learner/programs/[id]          GET  — detail
/api/learner/programs/[id]/courses/[courseId]                              GET
/api/learner/programs/[id]/courses/[courseId]/quiz/submit                  POST
/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]           GET
/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/progress  GET/POST/DELETE
/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/content-complete POST
/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/submit    POST
/api/learner/achievements           GET
```

### Conventions in API routes

Every route follows the same shape:

```ts
const prisma = new PrismaClient()          // module scope, one per route file

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const authCheck = checkPermission(session, 'courses', 'view')
  if (!authCheck.authorized)
    return NextResponse.json({ error: authCheck.reason }, { status: 401 })
  try { /* … */ } catch (e) { console.error(e); return NextResponse.json({error:'…'},{status:500}) }
}
```

Notes:
- Authorization failures return **401**, not 403, essentially everywhere.
- List endpoints take `?page=&limit=` (courses/lessons/…) or `?page=&pageSize=` (users) —
  **inconsistent**. When `limit` is omitted, list endpoints return a bare array; when
  present, they return `{ items, pagination }`. Callers must handle both.
- Search uses `{ contains: search }`. Azure SQL's default collation is case-insensitive,
  so `mode: 'insensitive'` is neither used nor needed (and Prisma's SQL Server connector
  doesn't support it).

---

## 6. Frontend structure

```
components/
  admin/              forms, modals, media library, bulk operations
  admin/games/        10 game *authoring* editors (one per game type) + ui/
  games/              10 game *player* components + shared/ result cards
  GameRenderer.tsx    ⚠️ lives at components/ root, not components/games/
  learner/            dashboard/ courses/ lessons/ programs/ gamification/ layout/ shared/
  shared/             ConfirmDialog, DashboardSwitcher (currently unmounted)
```

### The game system

Ten game types, defined in `apps/web/types/games.ts` (`GameType` enum + one config type
each): `hotspot`, `drag-drop`, `matching`, `sequence`, `true-false`, `multiple-choice`,
`scenario`, `time-attack-sorting`, `memory-flip`, `photo-swipe`.

Each type has a **matched pair**: an editor in `components/admin/games/` writing a JSON
config, and a player in `components/games/` reading it. `GameRenderer.tsx` is the switch
that maps `gameType` → player. Adding a game type means touching **all four**: the enum,
the config type, an editor, a player, plus the `GameRenderer` case.

⚠️ **The sequence game's player lives in `components/games/SortableSequenceItem.tsx`**, not
`SequenceGame.tsx` (which doesn't exist). `GameRenderer` imports it as
`import SequenceGame from './games/SortableSequenceItem'`. The filename is a leftover;
don't go looking for `SequenceGame.tsx`.

Players share a contract: props `{ config, mode: 'preview'|'lesson'|'quiz', onComplete, previousState, onTimerUpdate? }`.
`onComplete` returns a `GameResult` (`{ success, earnedXp, correctCount, totalCount, … }`).
Time-attack games (`memory-flip`, `time-attack-sorting`, `photo-swipe` when
`timeAttackMode`) push a `TimerState` up so `GameRenderer` can render the shared
`FloatingTimerBadge`; the CSS pulse classes (`timer-calm/warning/critical/final`,
`game-bg-*`) live at the bottom of `globals.css`.

### Lesson runtime

`LessonPlayer.tsx` (619 lines) drives one lesson:

1. Hydrates from `lesson.savedProgress` (resume banner if `currentStepIndex > 0`).
2. On each step completion: `POST .../progress` with `{ currentStepIndex, completedSteps, accumulatedXp, stepResults }`.
   Also saves on `visibilitychange` and via `navigator.sendBeacon` on `beforeunload`.
3. On last step: if the lesson has a quiz → `POST .../content-complete`, then the
   "take quiz now / later" modal. If not → straight to submit.
4. `POST .../submit` returns XP breakdown + level + streak + new badges. Those are packed
   into **URL query params** and the player routes to `.../result?...` — the result page
   is driven entirely by the query string, not a refetch.
5. `DELETE .../progress` clears the in-flight row.

### Design system

`apps/web/app/globals.css` (956 lines) is the whole design system — there is **no
`tailwind.config.js`**; Tailwind v4 is configured with `@theme inline` inside that file.

Tetra Pak palette as CSS custom properties on `:root`: `--primary #023F88`,
`--primary-light #00BDF2`, `--success #8DC63F`, `--warning #F58220`, `--danger #FF0000`,
`--alert #FFDD00`, `--highlight #F067A6`, plus surface/text/border scales, typography,
spacing, radii, shadows, transitions and z-index layers.

Components consume these **three different ways**, all present in the codebase:
- inline `style={{ color: 'var(--text-primary)' }}` — most common in learner components
- arbitrary Tailwind `text-[var(--primary)]` — most common in admin components
- semantic classes defined in `globals.css`: `.card`, `.btn`, `.btn-primary`, `.badge-*`,
  `.progress-bar`, `.difficulty-*`, `.hover-lift`, `.skeleton`

Match the surrounding file rather than imposing one style.

Gamification visuals also live in `globals.css`: badge tier gradients
(`.badge-gradient-{bronze,silver,gold,platinum}`), level tier gradients
(`.level-gradient-*`), and animations (`animate-aurora`, `animate-badge-pop`,
`animate-xp-pop`, `animate-flame`, `animate-level-up`, `animate-confetti`).

⚠️ `app/layout.tsx` still carries the create-next-app metadata
(`title: "Create Next App"`). Fix that before any public-facing launch.

---

## 7. Build & deployment

`.github/workflows/azure-deploy.yml` — triggers on **push to `main`** or manual dispatch.
Target: Azure App Service `safetyquest-mvp-de`, Node 22.

The workflow is unusual and the non-obvious steps exist for real reasons:

1. **`npm install -g pnpm@9.15.0`** — pinned. Not corepack.
2. **`pnpm install --frozen-lockfile`**, with the pnpm store cached by lockfile hash.
3. **Generate Prisma client, then *verify it exists*** by `find`ing
   `node_modules/.pnpm/**/.prisma/client` and failing the build if absent.
4. **`pnpm build`** with all runtime secrets injected as build-time env. `DATABASE_URL` is
   needed at build time because pages are statically analysed and some hit Prisma.
5. **Assemble `deploy/` from the standalone output** — and this is where the interesting
   work is:

   - **Flatten `.pnpm` into real top-level `node_modules`.** Next's `output: "standalone"`
     traces a pnpm-symlinked tree; Azure App Service does not preserve/resolve that
     layout. The workflow walks `node_modules/.pnpm/*/node_modules/*` and copies each
     package to a real top-level path. The build then **hard-fails** unless
     `require.resolve('styled-jsx/package.json')` succeeds — styled-jsx is the canonical
     casualty of this problem, which is also why `pnpm-workspace.yaml` sets
     `publicHoistPattern: ['styled-jsx', '@swc/helpers']`.
   - **Copy the Prisma client explicitly into `deploy/apps/web/node_modules/`** — both
     `.prisma/client` and `@prisma/client`. `next.config.ts` also declares
     `outputFileTracingIncludes` globs for these, but the belt-and-braces copy is what
     actually works, because Azure manipulates `node_modules` at the root. Verified with
     an explicit existence check that fails the build.
   - Copy `.next/static` and `public` to `deploy/apps/web/`.
   - Generate a minimal `deploy/package.json` (`start: node server.js`, `node >= 22`).
   - Generate **`deploy/server.js`** — a wrapper that `chdir`s, logs diagnostics, searches
     for the Prisma client and prints where it found it, then
     `require('./apps/web/server.js')`. The noisy startup logging is intentional: it's the
     diagnostic surface for the Prisma-on-Azure failure mode.
   - Generate **`deploy/web.config`** for IIS/iisnode.
6. `azure/webapps-deploy@v3` with `AZURE_WEBAPP_PUBLISH_PROFILE`.

⚠️ **Use pnpm 9.15.0 locally, not just in CI.** pnpm 10+ blocks dependency build scripts
by default and pnpm 11 renamed the opt-out from `onlyBuiltDependencies` to `allowBuilds`.
On a newer pnpm, `pnpm install` **rewrites the tracked `pnpm-workspace.yaml`**, injecting an
`allowBuilds:` block full of literal `set this to true or false` placeholders. Those aren't
booleans, so pnpm then exits 1 on every install — and because pnpm 11 runs an implicit
install (`runDepsStatusCheck`) before any script, `pnpm build` and `pnpm dev` fail before
they start. The failure looks like a broken toolchain; it isn't, and the native binaries are
all present. Fix: `npm install -g pnpm@9.15.0`, then
`git checkout -- pnpm-workspace.yaml` to drop the injected block. Watch for that file
appearing as modified in `git status` after any install — it must never be committed.

⚠️ **Never add a `.gitkeep` (or any dotfile) to `apps/web/public/`.** The directory is
intentionally empty and therefore untracked, so it does not exist on a fresh CI checkout
and the workflow's `if [ -d apps/web/public ]` guard skips the copy. Add a dotfile to
"preserve" the folder and the directory *will* exist, but `cp -r apps/web/public/*` will
not match a dotfile — the copy fails inside a `bash -e` step and **the deploy breaks**.
If you genuinely need `public/` again, add a real (non-dot) asset. The favicon is
unaffected either way; it lives at `app/favicon.ico` via Next's file convention.

**If you touch pnpm version, the workspace hoisting config, or `next.config.ts`'s output
tracing, re-verify the flatten step.** Most of the recent commit history
(`Update azure-deploy.yml` ×7, `Update pnpm-workspace.yaml` ×3, `Update next.config.ts` ×3)
is exactly this loop being debugged in production.

`next.config.ts` also sets — deliberately —

```ts
eslint:     { ignoreDuringBuilds: true }
typescript: { ignoreBuildErrors: true }   // ⚠️ see §8
```

`scripts/build-web.sh` and `scripts/prepare-deploy.sh` are older, simpler local
equivalents of the workflow. `.azure/config` describes an Azure-side build that is **not
the deployment path in use** — the GitHub Action builds and ships a prebuilt package.

Branch convention from history: `dev-bilal` / `dev-zain` → `dev` → `main` via PR.
Only `main` deploys.

---

## 8. Environment variables

Not committed; there is no `.env.example`. Set these in `.env` locally and as GitHub
Actions secrets + App Service settings in production.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Azure SQL connection string. Needed **at build time** too. |
| `SHADOW_DATABASE_URL` | Second DB for `prisma migrate dev` only. Not needed at runtime. |
| `NEXTAUTH_URL` | Canonical app URL. Also used as `APP_URL` in email templates' login links. |
| `NEXTAUTH_SECRET` | JWT signing. **Also read directly by `packages/shared/auth` as the `jsonwebtoken` secret**, where it falls back to the literal string `'development-secret-change-in-production'` if unset. |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob Storage. Container `safety-content` is created on demand with public `blob` access. |
| `NEXT_PUBLIC_AZURE_STORAGE_HOSTNAME` | Blob hostname for `next/image` `remotePatterns`. Defaults to `safetyqueststoreuae.blob.core.windows.net`. Client-visible. |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Azure Communication Services email. |
| `AZURE_SENDER_EMAIL` | Verified sender address. |
| `NODE_ENV` | `development` prefixes all outbound email subjects with `[DEV]`. |

Note the `EmailClient` is constructed at **module load** of
`lib/email/azure-email-service.ts` with a non-null-asserted connection string — if
`AZURE_COMMUNICATION_CONNECTION_STRING` is missing, any route importing it throws on
import, not on send.

---

## 9. Known fragilities & gotchas

Read this section before changing anything in the affected area.

### Correctness / security

1. **`/api/test-email` is unauthenticated** and hardcodes a personal address
   (`ahmad.bilal.chohan@gmail.com`). It is outside the middleware matcher. Anyone can hit
   it in production to send mail. Delete or gate it.
2. **`content-complete` route destructures the wrong param.** The folder is `[id]` but the
   handler does `const { programId, courseId, lessonId } = await params` — `programId` is
   always `undefined`. Prisma treats `programId: undefined` as *"don't filter"*, so the
   enrollment check passes for **any** user holding **any** active program assignment, and
   it never verifies the course/lesson relationship. It also awards raw `accumulatedXp`
   with no multipliers and no level recalculation.
3. **`quiz/submit` (course quiz) performs no enrollment check at all** — no
   `verifyProgramAccess`, no `CourseAssignment` lookup. Any signed-in user can POST a
   score for any `courseId` and receive XP, a `CourseAttempt` and badges.
4. **All scores are client-computed.** `quizScore`, `quizMaxScore` and `passed` come
   straight from the request body in both submit routes; nothing recomputes them against
   `QuizQuestion.gameConfig`/`points` or `Quiz.passingScore`. Trivially forgeable.
5. **`typescript.ignoreBuildErrors: true`** hides real type errors. Concretely: seven API
   route files type `params` as `{ params: { id: string } }` and then `await` it, which is
   wrong under Next 15 (params are Promises). It works at runtime because `await` on a
   non-thenable is a no-op *and* Next actually passes a Promise — but `tsc` would reject
   it. Run `pnpm --filter @safetyquest/web exec tsc --noEmit` if you want the real picture.
6. **Passwords are generated with `Math.random()`** — in `users/route.ts`
   (`generateRandomPassword`) and `users/import/route.ts`
   (`Math.random().toString(36).slice(-12)`). Not cryptographically secure. Use
   `crypto.randomBytes`.
7. **`media.create` is checked but never granted** (see §4). Only legacy `role === 'ADMIN'`
   can upload.
8. **Permission changes require re-login** — permissions are baked into the JWT.

### Data consistency

9. **CSV import inherits UserType *programs* but not *courses*.** `POST /api/admin/users`
   does both. `POST /api/admin/users/import` only does programs. Bulk-imported users
   silently miss their user-type course assignments.
10. **`deleteUserTypeWithCleanup` deletes `source: 'usertype'` program assignments but not
    course assignments** — orphaned `CourseAssignment` rows survive the user type's
    deletion. Same root cause as #9: course assignments were added later
    (migration `20260114093005_add_course_assignments`) and not every code path was updated.
11. **`getUserPrograms` returns duplicates by design.** The filter that excluded courses
    already covered by a program assignment is **commented out**
    (`const standaloneCourses = [...courseAssignments]`). A course that is both directly
    assigned and part of an assigned program appears twice on the learner dashboard —
    once as a real program's course, once as a virtual program.
12. **`perfectQuizCount` / `excellentQuizCount` are incremented on content-only lessons.**
    `scorePercentage` defaults to `100` when `quizMaxScore === 0`, so finishing a
    quiz-less lesson counts as a perfect quiz. Harmless today only because badges recompute
    these from `LessonAttempt` rows (`quizMaxScore > 0`) and never read the `User` columns.
13. **XP write is a lost-update pattern.** `submit` reads `user.xp`, then `BadgeChecker`
    *increments* `user.xp` by the badge bonus, then `submit` writes an **absolute**
    `xp: oldXp + lessonXp + badgeXp`. It happens to produce the right number, but any
    concurrent XP write in between is silently discarded.

### Structural / performance

14. **`new PrismaClient()` at module scope in 67 files.** No shared singleton. In dev,
    Next's HMR can accumulate connections. Two routes
    (`users/import`, `auth/change-password`) additionally call `prisma.$disconnect()` in a
    `finally`, which tears down a module-scoped client other requests may be using.
    A `packages/database` singleton would be the right fix.
15. **`BadgeChecker` is query-heavy.** `countCompletedCourses` loops per-course issuing
    2 queries each; `countCompletedPrograms` loops per-program per-course. Every lesson
    submit triggers a full recomputation. It also `console.log`s heavily (emoji-prefixed)
    on every call — that noise is in production logs.
16. **`getProgramDetail` has an O(n²) lock check** — for course *i* it re-queries all
    courses `0..i-1`.
17. **`getCourseDetail` duplicates its entire access check** — the same
    virtual/real enrollment verification block appears twice, back to back.
18. **`apps/web/utils/achievements.ts` is dead code.** Superseded by
    `packages/shared/gamification/badgeChecker.ts`, imported by nothing, and references a
    `badge.iconUrl` field that does not exist on the model (invisible thanks to #5).
19. **Unused dependencies in `apps/web/package.json`**: `froala-editor`,
    `react-froala-wysiwyg` (large, commercially licensed), `resend`, `react-swipeable`,
    `react-hook-form`, `@hookform/resolvers`, `zod`. Rich text is **TipTap**
    (`components/admin/games/ui/GameRichTextEditor.tsx`, `LessonForm.tsx`). Forms are
    hand-rolled `useState`, not react-hook-form. **There is no runtime input validation
    anywhere** — no zod schemas, request bodies are destructured and trusted.
20. **`.nvrmc`** at the repo root is a typo for `.nvmrc`, so no version manager reads it.
    Contents: `22`.
21. **`packages/database/db:seed` points at a nonexistent `prisma/seed.ts`** (§2).
22. `README.md` is empty; `apps/web/README.md` is the untouched create-next-app template.

---

## 10. Working conventions

- **Emoji-prefixed console logging** is the house style (`✅ 🔧 ⚠️ 🎯 📧 🔥`). Match it in
  code you touch; production logs are already full of it.
- **`// ✅ FIXED:` / `// 🆕 NEW:` comments** mark past bug fixes and additions throughout.
  They're historical breadcrumbs, not TODOs.
- Server Components call `lib/learner/queries.ts` directly; client components call the
  `/api/learner/*` routes, which call **the same query functions**. Keep that symmetry —
  it's deliberate, so both paths can't drift.
- Admin pages are almost all `'use client'` with `fetch` + `useState`. The `users` page is
  the exception: a server wrapper computes permission booleans and passes them into the
  client component. That's the better pattern; prefer it for new admin pages.
- Access control for learners belongs in `packages/shared/enrollment` — use
  `verifyProgramAccess` / `verifyLessonAccess` rather than hand-rolling assignment lookups
  (which is exactly how gotchas #2 and #3 happened).
- Comment headers with the file's own path (`// apps/web/app/api/.../route.ts`) are
  conventional at the top of most files. A few are stale/wrong (e.g. `GameRenderer.tsx`
  claims `components/games/`, `login/page.tsx` claims `app/learn/login/`) — trust the real
  path, not the comment.
