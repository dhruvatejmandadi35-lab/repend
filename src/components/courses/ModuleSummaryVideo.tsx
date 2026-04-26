import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Player } from "@remotion/player";

const FPS = 30;
const S1 = 90;   // 3s  — Title card
const S2 = 300;  // 10s — Concept
const S3 = 240;  // 8s  — Real world
const S4 = 270;  // 9s  — Key takeaways
const S5 = 150;  // 5s  — Lab teaser
export const TOTAL_FRAMES = S1 + S2 + S3 + S4 + S5; // 1050 = 35s

export type VideoProps = {
  title: string;
  content: string;
  real_world_application: string;
  key_takeaways: string[];
  topic: string;
};

/* ─── Shared helpers ─── */

function fadeIn(frame: number, start = 0, end = 20) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function slideUp(frame: number, start = 0, end = 20, distance = 30) {
  return interpolate(frame, [start, end], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function WordByWord({ text, startDelay = 8, wordsPerFrame = 0.2, color = "#e2e8f0", fontSize = 26 }: {
  text: string; startDelay?: number; wordsPerFrame?: number; color?: string; fontSize?: number;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ").filter(Boolean);
  const framesPerWord = Math.max(1, Math.round(1 / wordsPerFrame));

  return (
    <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize, color, lineHeight: 1.6, fontWeight: 400 }}>
      {words.map((word, i) => {
        const delay = startDelay + i * framesPerWord;
        const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame, [delay, delay + 10], [6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={i}
            style={{ opacity, display: "inline-block", transform: `translateY(${y}px)`, marginRight: 7 }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 15);
  const y = slideUp(frame, 0, 15);
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, marginBottom: 28 }}>
      <div style={{ color, fontSize: 11, fontFamily: "system-ui", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
        {text}
      </div>
      <div style={{ height: 3, width: 44, background: color, borderRadius: 2 }} />
    </div>
  );
}

/* ─── Scene 1: Title Card ─── */
function TitleScene({ title, topic }: Pick<VideoProps, "title" | "topic">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { stiffness: 90, damping: 22 }, delay: 5 });
  const badgeOpacity = fadeIn(frame, 0, 18);
  const badgeY = slideUp(frame, 0, 18);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f1117 0%, #161d33 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
      }}
    >
      {/* Topic badge */}
      <div style={{ opacity: badgeOpacity, transform: `translateY(${badgeY}px)`, marginBottom: 28 }}>
        <div style={{
          background: "rgba(59,130,246,0.12)",
          border: "1px solid rgba(59,130,246,0.4)",
          borderRadius: 20,
          padding: "6px 20px",
          color: "#60a5fa",
          fontSize: 13,
          fontFamily: "system-ui",
          fontWeight: 700,
          letterSpacing: 2.5,
          textTransform: "uppercase",
        }}>
          {topic}
        </div>
      </div>

      {/* Title */}
      <div style={{ transform: `scale(${titleScale})`, textAlign: "center", maxWidth: 900 }}>
        <h1 style={{
          color: "#ffffff",
          fontSize: 58,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 900,
          margin: 0,
          lineHeight: 1.08,
          letterSpacing: -1.5,
        }}>
          {title}
        </h1>
      </div>

      {/* Branding */}
      <div style={{
        position: "absolute",
        top: 32,
        right: 44,
        color: "#3b82f6",
        fontSize: 18,
        fontFamily: "system-ui",
        fontWeight: 800,
        opacity: 0.75,
        letterSpacing: -0.5,
      }}>
        repend
      </div>

      {/* Bottom accent */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)",
      }} />

      {/* Decorative glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 400,
        background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
}

/* ─── Scene 2: The Concept ─── */
function ConceptScene({ content }: Pick<VideoProps, "content">) {
  const cleanText = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\n---\n[\s\S]*/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 20)
    .join(" ");

  const excerpt = cleanText.slice(0, 220);

  return (
    <AbsoluteFill style={{ background: "#0f1117", padding: "60px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <SectionLabel text="The Concept" color="#3b82f6" />
      <WordByWord text={excerpt} color="#e2e8f0" fontSize={27} startDelay={10} wordsPerFrame={0.22} />
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 400,
        height: 400,
        background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
      }} />
    </AbsoluteFill>
  );
}

/* ─── Scene 3: Real World Application ─── */
function RealWorldScene({ real_world_application }: Pick<VideoProps, "real_world_application">) {
  const text = real_world_application || "This concept has many practical applications in everyday life and professional settings.";

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #071510 0%, #0f1117 60%)", padding: "60px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <SectionLabel text="In Real Life..." color="#10b981" />
      <WordByWord text={text.slice(0, 260)} color="#d1fae5" fontSize={26} startDelay={12} wordsPerFrame={0.2} />
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "linear-gradient(90deg, #10b981, transparent)",
      }} />
    </AbsoluteFill>
  );
}

