import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  html: string;
  onComplete?: (score?: number) => void;
  height?: number;
  title?: string;
  /** Skip loading overlay — for instantly-available pre-built HTML labs */
  prebuilt?: boolean;
};

const LOADING_MESSAGES = [
  "Claude is inventing an activity for this topic...",
  "Building your interactive experience...",
  "Adding the finishing touches...",
  "Almost ready...",
];

const MAX_HTML_BYTES = 50 * 1024;

function sanitize(html: string): string {
  // Strip external script/stylesheet imports — allow inline JS only
  return html
    .replace(/<script\s[^>]*\bsrc\s*=\s*["'][^"']*["'][^>]*>/gi, "<!-- removed external script -->")
    .replace(/<link\s[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi, "<!-- removed external stylesheet -->");
}

function validate(html: string): string | null {
  if (!html || html.trim().length === 0) return "Empty HTML content";
  if (new TextEncoder().encode(html).length > MAX_HTML_BYTES) {
    return `HTML too large (${Math.round(html.length / 1024)}KB > 50KB limit)`;
  }
  return null;
}

/* ─── Animated loading state ─── */
function LoadingOverlay() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#0f172a]">
      {/* Animated ring */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-violet-500/0 border-b-violet-500/0 border-l-violet-500/0 animate-spin" />
        <div className="absolute inset-2 rounded-full border border-indigo-400/30 animate-pulse" />
      </div>

      {/* Cycling message */}
      <p
        className="text-sm text-violet-300 max-w-[260px] text-center leading-snug transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {LOADING_MESSAGES[idx]}
      </p>

      {/* Dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-500/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── DynamicLabRenderer ─── */
export default function DynamicLabRenderer({ html, onComplete, height = 560, title, prebuilt = false }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(prebuilt);
  const completedRef = useRef(false);

  const validationError = validate(html);
  const safeHtml = validationError ? null : sanitize(html);

  /* postMessage completion from the generated lab */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "LAB_COMPLETE" && !completedRef.current) {
        completedRef.current = true;
        onComplete?.(typeof e.data.score === "number" ? e.data.score : undefined);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onComplete]);

  if (validationError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 py-14 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{validationError}</p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-violet-500/20 bg-[#0f172a]"
      style={{ height }}
    >
      {!loaded && <LoadingOverlay />}

      <iframe
        ref={iframeRef}
        srcDoc={safeHtml!}
        sandbox="allow-scripts"
        title={title ?? "Interactive Lab"}
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#0f172a",
          display: "block",
        }}
      />
    </div>
  );
}
