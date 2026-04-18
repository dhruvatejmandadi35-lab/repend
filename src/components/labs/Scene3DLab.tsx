import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RotateCcw, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Obj3D = {
  id: string;
  shape: "sphere" | "box" | "cylinder" | "torus" | "cone" | "ring";
  position: [number, number, number];
  color: string;
  scale?: number;
  label: string;
  info: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  correct_object_id: string;
  explanation: string;
};

type Props = {
  data: {
    title: string;
    description?: string;
    instructions?: string;
    objects: Obj3D[];
    connections?: { from: string; to: string; color?: string }[];
    quiz: QuizQuestion[];
    key_insight?: string;
  };
  onComplete?: () => void;
  isCompleted?: boolean;
  onReplay?: () => void;
};

type ObjState = "idle" | "selected" | "correct" | "wrong";

function getGeometry(shape: string) {
  switch (shape) {
    case "box":      return <boxGeometry args={[1, 1, 1]} />;
    case "cylinder": return <cylinderGeometry args={[0.5, 0.5, 1.2, 20]} />;
    case "torus":    return <torusGeometry args={[0.55, 0.22, 16, 32]} />;
    case "cone":     return <coneGeometry args={[0.6, 1.2, 20]} />;
    case "ring":     return <torusGeometry args={[0.8, 0.08, 8, 32]} />;
    default:         return <sphereGeometry args={[0.6, 20, 20]} />;
  }
}

