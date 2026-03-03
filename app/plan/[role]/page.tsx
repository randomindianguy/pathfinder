"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  GraduationCap,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import { GeneratedPlan, PlannedCourse } from "@/lib/types";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  systems: { bg: "#DBEAFE", text: "#1D4ED8", label: "Systems" },
  engineering_depth: { bg: "#EDE9FE", text: "#6D28D9", label: "Eng Depth" },
  professional_skills: { bg: "#D1FAE5", text: "#047857", label: "Prof Skills" },
  elective: { bg: "#FEF3C7", text: "#B45309", label: "Elective" },
};

const LOADING_STEPS = [
  "Analyzing skill requirements...",
  "Scanning 60+ MEM-eligible courses...",
  "Scoring courses against your target role...",
  "Building your optimal 3-semester plan...",
  "Validating credit constraints...",
];

const BAR_COLORS: Record<string, string> = {
  systems: "#3B82F6",
  engineering_depth: "#8B5CF6",
  professional_skills: "#10B981",
  elective: "#F59E0B",
};

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.elective;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

function CourseCard({ course }: { course: PlannedCourse }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-mono text-xs mb-0.5" style={{ color: "#6B7280" }}>{course.code}</p>
          <h4 className="font-semibold text-sm leading-snug">{course.title}</h4>
        </div>
        <CategoryBadge category={course.category_used} />
      </div>

      <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B7280" }}>
        {course.rationale}
      </p>

      {course.boilerclasses_url && (
        <a
          href={course.boilerclasses_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium"
          style={{ color: "#2563EB" }}
        >
          Check professors & details on BoilerClasses <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

function CreditBar({ label, required, fulfilled, colorKey }: {
  label: string; required: number; fulfilled: number; colorKey: string;
}) {
  const pct = Math.min(100, (fulfilled / required) * 100);
  const met = fulfilled >= required;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-20 text-right" style={{ color: "#6B7280" }}>{label}</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: BAR_COLORS[colorKey] || "#9CA3AF" }}
        />
      </div>
      <span className="text-xs font-semibold w-16" style={{ color: met ? "#059669" : "#EF4444" }}>
        {fulfilled}/{required} cr
      </span>
      {met && <Check size={14} style={{ color: "#10B981" }} />}
    </div>
  );
}

export default function PlanPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.role as string;

  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Fast to 70% in ~10s (2.8% per 400ms)
        if (prev < 70) return prev + 2.8;
        // Slower to 85% in next ~10s (0.6% per 400ms)
        if (prev < 85) return prev + 0.6;
        // Crawl to 92% and stall (0.15% per 400ms)
        if (prev < 92) return prev + 0.15;
        return prev;
      });
      setElapsed((prev) => prev + 0.4);
    }, 400);

    const fetchPlan = async () => {
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to generate plan");
        }
        const data = await res.json();

        // Set progress to 100% and wait before showing plan
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 400));

        setPlan(data);
        posthog.capture("plan_viewed", {
          role: roleId,
          courses: data.semesters?.flatMap((s: { courses: { code: string }[] }) => s.courses.map((c: { code: string }) => c.code)),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    };

    fetchPlan();
    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [roleId]);

  // Loading
  if (!plan && !error) {
    const remaining = Math.max(0, Math.ceil(25 - elapsed));

    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
        <div className="text-center text-white max-w-md px-6">
          <Compass size={48} className="mx-auto mb-6 animate-pulse" style={{ color: "#CFB991" }} />
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
            Building your plan...
          </h2>
          <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>
            Analyzing 60+ courses with AI — this takes upto 60 seconds
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1F2937" }}>
              <div
                className="h-full transition-all duration-[400ms] ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #CFB991, #E8D5A8)",
                }}
              />
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center justify-between text-xs mb-8" style={{ color: "#9CA3AF" }}>
            <span>{Math.round(progress)}%</span>
            <span>~{remaining}s remaining</span>
          </div>

          {/* Step Checklist */}
          <div className="space-y-3">
            {LOADING_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= loadingStep ? "opacity-100" : "opacity-30"}`}>
                {i < loadingStep ? (
                  <Check size={16} style={{ color: "#CFB991" }} className="shrink-0" />
                ) : i === loadingStep ? (
                  <Loader2 size={16} style={{ color: "#CFB991" }} className="shrink-0 animate-spin" />
                ) : (
                  <div className="w-4 h-4 shrink-0" />
                )}
                <span className="text-sm text-left">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#FAFAF8" }}>
        <div className="text-center max-w-md px-6">
          <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: "#F59E0B" }} />
          <h2 className="text-xl font-bold mb-2">Plan generation failed</h2>
          <p className="mb-6" style={{ color: "#6B7280" }}>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 text-white rounded-lg font-medium transition-colors"
            style={{ background: "#000" }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const { role, semesters, credit_summary } = plan!;

  return (
    <main className="min-h-screen" style={{ background: "#FAFAF8" }}>
      {/* Header */}
      <div style={{ background: "#000" }} className="text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: "#9CA3AF" }}
          >
            <ArrowLeft size={16} /> Choose a different role
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Compass size={24} style={{ color: "#CFB991" }} />
            <span style={{ color: "#CFB991" }} className="text-xs font-semibold uppercase tracking-wide">
              MEM Pathfinder
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
            Your path to <span style={{ color: "#CFB991" }}>{role.title}</span>
          </h1>
          <p className="mt-2" style={{ color: "#9CA3AF" }}>
            Fall 2026 → Spring 2027 → Fall 2027 · 30 credits · 10 courses
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: "#EBF5FF", border: "1px solid #BFDBFE" }}>
          <Compass size={14} className="shrink-0 mt-0.5" style={{ color: "#1E40AF" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#1E3A8A" }}>
            <strong>This is one possible plan.</strong> There are many valid paths to {role.title}. Use this as a starting point for your advisor conversation.
          </p>
        </div>
      </div>

      {/* Credit Summary */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={18} style={{ color: "#6B7280" }} />
            <h3 className="font-semibold text-sm">Credit Requirements</h3>
            {credit_summary.engineering_depth.discipline && (
              <span className="ml-auto text-xs" style={{ color: "#6B7280" }}>
                Depth discipline: <strong>{credit_summary.engineering_depth.discipline}</strong>
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            <CreditBar label="Systems" required={credit_summary.systems.required} fulfilled={credit_summary.systems.fulfilled} colorKey="systems" />
            <CreditBar label="Eng Depth" required={credit_summary.engineering_depth.required} fulfilled={credit_summary.engineering_depth.fulfilled} colorKey="engineering_depth" />
            <CreditBar label="Prof Skills" required={credit_summary.professional_skills.required} fulfilled={credit_summary.professional_skills.fulfilled} colorKey="professional_skills" />
            <CreditBar label="Elective" required={credit_summary.elective.required} fulfilled={credit_summary.elective.fulfilled} colorKey="elective" />
          </div>
        </div>
      </div>

      {/* 3-Column Semester Layout */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="rounded-lg p-3 mb-6 flex items-start gap-2" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#B45309" }} />
          <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
            <strong>Heads up:</strong> This plan recommends courses, not professors. Always check professor ratings and reviews on BoilerClasses before registering.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {semesters.map((sem) => (
            <div key={sem.semester}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                  {sem.semester}
                </h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: "#6B7280", background: "#F3F4F6" }}>
                  {sem.total_credits} credits
                </span>
              </div>
              <div className="space-y-3">
                {sem.courses.map((course) => (
                  <CourseCard key={course.code} course={course} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-200" style={{ background: "#F9FAFB" }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs text-center leading-relaxed max-w-2xl mx-auto" style={{ color: "#6B7280" }}>
            <strong>Disclaimer:</strong> {plan!.disclaimer}
          </p>
          <p className="text-[10px] text-center mt-2" style={{ color: "#9CA3AF" }}>
            Built for Purdue MEM students · Course data from{" "}
            <a href="https://engineering.purdue.edu/EngineeringManagement" className="underline" target="_blank" rel="noopener noreferrer">Purdue MEM</a>
            {" & "}
            <a href="https://boilerclasses.com" className="underline" target="_blank" rel="noopener noreferrer">BoilerClasses</a>
            {" · Built by "}
            <a href="https://www.linkedin.com/in/sidharthsundaram/" style={{ color: "#CFB991" }} className="hover:underline" target="_blank" rel="noopener noreferrer">Sidharth Sundaram</a>
          </p>
        </div>
      </div>
    </main>
  );
}
