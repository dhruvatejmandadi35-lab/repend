import { useState } from "react";
import DynamicLabRenderer from "@/components/labs/DynamicLabRenderer";
import { ECONOMICS_SIM_HTML } from "@/components/labs/prebuilt/economicsSimHTML";
import { BIOLOGY_CELL_HTML } from "@/components/labs/prebuilt/biologyCellHTML";
import { PHYSICS_PROJECTILE_HTML } from "@/components/labs/prebuilt/physicsProjectileHTML";

const LABS = [
  {
    id: "economics",
    label: "🏪 Economics",
    title: "Market Equilibrium Explorer",
    description: "Supply & demand curves with live SVG graph",
    topics: "supply, demand, market equilibrium, elasticity",
    html: ECONOMICS_SIM_HTML,
  },
  {
    id: "biology",
    label: "🔬 Biology",
    title: "Build the Cell",
    description: "Click-to-place organelles on a cell diagram",
    topics: "cell, organelle, mitochondria, photosynthesis",
    html: BIOLOGY_CELL_HTML,
  },
  {
    id: "physics",
    label: "🚀 Physics",
    title: "Projectile Motion Lab",
    description: "Canvas trajectory animation with angle + speed sliders",
    topics: "projectile, newton, kinematics, trajectory",
    html: PHYSICS_PROJECTILE_HTML,
  },
];

export default function LabsPreview() {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const lab = LABS[active];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Pre-built Lab Preview</h1>
          <p className="text-xs text-white/40 mt-0.5">No Supabase · No auth · Instant load</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-medium">
          dev
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {LABS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setActive(i)}
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                active === i
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5",
              ].join(" ")}
            >
              {l.label}
              {completed.has(l.id) && (
                <span className="ml-1 text-emerald-400 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Lab info */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">{lab.title}</h2>
          <p className="text-sm text-white/50 mt-0.5">{lab.description}</p>
          <p className="text-xs text-white/30 mt-1">
            Triggers on: <span className="text-violet-400">{lab.topics}</span>
          </p>
        </div>

        {/* Lab renderer — prebuilt=true skips loading overlay */}
        <DynamicLabRenderer
          key={lab.id}
          html={lab.html}
          title={lab.title}
          height={540}
          prebuilt
          onComplete={() =>
            setCompleted(prev => new Set([...prev, lab.id]))
          }
        />

        {completed.has(lab.id) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400 font-medium">
            <span>✓</span>
            <span>Lab complete — postMessage received</span>
          </div>
        )}

        {/* Nav hint */}
        <div className="mt-8 text-center text-xs text-white/20">
          Testing {LABS.length} pre-built labs ·{" "}
          {completed.size}/{LABS.length} completed
        </div>
      </div>
    </div>
  );
}
