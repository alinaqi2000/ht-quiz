# Techsoft Quiz Platform

A comprehensive quiz management and participation platform built with Next.js. Create and manage quizzes as an administrator, or participate in timed assessments with automatic scoring and detailed results tracking.

## Features

### Admin Panel

#### Dashboard (`/admin/dashboard`)
- Statistics overview: total users, quizzes, completions, and average scores
- Recent submissions list with scores and timestamps
- Quiz performance metrics with participation rates

#### Quiz Management (`/admin/quizzes`)
- Create quizzes with title, description, difficulty level, duration, and type (public/private)
- List quizzes with difficulty badges, question counts, and attempt counts
- Edit or delete existing quizzes
- View and manage quiz-specific results

#### Question Management (`/admin/quizzes/[id]/questions`)
- Add questions with text, 4 answer options (A-D), correct answer, and difficulty
- Edit or delete questions
- Visual display with correct answer highlighted

#### Quiz Assignment (`/admin/quizzes/[id]/assign`)
- **Public Links**: Generate shareable links for anyone with optional expiration
- **Private Links**: Assign quizzes to specific users with individual tracking
- Copy to clipboard functionality
- Track used/unused status per link
- Optional time-based link expiration

#### User Management (`/admin/users`)
- Create users with name, email, password, role (Admin/User), and Group Leader flag
- List users with role badges and attempt counts
- Edit or delete users
- View all quiz links assigned to a specific user

#### Results Tracking (`/admin/results`)
- Complete list of all quiz attempts
- Per-quiz statistics and per-user breakdown
- Color-coded scores: green (70%+), yellow (50-69%), red (<50%)
- Completion status and submission timestamps

### Quiz Participation

#### Quiz Entry (`/quiz/[token]`)
- Token validation with expiration checking
- User registration for public quizzes
- Group Leader selection dropdown
- Quiz preview showing title, description, question count, and duration
- Start confirmation with time warning

#### Quiz Taking (`/quiz/[token]/attempt`)
- Visual countdown timer with warning states:
  - Normal: white display
  - Warning (yellow): 5 minutes remaining
  - Danger (red, pulsing): 1 minute remaining
- Question navigation with scrollable list
- Progress tracking showing answered/total questions
- Radio-style answer selection (A, B, C, D)
- Autosave to localStorage on every change
- Server-side autosave every 30 seconds
- LocalStorage recovery for interrupted sessions
- Auto-submit when timer expires

#### Quiz Submission
- Submit button with confirmation dialog
- Automatic submission on timer expiration
- Instant score calculation
- Success confirmation screen
- Double-submission prevention

### Authentication & Security

- JWT session-based authentication
- Password hashing with bcrypt (12 rounds)
- Role-based access control (ADMIN and USER roles)
- Middleware route protection
- Edge-compatible authentication
- Credentials-based login

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM + Turso |
| Authentication | NextAuth.js 5 (beta) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Form Validation | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Sonner |

## Project Structure

```
src/
├── app/
│   ├── (admin)/           # Protected admin routes
│   │   └── admin/
│   │       ├── dashboard/    # Dashboard
│   │       ├── quizzes/      # Quiz management
│   │       ├── users/        # User management
│   │       └── results/      # Results viewing
│   ├── (auth)/           # Authentication routes
│   │   └── login/
│   ├── api/              # API endpoints
│   │   ├── admin/           # Admin APIs
│   │   ├── auth/            # NextAuth handlers
│   │   └── quiz/            # Public quiz APIs
│   └── quiz/              # Quiz participation
│       └── [token]/
├── components/
│   ├── admin/               # Admin components
│   ├── quiz/                # Quiz-taking components
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Database client
│   ├── scoring.ts           # Score calculation
│   └── utils.ts             # Utilities
├── hooks/                   # Custom React hooks
├── schemas/                 # Zod validation schemas
└── types/                   # TypeScript types
```

## Database Schema

### Models

**User** - System users with roles
- id, name, email, password, role, isGroupLeader, timestamps

**Quiz** - Quiz definitions
- id, title, description, difficulty, durationMin, type, isActive, timestamps

**Question** - Quiz questions
- id, text, optionA-D, correctAnswer, difficulty, order, quizId, timestamps

**QuizAttempt** - User quiz submissions
- id, userId, quizId, answers (JSON), score, totalPoints, startedAt, submittedAt, isComplete

**QuizLink** - Shareable quiz links
- id, userId, quizId, token, used, usedAt, expiresAt, createdAt

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### Public Quiz APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/attempt` | Start quiz attempt |
| PATCH | `/api/quiz/attempt` | Autosave answers |
| POST | `/api/quiz/submit` | Submit and score |
| POST | `/api/quiz/validate` | Validate token |

### Admin Quiz APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/quizzes` | List/Create quizzes |
| GET/PUT/DELETE | `/api/admin/quizzes/[id]` | Quiz CRUD |
| GET/POST | `/api/admin/quizzes/[id]/questions` | Questions CRUD |
| GET/PUT/DELETE | `/api/admin/quizzes/[id]/questions/[qid]` | Question CRUD |
| POST | `/api/admin/quizzes/[id]/assign` | Assign to users |
| POST/DELETE | `/api/admin/quizzes/[id]/public-link` | Public link management |
| GET | `/api/admin/quizzes/[id]/results` | Quiz results |

### Admin User APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/users` | List/Create users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | User CRUD |

### Admin Results APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/results` | All results |
| GET | `/api/admin/dashboard` | Dashboard stats |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ht-quiz

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database URL and secrets
```

### Environment Variables

```env
DATABASE_URL="libsql://your-database.turso.io"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
DATABASE_AUTH_TOKEN="your-turso-auth-token"
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Default Admin Credentials

After seeding:
- **Email:** admin@htquiz.com
- **Password:** admin123

## Architecture Highlights

### Server Components First
- Admin pages use Server Components for performance
- Client components only where interactivity is needed
- Direct database access from server components

### Form Handling
- React Hook Form for all forms
- Zod schemas for validation on both client and server
- Real-time validation feedback

### Autosave System
- LocalStorage saves on every answer change
- Server autosave every 30 seconds
- Draft recovery on page reload

### Responsive Design
- Mobile-first approach
- Collapsible admin sidebar
- Adaptive layouts for all screen sizes

## License

MIT
