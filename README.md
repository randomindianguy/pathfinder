# MEM Pathfinder 🧭

AI-powered course planning for Purdue Master of Engineering Management students.

**Pick your target role → Get a personalized 3-semester plan.**

## How It Works

1. Student selects one of 8 target career roles (PM, Consultant, Data Analyst, etc.)
2. Claude API scores 60+ MEM-eligible courses against that role's skill clusters
3. Claude API builds an optimal 3-semester plan satisfying all degree constraints
4. Student sees their personalized roadmap with course cards, credit tracking, and BoilerClasses links

## Tech Stack

- **Next.js 15** (App Router + TypeScript)
- **Tailwind CSS 3** (Purdue gold/black theme)
- **Claude API** (Anthropic SDK — claude-sonnet-4-5 for scoring + planning)
- **Lucide React** (icons)

## Quick Start

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Degree Constraints (hardcoded)

| Category | Credits | Rule |
|---|---|---|
| Systems | 9 (3 courses) | From approved systems list |
| Engineering Depth | 9 (3 courses) | Single discipline (e.g., all IE) |
| Professional Skills | 9 (3 courses) | From MGMT/ENGR/CE professional skills |
| Elective | 3 (1 course) | Any engineering/MGMT/STEM |
| **Total** | **30 (10 courses)** | Fall 2026 (4) → Spring 2027 (4) → Fall 2027 (2) |

## Project Structure

```
├── app/
│   ├── page.tsx                    # Landing — 8 role cards
│   ├── plan/[role]/page.tsx        # Plan view — 3-column semester layout
│   └── api/generate-plan/route.ts  # API: orchestrates 2 Claude calls
├── lib/
│   ├── claude.ts                   # Anthropic API client
│   ├── prompts.ts                  # Scoring + planning prompt templates
│   └── types.ts                    # TypeScript interfaces
├── data/
│   ├── courses.json                # 60+ courses with categories & descriptions
│   └── roles.json                  # 8 roles with weighted skill clusters
```

## Disclaimer

AI-generated course suggestions. Always verify with your MEM advisor before registering.
