"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import {
  Lightbulb,
  Briefcase,
  Settings,
  Truck,
  BarChart3,
  GitBranch,
  FileSearch,
  Rocket,
  Compass,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Lightbulb, Briefcase, Settings, Truck, BarChart3, GitBranch, FileSearch, Rocket,
};

const roles = [
  { id: "product_manager", title: "Product Manager", description: "Drive product strategy, roadmap, and execution at tech companies", icon: "Lightbulb" },
  { id: "management_consultant", title: "Management Consultant", description: "Advise organizations on strategy, operations, and transformation", icon: "Briefcase" },
  { id: "operations_manager", title: "Operations Manager", description: "Optimize processes, manage teams, and drive operational efficiency", icon: "Settings" },
  { id: "supply_chain_analyst", title: "Supply Chain Analyst", description: "Analyze and optimize end-to-end supply chain performance", icon: "Truck" },
  { id: "data_analyst", title: "Data Analyst", description: "Transform data into insights that drive business decisions", icon: "BarChart3" },
  { id: "technical_program_manager", title: "Technical Program Manager", description: "Coordinate complex engineering programs across teams and systems", icon: "GitBranch" },
  { id: "business_analyst", title: "Business Analyst", description: "Bridge business needs and technical solutions through analysis", icon: "FileSearch" },
  { id: "strategy_ops", title: "Strategy & Ops", description: "Drive strategic initiatives and scale ops at high-growth companies", icon: "Rocket" },
];

const stats = [
  { value: "60+", label: "Courses analyzed" },
  { value: "8", label: "Career paths" },
  { value: "3", label: "Semesters planned" },
  { value: "30", label: "Credits optimized" },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelect = (roleId: string) => {
    setLoading(roleId);
    posthog.capture("role_selected", { role: roleId });
    router.push(`/plan/${roleId}`);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        
        .hero-grain {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          pointer-events: none;
        }
        
        .gold-line {
          background: linear-gradient(90deg, transparent, #CFB991, transparent);
          height: 1px;
        }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        
        .animate-fade-up {
          opacity: 0;
          animation: fadeUp 0.7s ease-out forwards;
        }
        
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .role-card {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .role-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #CFB991, transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        
        .role-card:hover::before {
          opacity: 1;
        }
        
        .role-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(207, 185, 145, 0.3);
        }
        
        .role-card .card-arrow {
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .role-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        
        .role-card .card-icon {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .role-card:hover .card-icon {
          background: #CFB991 !important;
          color: #000 !important;
        }
        
        .compass-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .scroll-hint {
          animation: fadeIn 1s ease 2s forwards;
          opacity: 0;
        }
      `}</style>

      <main className="min-h-screen" style={{ background: "#FAFAF8" }}>
        {/* ═══ HERO ═══ */}
        <div style={{ background: "#000" }} className="relative overflow-hidden">
          <div className="hero-grain" />
          
          {/* Subtle diagonal accent */}
          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #CFB991, transparent 70%)" }}
          />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full opacity-[0.03]"
            style={{ background: "radial-gradient(circle, #CFB991, transparent 70%)" }}
          />

          <div className="max-w-5xl mx-auto px-6 pt-12 pb-20 md:pt-16 md:pb-28 relative">
            {/* Top bar */}
            <div
              className={`flex items-center gap-3 mb-12 md:mb-16 ${mounted ? "animate-fade-in" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              <div className="compass-float">
                <Compass size={28} style={{ color: "#CFB991" }} />
              </div>
              <span
                className="text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ color: "#CFB991" }}
              >
                MEM Pathfinder
              </span>
              <div className="flex-1" />
              <div className="text-right">
                <span className="text-xs tracking-wide block" style={{ color: "#555960" }}>
                  Purdue Engineering Management
                </span>
                <span className="text-[10px] tracking-wide block" style={{ color: "#555960", opacity: 0.6 }}>
                  Not affiliated with Purdue
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 text-white ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                animationDelay: "0.2s",
              }}
            >
              Your degree.
              <br />
              Your career.
              <br />
              <span
                style={{
                  color: "#CFB991",
                  backgroundImage: "linear-gradient(90deg, #CFB991, #E8D5A8, #CFB991)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "shimmer 4s linear infinite",
                }}
              >
                Your roadmap.
              </span>
            </h1>

            <p
              className={`text-base md:text-lg max-w-lg leading-relaxed mb-12 ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{
                color: "#9CA3AF",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                animationDelay: "0.4s",
              }}
            >
              Tell us where you want to land after Purdue MEM. 
              Our AI analyzes every eligible course and builds your 
              optimal three-semester plan.
            </p>

            {/* Stats row */}
            <div
              className={`flex gap-8 md:gap-12 ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.6s" }}
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <div
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: "#CFB991", fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider mt-1" style={{ color: "#555960" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll hint */}
            <div className="scroll-hint absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: "#555960" }}>
                Choose your path
              </span>
              <ChevronDown size={16} style={{ color: "#555960" }} className="animate-bounce" />
            </div>
          </div>
        </div>

        {/* Gold separator */}
        <div className="gold-line" />

        {/* ═══ ROLE SELECTION ═══ */}
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span
                className={`text-[11px] uppercase tracking-[0.15em] font-semibold block mb-3 ${mounted ? "animate-fade-in" : "opacity-0"}`}
                style={{ color: "#CFB991", animationDelay: "0.8s" }}
              >
                Select a role
              </span>
              <h2
                className={`text-3xl md:text-4xl font-bold ${mounted ? "animate-fade-up" : "opacity-0"}`}
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "#1a1a1a",
                  animationDelay: "0.9s",
                }}
              >
                Where do you want to land?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role, i) => {
              const Icon = iconMap[role.icon] || Lightbulb;
              const isLoading = loading === role.id;
              const delay = 1.0 + i * 0.08;

              return (
                <button
                  key={role.id}
                  onClick={() => handleSelect(role.id)}
                  disabled={loading !== null}
                  className={`role-card text-left p-5 rounded-xl bg-white ${mounted ? "animate-fade-up" : "opacity-0"}`}
                  style={{
                    border: isLoading ? "1.5px solid #CFB991" : "1.5px solid #E5E7EB",
                    backgroundColor: isLoading ? "#FFFBF0" : "#fff",
                    opacity: loading && !isLoading ? 0.4 : undefined,
                    animationDelay: `${delay}s`,
                    cursor: loading ? "default" : "pointer",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="card-icon w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: isLoading ? "#CFB991" : "#F3F4F6", color: isLoading ? "#000" : "#555960" }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="card-arrow" style={{ color: "#CFB991" }}>
                      {isLoading ? (
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: "#CFB991", borderTopColor: "transparent" }}
                        />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </div>
                  </div>
                  <h3
                    className="font-bold text-sm mb-1.5"
                    style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1a1a1a" }}
                  >
                    {role.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div style={{ borderTop: "1px solid #E5E7EB" }}>
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass size={16} style={{ color: "#CFB991" }} />
              <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                MEM Pathfinder
              </span>
            </div>
            <p className="text-[11px] text-center md:text-right leading-relaxed" style={{ color: "#9CA3AF" }}>
              Built for incoming Purdue MEM students · Fall 2026 → Fall 2027
              <br />
              AI-generated suggestions — always confirm with your MEM advisor
              <br />
              Built by{" "}
              <a
                href="https://www.linkedin.com/in/sidharthsundaram/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#CFB991" }}
                className="hover:underline"
              >
                Sidharth Sundaram
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
