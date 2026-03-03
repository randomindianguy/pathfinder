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
  plannedCourses: { code: string; [key: string]: unknown }[],
  depthDepartment: string
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

  // Step 2: Use user-selected depth discipline
  const depthCategory = `engineering_depth_${depthDepartment}`;

  // Step 3: Assign engineering_depth (only from selected discipline, these also count as systems via overlap)
  courseData.forEach((c) => {
    if (!categoryMap[c.code] &&
        c.categories.includes(depthCategory) &&
        assigned.engineering_depth.length < 3) {
      categoryMap[c.code] = "engineering_depth";
      assigned.engineering_depth.push(c.code);
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

  const summary = buildSummary(assigned, systemsFulfilled, depthDepartment);
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
    const { roleId, depthDepartment } = await request.json();

    if (!roleId || !roles[roleId]) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    const role = roles[roleId];
    const selectedDepth = depthDepartment || "IE";

    // PRE-PLACEMENT: Place must_include courses before calling Claude
    const mustInclude = role.must_include || [];
    const prePlacedCodes = new Set(mustInclude.map(m => m.code));

    // Create pre-placed semester structure
    const prePlacedBySemester: Record<string, typeof mustInclude> = {
      "Fall 2026": [],
      "Spring 2027": [],
      "Fall 2027": [],
    };

    mustInclude.forEach(m => {
      if (prePlacedBySemester[m.semester]) {
        prePlacedBySemester[m.semester].push(m);
      }
    });

    // Calculate remaining slots per semester
    const remainingSlots = {
      "Fall 2026": 4 - prePlacedBySemester["Fall 2026"].length,
      "Spring 2027": 4 - prePlacedBySemester["Spring 2027"].length,
      "Fall 2027": 2 - prePlacedBySemester["Fall 2027"].length,
    };

    // Step 1: Score all courses against this role
    const scoringPrompt = buildScoringPrompt(role, courses);
    const scoringRaw = await callClaude(scoringPrompt);
    const scoredCourses = parseJSON<
      { code: string; score: number; rationale: string }[]
    >(scoringRaw);

    // Step 2: Build the semester plan (Claude only fills remaining slots)
    const planningPrompt = buildPlanningPrompt(role, scoredCourses, courses, remainingSlots, prePlacedCodes, selectedDepth);
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

    // Step 3: MERGE pre-placed courses with Claude's picks
    const mergedSemesters = plan.semesters.map(sem => {
      const prePlaced = prePlacedBySemester[sem.semester] || [];
      const prePlacedCourses = prePlaced.map(m => {
        const fullCourse = courses.find(c => c.code === m.code);
        const scored = scoredCourses.find(sc => sc.code === m.code);
        return {
          code: m.code,
          title: fullCourse?.title || "",
          department: fullCourse?.department || "",
          credits: fullCourse?.credits || 3,
          category_used: "professional_skills", // Will be fixed in post-processor
          score: scored?.score || 95,
          rationale: m.reason,
        };
      });

      return {
        ...sem,
        courses: [...prePlacedCourses, ...sem.courses],
      };
    });

    // Step 4: POST-PROCESS — fix categories deterministically
    const allPlannedCourses = mergedSemesters.flatMap((s) => s.courses);
    const { categoryMap, summary } = assignCategories(allPlannedCourses, selectedDepth);

    // Enrich with correct categories + boilerclasses URLs
    const enrichedSemesters = mergedSemesters.map((sem) => ({
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
