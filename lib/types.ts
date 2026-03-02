export interface SkillCluster {
  name: string;
  weight: number;
  keywords: string[];
}

export interface Role {
  id: string;
  title: string;
  description: string;
  icon: string;
  skill_clusters: SkillCluster[];
  must_include?: { code: string; semester: string; reason: string }[];
  preferred?: string[];
}

export interface ProfessorInfo {
  name: string;
  rmp_rating: number;
  rmp_difficulty: number;
  rmp_num_ratings: number;
}

export interface Course {
  code: string;
  title: string;
  department: string;
  credits: number;
  categories: string[];
  description: string;
  semesters_offered: string[];
  catalog_url: string;
  boilerclasses_url: string;
  professors: Record<string, { offered: boolean; professors: ProfessorInfo[] }>;
}

export interface ScoredCourse {
  code: string;
  title: string;
  department: string;
  credits: number;
  categories: string[];
  score: number;
  rationale: string;
  professor_note?: string;
  boilerclasses_url: string;
  description: string;
  semesters_offered: string[];
}

export interface PlannedCourse {
  code: string;
  title: string;
  department: string;
  credits: number;
  category_used: string;
  score: number;
  rationale: string;
  professor_name?: string;
  professor_rating?: number;
  boilerclasses_url: string;
}

export interface SemesterPlan {
  semester: string;
  courses: PlannedCourse[];
  total_credits: number;
}

export interface CreditSummary {
  systems: { required: number; fulfilled: number; courses: string[] };
  engineering_depth: { required: number; fulfilled: number; courses: string[]; discipline: string };
  professional_skills: { required: number; fulfilled: number; courses: string[] };
  elective: { required: number; fulfilled: number; courses: string[] };
  total: { required: number; fulfilled: number };
}

export interface GeneratedPlan {
  role: Role;
  semesters: SemesterPlan[];
  credit_summary: CreditSummary;
  generated_at: string;
  disclaimer: string;
}
