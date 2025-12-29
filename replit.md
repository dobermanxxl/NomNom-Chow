# Nom Nom Chow - Kids Meal Picker

## Overview

Nom Nom Chow is a production-ready full-stack web application for parents seeking kid-friendly meal ideas. The app provides an image-first "pick a meal → get shopping list + instructions" experience with AI-powered recipe generation. Domain target: nomnomchow.com.

Key features:
- Meal discovery with filters (age range, dietary needs, cuisine, skill level, time limit)
- AI-generated cooking instructions and shopping lists via OpenAI
- "My Fridge" feature for ingredient-based meal suggestions
- Admin dashboard with password-based authentication for meal management
- Draft meal system for content moderation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing with AnimatePresence transitions
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS with custom CSS variables for theming, plus Framer Motion for animations
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Fonts**: Fredoka (display), Nunito (body), Patrick Hand (handwriting) for kid-friendly aesthetics

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Session Management**: Express-session with MemoryStore (configurable for PostgreSQL via connect-pg-simple)
- **Authentication**: Simple password-based admin auth using environment variable `ADMIN_PASSWORD`
- **AI Integration**: OpenAI API (via Replit AI Integrations) for recipe generation

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Main Tables**:
  - `meals` - Core meal data with title, cuisine, skill level, time, dietary flags, age ranges
  - `generatedRecipes` - Cached AI-generated recipe outputs
  - `mealStats` - View counts and AI generation metrics
  - `draftMeals` - Pending meal submissions for admin review
  - `conversations`/`messages` - Chat feature support tables

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks (use-meals, use-admin)
│       ├── pages/        # Route components (Home, MealDetail, Fridge, Admin)
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API endpoint handlers
│   ├── storage.ts    # Database access layer
│   └── replit_integrations/  # AI features (chat, image, batch)
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API contract definitions with Zod
└── migrations/       # Drizzle database migrations
```

### Build System
- **Development**: `npm run dev` runs tsx with Vite middleware for HMR
- **Production**: `npm run build` compiles server with esbuild, client with Vite
- **Database**: `npm run db:push` syncs schema to database via Drizzle Kit

## External Dependencies

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations and database push

### AI Services
- **OpenAI API**: Recipe generation, accessed through Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Used for generating step-by-step cooking instructions and shopping lists

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `ADMIN_PASSWORD` - Password for admin dashboard access
- `SESSION_SECRET` - Express session encryption key (optional, defaults to 'secret')
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL

### Key NPM Packages
- Frontend: React, Wouter, TanStack Query, Framer Motion, shadcn/ui components
- Backend: Express, Drizzle ORM, OpenAI SDK, express-session
- Shared: Zod for validation, drizzle-zod for schema integration