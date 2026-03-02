import { Role, Course } from "./types";

interface RoleWithCuration extends Role {
  must_include?: { code: string; semester: string; reason: string }[];
  preferred?: string[];
}

export function buildScoringPrompt(role: RoleWithCuration, courses: Course[]): string {
  const courseList = courses.map(c => ({
    code: c.code,
    title: c.title,
    department: c.department,
    credits: c.credits,
    categories: c.categories,
    description: c.description,
    semesters_offered: c.semesters_offered,
  }));

  const mustIncludeCodes = (role.must_include || []).map(m => m.code);
  const preferredCodes = role.preferred || [];

  return `You are an expert career advisor for Purdue University's Master of Engineering Management (MEM) program.

A student wants to become a: **${role.title}** — ${role.description}

The key skill clusters for this role (ranked by importance):
${role.skill_clusters.map((s, i) => `${i + 1}. ${s.name} (weight: ${s.weight}) — keywords: ${s.keywords.join(", ")}`).join("\n")}

MANDATORY COURSES (these MUST be scored 95+):
${mustIncludeCodes.length > 0 ? mustIncludeCodes.join(", ") : "None"}

STRONGLY PREFERRED COURSES (these should be scored 80+ unless truly irrelevant):
${preferredCodes.length > 0 ? preferredCodes.join(", ") : "None"}

Below are the available MEM courses. Score EACH course 0-100 on relevance to the target role of "${role.title}".

Scoring guidelines:
- 95-100: Mandatory course OR directly builds a core skill for this role
- 80-94: Preferred course OR builds a critical supporting skill
- 60-79: Builds a useful adjacent skill
- 40-59: Somewhat relevant but not a priority
- 0-39: Low relevance to this specific role

For each course, write a 1-sentence rationale (max 20 words) connecting it to the role.

COURSES:
${JSON.stringify(courseList, null, 2)}

Respond with ONLY a valid JSON array. No markdown, no explanation, no backticks. Each element:
{"code": "IE 57700", "score": 88, "rationale": "Builds critical UX research skills for understanding user needs"}`;
}

export function buildPlanningPrompt(
  role: RoleWithCuration,
  scoredCourses: { code: string; score: number; rationale: string }[],
  courses: Course[],
  remainingSlots?: Record<string, number>,
  prePlacedCodes?: Set<string>
): string {
  const mustInclude = role.must_include || [];
  const preferredCodes = role.preferred || [];
  const prePlaced = prePlacedCodes || new Set();

  // Merge scored data with full course data, EXCLUDING pre-placed courses
  const enriched = scoredCourses
    .filter(sc => sc.score >= 40 && !prePlaced.has(sc.code))
    .sort((a, b) => b.score - a.score)
    .map(sc => {
      const full = courses.find(c => c.code === sc.code);
      return {
        code: sc.code,
        title: full?.title || "",
        department: full?.department || "",
        credits: full?.credits || 3,
        categories: full?.categories || [],
        semesters_offered: full?.semesters_offered || [],
        score: sc.score,
        rationale: sc.rationale,
      };
    });

  const mustIncludeBlock = mustInclude.length > 0
    ? `\nPRE-PLACED COURSES (these courses are ALREADY placed in the plan — do NOT include them again):
${mustInclude.map(m => `- ${m.code} → ${m.semester} (${m.reason})`).join("\n")}`
    : "";

  const preferredBlock = preferredCodes.length > 0
    ? `\nSTRONGLY PREFERRED (include as many of these as possible while satisfying constraints):
${preferredCodes.filter(code => !prePlaced.has(code)).join(", ")}`
    : "";

  const slotsBlock = remainingSlots
    ? `\nREMAINING SLOTS TO FILL (you are filling ONLY these remaining slots):
- Fall 2026: ${remainingSlots["Fall 2026"]} courses
- Spring 2027: ${remainingSlots["Spring 2027"]} courses
- Fall 2027: ${remainingSlots["Fall 2027"]} courses
TOTAL COURSES TO SELECT: ${remainingSlots["Fall 2026"] + remainingSlots["Spring 2027"] + remainingSlots["Fall 2027"]} courses`
    : `\nSEMESTERS: Fall 2026 = 4 courses (12 cr), Spring 2027 = 4 courses (12 cr), Fall 2027 = 2 courses (6 cr)`;

  return `You are building a 3-semester course plan for a Purdue MEM student targeting: **${role.title}**

HARD CONSTRAINTS (the plan MUST satisfy ALL of these):
1. SYSTEMS: At least 9 credits (3 courses) from courses that have "systems" in their categories array
2. ENGINEERING DEPTH: At least 9 credits (3 courses) from a SINGLE engineering discipline (courses with "engineering_depth_XX" where XX is the same department for all 3)
3. PROFESSIONAL SKILLS: At least 9 credits (3 courses) from courses with "professional_skills" in their categories
4. ELECTIVE: At least 3 credits (1 course) from any remaining course
5. TOTAL: Exactly 30 credits (10 courses) across the ENTIRE plan (including pre-placed courses)
6. OVERLAP: A course with BOTH "systems" and "engineering_depth_IE" categories can count toward BOTH the systems and engineering depth requirements simultaneously
7. AVAILABILITY: Each course must be offered in its assigned semester. Check the "semesters_offered" field — "Fall" courses go in Fall 2026 or Fall 2027, "Spring" courses go in Spring 2027. Courses offered both "Fall" and "Spring" can go anywhere.
${mustIncludeBlock}
${slotsBlock}
${preferredBlock}

CATEGORY ASSIGNMENT RULES:
- When assigning "category_used" for each course, use the category that best fills an unfilled requirement
- A course with categories ["systems", "engineering_depth_IE"] should be assigned "systems" if it's one of the 3 filling the systems requirement, OR "engineering_depth" if it's filling that bucket — but remember overlap means it counts for both internally
- Professional skills courses get "professional_skills"
- The 10th course (or any beyond the required 9+9+9) gets "elective"

SEQUENCING:
- Put foundational courses (statistics, analytics, intro-level) in Fall 2026
- Put applied/advanced courses in Spring 2027 and Fall 2027
- Professional skills courses can go in any semester

RANKED COURSES (by relevance to ${role.title}):
${JSON.stringify(enriched, null, 2)}

Build the OPTIMAL plan that maximizes relevance to ${role.title} while satisfying all constraints.

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "semesters": [
    {
      "semester": "Fall 2026",
      "courses": [
        {
          "code": "IE 57700",
          "title": "Human Factors in Engineering",
          "department": "IE",
          "credits": 3,
          "category_used": "systems",
          "score": 88,
          "rationale": "Builds UX research skills critical for PM roles"
        }
      ]
    }
  ],
  "credit_summary": {
    "systems": { "required": 9, "fulfilled": 9, "courses": ["IE 57700", "IE 55900", "IE 53300"] },
    "engineering_depth": { "required": 9, "fulfilled": 9, "courses": ["IE 57700", "IE 55900", "IE 53300"], "discipline": "IE" },
    "professional_skills": { "required": 9, "fulfilled": 9, "courses": ["CE 59601", "CE 59700", "MGMT 67000"] },
    "elective": { "required": 3, "fulfilled": 3, "courses": ["MGMT 68700"] },
    "total": { "required": 30, "fulfilled": 30 }
  }
}`;
}