/* ─── Scene 4: Key Takeaways ─── */
function KeyTakeawaysScene({ key_takeaways }: Pick<VideoProps, "key_takeaways">) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = key_takeaways?.length
    ? key_takeaways.slice(0, 4)
    : ["Master the core principles", "Apply to real-world contexts", "Build on prior knowledge"];

  return (
    <AbsoluteFill style={{ background: "#0f1117", padding: "60px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <SectionLabel text="Key Takeaways" color="#a78bfa" />

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {items.map((takeaway, i) => {
          const delay = 20 + i * 45;
          const sc = spring({ frame, fps, config: { stiffness: 130, damping: 22 }, delay });
          const op = interpolate(frame, [delay, delay + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: 18, opacity: op, transform: `scale(${sc})` }}
            >
              <div style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a78bfa",
                fontSize: 14,
                fontFamily: "system-ui",
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{
                color: "#e2e8f0",
                fontSize: 22,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.5,
                paddingTop: 4,
              }}>
                {takeaway}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* ─── Scene 5: Lab Teaser ─── */
function LabTeaserScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconScale = spring({ frame, fps, config: { stiffness: 120, damping: 18 } });
  const textOpacity = fadeIn(frame, 10, 30);
  const textY = slideUp(frame, 10, 30);
  const btnScale = spring({ frame, fps, config: { stiffness: 150, damping: 20 }, delay: 35 });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f1117 0%, #161d33 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
    }}>
      <div style={{ transform: `scale(${iconScale})`, fontSize: 56 }}>🧪</div>

      <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, textAlign: "center" }}>
        <h2 style={{
          color: "#ffffff",
          fontSize: 46,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 900,
          margin: 0,
          letterSpacing: -1,
        }}>
          Now let's try it.
        </h2>
        <p style={{ color: "#94a3b8", fontSize: 20, fontFamily: "system-ui", marginTop: 10 }}>
          Start the interactive lab to apply what you learned
        </p>
      </div>

      <div style={{ transform: `scale(${btnScale})` }}>
        <div style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          borderRadius: 14,
          padding: "14px 40px",
          color: "white",
          fontSize: 18,
          fontFamily: "system-ui",
          fontWeight: 700,
          letterSpacing: 0.3,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 0 40px rgba(99,102,241,0.3)",
        }}>
          ▶ Start Lab
        </div>
      </div>

      {/* Branding */}
      <div style={{
        position: "absolute",
        top: 32,
        right: 44,
        color: "#3b82f6",
        fontSize: 18,
        fontFamily: "system-ui",
        fontWeight: 800,
        opacity: 0.75,
      }}>
        repend
      </div>
    </AbsoluteFill>
  );
}

/* ─── Main Composition ─── */
function ModuleSummaryComposition(props: VideoProps) {
  return (
    <>
      <Sequence from={0} durationInFrames={S1}>
        <TitleScene title={props.title} topic={props.topic} />
      </Sequence>
      <Sequence from={S1} durationInFrames={S2}>
        <ConceptScene content={props.content} />
      </Sequence>
      <Sequence from={S1 + S2} durationInFrames={S3}>
        <RealWorldScene real_world_application={props.real_world_application} />
      </Sequence>
      <Sequence from={S1 + S2 + S3} durationInFrames={S4}>
        <KeyTakeawaysScene key_takeaways={props.key_takeaways} />
      </Sequence>
      <Sequence from={S1 + S2 + S3 + S4} durationInFrames={S5}>
        <LabTeaserScene />
      </Sequence>
    </>
  );
}

/* ─── Player wrapper (exported) ─── */
type ModuleSummaryVideoProps = VideoProps & {
  onStartLab?: () => void;
};

export default function ModuleSummaryVideo({ onStartLab, ...props }: ModuleSummaryVideoProps) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl">
      <Player
        component={ModuleSummaryComposition}
        inputProps={props}
        durationInFrames={TOTAL_FRAMES}
        compositionWidth={1280}
        compositionHeight={720}
        fps={FPS}
        style={{ width: "100%", aspectRatio: "16/9", display: "block" }}
        controls
        autoPlay
        loop={false}
      />
      {onStartLab && (
        <div className="absolute bottom-14 right-4 z-10">
          <button
            onClick={onStartLab}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Lab →
          </button>
        </div>
      )}
    </div>
  );
}
