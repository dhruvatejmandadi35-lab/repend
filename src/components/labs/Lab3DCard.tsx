import { useRef, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export default function Lab3DCard({ children, className, intensity = 10 }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const card = cardRef.current;
        const glow = glowRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        const rotX = (-dy * intensity).toFixed(2);
        const rotY = (dx * intensity).toFixed(2);
        card.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;

        if (glow) {
          const px = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
          const py = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
          glow.style.background = `radial-gradient(360px circle at ${px}% ${py}%, rgba(139,92,246,0.11) 0%, rgba(99,102,241,0.07) 35%, transparent 70%)`;
        }
      });
    },
    [intensity],
  );

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (cardRef.current)
      cardRef.current.style.transform =
        "perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    if (glowRef.current) glowRef.current.style.background = "transparent";
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative will-change-transform", className)}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.20s cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* cursor-tracking spotlight */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-2xl pointer-events-none z-[1] transition-[background] duration-200"
        aria-hidden
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}
