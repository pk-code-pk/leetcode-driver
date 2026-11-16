"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_COLORS = ["#1f4b99", "#1f4b99", "#9cc2ff"];

type ParticlesProps = {
  className?: string;
  /** Squares per 10,000 square pixels. */
  density?: number;
  /** Colours to draw with; later entries are used less often. */
  colors?: string[];
  /** Draw thin lines between a few nearby squares. */
  links?: boolean;
};

/**
 * A slow field of small drifting squares, JobsU's background motif.
 * Pauses when scrolled out of view and stays still for people who prefer reduced motion.
 */
export function Particles({ className, density = 0.9, colors = DEFAULT_COLORS, links = true }: ParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let squares: { x: number; y: number; s: number; vx: number; vy: number; c: string; a: number; p: number }[] = [];
    let pointer = { x: 0, y: 0 };
    let frame = 0;
    let visible = true;

    const seed = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(((w * h) / 10000) * density);
      squares = Array.from({ length: count }, () => {
        const big = Math.random() < 0.22;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          s: big ? 6 + Math.random() * 5 : 2.5 + Math.random() * 2.5,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          c: colors[Math.floor(Math.random() * colors.length)],
          a: 0.55 + Math.random() * 0.45,
          p: Math.random() * Math.PI * 2,
        };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // Lines between the larger squares that happen to be close together.
      if (links) {
        const big = squares.filter((q) => q.s > 6);
        ctx.lineWidth = 1;
        for (let i = 0; i < big.length; i++) {
          for (let j = i + 1; j < big.length; j++) {
            const d = Math.hypot(big[i].x - big[j].x, big[i].y - big[j].y);
            if (d < 130) {
              ctx.globalAlpha = (1 - d / 130) * 0.6;
              ctx.strokeStyle = big[i].c;
              ctx.beginPath();
              ctx.moveTo(big[i].x, big[i].y);
              ctx.lineTo(big[j].x, big[j].y);
              ctx.stroke();
            }
          }
        }
      }
      for (const q of squares) {
        if (!still) {
          q.x += q.vx;
          q.y += q.vy;
          if (q.x < -10) q.x = w + 10;
          if (q.x > w + 10) q.x = -10;
          if (q.y < -10) q.y = h + 10;
          if (q.y > h + 10) q.y = -10;
        }
        // Squares ease a little away from the pointer and gently pulse.
        const dx = q.x - pointer.x;
        const dy = q.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        const push = pointer.x && dist < 140 ? (1 - dist / 140) * 14 : 0;
        const px = q.x + (dist ? (dx / dist) * push : 0);
        const py = q.y + (dist ? (dy / dist) * push : 0);
        ctx.globalAlpha = q.a * (still ? 1 : 0.75 + 0.25 * Math.sin(t / 1400 + q.p));
        ctx.fillStyle = q.c;
        ctx.fillRect(px - q.s / 2, py - q.s / 2, q.s, q.s);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (visible) draw(t);
      frame = requestAnimationFrame(loop);
    };

    seed();
    if (still) draw(0);
    else frame = requestAnimationFrame(loop);

    const onResize = () => {
      seed();
      if (still) draw(0);
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [density, colors, links]);

  return <canvas ref={ref} className={className} aria-hidden />;
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    // Anything already scrolled past (for example after a jump link) shows straight away.
    if (el.getBoundingClientRect().top < window.innerHeight) setSeen(true);
    return () => observer.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={`reveal ${seen ? "seen" : ""} ${className}`} style={{ "--delay": `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  );
}

/** Counts up to a number when it first appears. */
export function CountUp({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="num">
      {prefix}
      {shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Faint drifting squares behind a whole page, with a clear area in the middle for the content. */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Particles className="h-full w-full" density={1.1} />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(44rem 60rem at 50% 40%, #fff 0%, rgba(255,255,255,.92) 55%, rgba(255,255,255,.35) 100%)" }}
      />
    </div>
  );
}
