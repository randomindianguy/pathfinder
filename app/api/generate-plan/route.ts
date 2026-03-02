import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJSON } from "@/lib/claude";
import { buildScoringPrompt, buildPlanningPrompt } from "@/lib/prompts";
import { Role, Course, GeneratedPlan } from "@/lib/types";
import rolesData from "@/data/roles.json";
import coursesData from "@/data/courses.json";

const roles = rolesData as Record<string, Role>;
const courses = coursesData as Course[];

/**
 * Post-process: deterministically assign category_used based on actual course data.
 * Claude often gets this wrong, so we fix it here.
 */
function assignCategories(
  plannedCourses: { code: string; [key: string]: unknown }[]
): { categoryMap: Record<string, string>; summary: ReturnType<typeof buildSummary> } {
  const categoryMap: Record<string, string> = {};
  const assigned = {
    systems: [] as string[],
    engineering_depth: [] as string[],
    professional_skills: [] as string[],
    elective: [] as string[],
  };

  // Get course data for each planned course
  const courseData = plannedCourses.map((pc) => {
    const full = courses.find((c) => c.code === pc.code);
    return { code: pc.code, categories: full?.categories || [] };
  });

  // Step 1: Assign professional_skills first (unambiguous)
  courseData.forEach((c) => {
    if (c.categories.includes("professional_skills") && assigned.professional_skills.length < 3) {
      categoryMap[c.code] = "professional_skills";
      assigned.professional_skills.push(c.code);
    }
  });

  // Step 2: Find best engineering depth discipline
  const depthCounts: Record<string, string[]> = {};
  courseData.forEach((c) => {
    if (categoryMap[c.code]) return; // already assigned
    c.categories
      .filter((cat) => cat.startsWith("engineering_depth_"))
      .forEach((cat) => {
        const disc = cat.replace("engineering_depth_", "");
        if (!depthCounts[disc]) depthCounts[disc] = [];
        depthCounts[disc].push(c.code);
      });
  });

  // Pick discipline with most available courses
  let bestDisc = "IE";
  let bestCount = 0;
  Object.entries(depthCounts).forEach(([disc, codes]) => {
    if (codes.length > bestCount) {
      bestDisc = disc;
      bestCount = codes.length;
    }
  });

  // Step 3: Assign engineering_depth (these also count as systems via overlap)
  const depthCandidates = depthCounts[bestDisc] || [];
  depthCandidates.forEach((code) => {
    if (!categoryMap[code] && assigned.engineering_depth.length < 3) {
      categoryMap[code] = "engineering_depth";
      assigned.engineering_depth.push(code);
    }
  });

  // Step 4: Assign systems (courses with "systems" not yet assigned)
  courseData.forEach((c) => {
    if (!categoryMap[c.code] && c.categories.includes("systems") && assigned.systems.length < 3) {
      categoryMap[c.code] = "systems";
      assigned.systems.push(c.code);
    }
  });

  // Step 5: Everything else is elective
  courseData.forEach((c) => {
    if (!categoryMap[c.code]) {
      categoryMap[c.code] = "elective";
      assigned.elective.push(c.code);
    }
  });

  // Build credit summary
  // For systems fulfillment: engineering_depth courses that also have "systems" count toward systems too
  const systemsFulfilled = new Set<string>();
  assigned.systems.forEach((c) => systemsFulfilled.add(c));
  assigned.engineering_depth.forEach((code) => {
    const full = courseData.find((c) => c.code === code);
    if (full?.categories.includes("systems")) {
      systemsFulfilled.add(code);
    }
  });

  const summary = buildSummary(assigned, systemsFulfilled, bestDisc);
  return { categoryMap, summary };
}

function buildSummary(
  assigned: Record<string, string[]>,
  systemsFulfilled: Set<string>,
  discipline: string
) {
  return {
    systems: {
      required: 9,
      fulfilled: systemsFulfilled.size * 3,
      courses: Array.from(systemsFulfilled),
    },
    engineering_depth: {
      required: 9,
      fulfilled: assigned.engineering_depth.length * 3,
      courses: assigned.engineering_depth,
      discipline,
    },
    professional_skills: {
      required: 9,
      fulfilled: assigned.professional_skills.length * 3,
      courses: assigned.professional_skills,
    },
    elective: {
      required: 3,
      fulfilled: assigned.elective.length * 3,
      courses: assigned.elective,
    },
    total: {
      required: 30,
      fulfilled:
        (systemsFulfilled.size +
          assigned.engineering_depth.length +
          assigned.professional_skills.length +
          assigned.elective.length) *
          3 -
        // Subtract overlap (depth courses counted in systems)
        assigned.engineering_depth.filter((c) =>
          Array.from(systemsFulfilled).includes(c)
        ).length *
          3 +
        // Actually, total is just number of courses * 3
        0,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { roleId } = await request.json();

    if (!roleId || !roles[roleId]) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    const role = roles[roleId];

    // Step 1: Score all courses against this role
    const scoringPrompt = buildScoringPrompt(role, courses);
    const scoringRaw = await callClaude(scoringPrompt);
    const scoredCourses = parseJSON<
      { code: string; score: number; rationale: string }[]
    >(scoringRaw);

    // Step 2: Build the semester plan
    const planningPrompt = buildPlanningPrompt(role, scoredCourses, courses);
    const planningRaw = await callClaude(planningPrompt);
    const plan = parseJSON<{
      semesters: {
        semester: string;
        courses: {
          code: string;
          title: string;
          department: string;
          credits: number;
          category_used: string;
          score: number;
          rationale: string;
        }[];
      }[];
      credit_summary: unknown;
    }>(planningRaw);

    // Step 3: POST-PROCESS — fix categories deterministically
    const allPlannedCourses = plan.semesters.flatMap((s) => s.courses);
    const { categoryMap, summary } = assignCategories(allPlannedCourses);

    // Enrich with correct categories + boilerclasses URLs
    const enrichedSemesters = plan.semesters.map((sem) => ({
      ...sem,
      courses: sem.courses.map((c) => {
        const fullCourse = courses.find((fc) => fc.code === c.code);
        return {
          ...c,
          category_used: categoryMap[c.code] || c.category_used,
          boilerclasses_url: fullCourse?.boilerclasses_url || "",
        };
      }),
      total_credits: sem.courses.reduce((sum, c) => sum + c.credits, 0),
    }));

    const totalCredits = enrichedSemesters.reduce((s, sem) => s + sem.total_credits, 0);

    const result: GeneratedPlan = {
      role,
      semesters: enrichedSemesters,
      credit_summary: {
        ...summary,
        total: { required: 30, fulfilled: totalCredits },
      },
      generated_at: new Date().toISOString(),
      disclaimer:
        "This is an AI-generated course suggestion — not a substitute for academic advising. Always verify course availability, plan details, and professor ratings with your MEM advisor and BoilerClasses before registering.",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Plan generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate plan. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