function SceneObject({ obj, state, onClick, showLabels }: {
  obj: Obj3D;
  state: ObjState;
  onClick: () => void;
  showLabels: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.007;
    if (state === "selected") {
      const s = (obj.scale || 1) * (1 + Math.sin(clock.elapsedTime * 5) * 0.05);
      meshRef.current.scale.setScalar(s);
    } else {
      meshRef.current.scale.setScalar(obj.scale || 1);
    }
  });

  const color = state === "correct" ? "#22c55e" : state === "wrong" ? "#ef4444" : obj.color;
  const emissive = state === "correct" ? "#15803d" : state === "wrong" ? "#b91c1c" : obj.color;
  const emissiveIntensity = state === "idle" ? 0.25 : 0.65;

  return (
    <mesh ref={meshRef} position={obj.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {getGeometry(obj.shape)}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.25}
        metalness={0.5}
        transparent
        opacity={0.92}
      />
      {showLabels && (
        <Html distanceFactor={7} center style={{ pointerEvents: "none", userSelect: "none" }}>
          <div style={{
            background: "rgba(0,0,0,0.75)",
            color: "white",
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
          }}>
            {obj.label}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Scene({ objects, connections, objectStates, onObjectClick, showLabels }: {
  objects: Obj3D[];
  connections?: { from: string; to: string; color?: string }[];
  objectStates: Record<string, ObjState>;
  onObjectClick: (id: string) => void;
  showLabels: boolean;
}) {
  const objMap = useMemo(() => Object.fromEntries(objects.map(o => [o.id, o])), [objects]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[6, 6, 6]} intensity={2.5} color="#a78bfa" />
      <pointLight position={[-6, -4, 4]} intensity={2} color="#06b6d4" />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={18} autoRotate autoRotateSpeed={0.6} />
      {connections?.map((c, i) => {
        const a = objMap[c.from];
        const b = objMap[c.to];
        if (!a || !b) return null;
        return (
          <Line key={i} points={[a.position, b.position]} color={c.color || "#6366f1"} lineWidth={1.5} transparent opacity={0.35} />
        );
      })}
      {objects.map(obj => (
        <SceneObject
          key={obj.id}
          obj={obj}
          state={objectStates[obj.id] || "idle"}
          onClick={() => onObjectClick(obj.id)}
          showLabels={showLabels}
        />
      ))}
    </>
  );
}

export default function Scene3DLab({ data, onComplete, isCompleted, onReplay }: Props) {
  const [objectStates, setObjectStates] = useState<Record<string, ObjState>>({});
  const [selectedObj, setSelectedObj] = useState<Obj3D | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [mode, setMode] = useState<"explore" | "quiz">("explore");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, boolean>>({});
  const [pendingResult, setPendingResult] = useState<"correct" | "wrong" | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [done, setDone] = useState(false);
  const [completionFired, setCompletionFired] = useState(false);

  const quiz = data.quiz || [];
  const currentQ = quiz[quizIndex];
  const answered = currentQ ? quizAnswers[currentQ.id] !== undefined : false;

  const handleObjectClick = (id: string) => {
    if (mode === "explore") {
      const obj = data.objects.find(o => o.id === id);
      if (!obj) return;
      setSelectedObj(obj);
      setObjectStates(prev => {
        const next: Record<string, ObjState> = {};
        data.objects.forEach(o => { next[o.id] = "idle"; });
        next[id] = "selected";
        return next;
      });
      return;
    }

    if (!currentQ || answered || pendingResult) return;
    const correct = id === currentQ.correct_object_id;
    setObjectStates(prev => ({ ...prev, [id]: correct ? "correct" : "wrong" }));
    setPendingResult(correct ? "correct" : "wrong");

    setTimeout(() => {
      setQuizAnswers(prev => ({ ...prev, [currentQ.id]: correct }));
      if (!correct) setObjectStates(prev => ({ ...prev, [id]: "idle" }));
      setPendingResult(null);
    }, 1100);
  };

  const goNext = () => {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex(i => i + 1);
    } else {
      setDone(true);
      if (!completionFired) { onComplete?.(); setCompletionFired(true); }
    }
  };

  const reset = () => {
    setObjectStates({});
    setSelectedObj(null);
    setQuizIndex(0);
    setMode("explore");
    setQuizAnswers({});
    setPendingResult(null);
    setDone(false);
    setCompletionFired(false);
    onReplay?.();
  };

  const score = Object.values(quizAnswers).filter(Boolean).length;

  if (isCompleted && !done) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-950 p-8 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <p className="font-bold text-white text-lg">3D Lab Complete</p>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 border-white/20 text-white hover:bg-white/10">
          <RotateCcw className="w-3.5 h-3.5" /> Replay
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-white text-base leading-tight truncate">{data.title}</h3>
          {data.description && <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{data.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLabels(s => !s)}
            className="text-[11px] text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded border border-white/10"
          >
            {showLabels ? "Hide Labels" : "Labels"}
          </button>
          <Badge variant="outline" className={cn(
            "text-[10px] border",
            mode === "explore" ? "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" : "text-violet-400 border-violet-500/40 bg-violet-500/10"
          )}>
            {mode === "explore" ? "🔍 Explore" : "🎯 Quiz"}
          </Badge>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ height: 320, position: "relative", cursor: "grab" }}>
        <Canvas camera={{ position: [0, 2, 10], fov: 50 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <Scene
              objects={data.objects}
              connections={data.connections}
              objectStates={objectStates}
              onObjectClick={handleObjectClick}
              showLabels={showLabels}
            />
          </Suspense>
        </Canvas>
        <p style={{ position: "absolute", bottom: 8, right: 10 }} className="text-[10px] text-white/25 pointer-events-none">
          Drag to rotate · Scroll to zoom
        </p>
      </div>

      {/* Bottom panel */}
      <div className="px-5 py-4 border-t border-white/10 space-y-3 min-h-[120px]">
        {done ? (
          <div className="text-center space-y-3">
            <p className="text-2xl">🏆</p>
            <p className="font-bold text-white">Complete! {score}/{quiz.length} correct</p>
            {data.key_insight && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
                <span className="text-amber-400 text-sm mt-0.5">💡</span>
                <p className="text-xs text-amber-200 leading-relaxed">{data.key_insight}</p>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 border-white/20 text-white hover:bg-white/10">
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </Button>
          </div>
        ) : mode === "explore" ? (
          <>
            {selectedObj ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedObj.color }} />
                  <span className="font-bold text-white text-sm">{selectedObj.label}</span>
                </div>
                <p className="text-xs text-white/65 leading-relaxed">{selectedObj.info}</p>
              </div>
            ) : (
              <p className="text-xs text-white/35 italic">
                {data.instructions || "Click any object to learn about it. Drag to rotate."}
              </p>
            )}
            <Button
              onClick={() => { setMode("quiz"); setSelectedObj(null); setObjectStates({}); }}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold gap-2"
              size="sm"
            >
              <Target className="w-3.5 h-3.5" /> Start Quiz
            </Button>
          </>
        ) : currentQ ? (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-violet-400 font-bold text-sm shrink-0">Q{quizIndex + 1}.</span>
              <p className="text-sm font-semibold text-white leading-snug">{currentQ.question}</p>
            </div>

            {!answered && !pendingResult && (
              <p className="text-[11px] text-white/35">Click the correct object in the scene above</p>
            )}

            {pendingResult && (
              <div className={cn("text-xs font-semibold px-3 py-2 rounded-lg",
                pendingResult === "correct"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              )}>
                {pendingResult === "correct" ? "✓ Correct!" : "✗ Wrong — try again"}
              </div>
            )}

            {answered && (
              <>
                <div className={cn("flex items-start gap-2 p-3 rounded-xl text-xs border",
                  quizAnswers[currentQ.id]
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                    : "bg-red-500/10 border-red-500/25 text-red-300"
                )}>
                  <span className="shrink-0">{quizAnswers[currentQ.id] ? "✓" : "✗"}</span>
                  <p className="leading-relaxed">{currentQ.explanation}</p>
                </div>
                <Button size="sm" onClick={goNext} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold gap-1.5">
                  {quizIndex < quiz.length - 1
                    ? <><ChevronRight className="w-3.5 h-3.5" /> Next Question</>
                    : <><CheckCircle2 className="w-3.5 h-3.5" /> Finish</>}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
