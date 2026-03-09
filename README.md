Live Demo: https://sid-pathfinder.vercel.app/

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
