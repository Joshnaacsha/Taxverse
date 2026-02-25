"use client";

import { useEffect, useRef } from "react";
import createGlobe, { COBEOptions } from "cobe";
import { useMotionValue, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

const MOVEMENT_DAMPING = 1400;

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [0, 0, 0],
  glowColor: [1, 1, 1],
  markers: [],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
  initialPhi,
  onRenderFrame,
}: {
  className?: string;
  config?: COBEOptions;
  initialPhi?: number;
  onRenderFrame?: (frame: { phi: number; theta: number; size: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const widthRef = useRef(0);
  const phiRef = useRef(initialPhi ?? config.phi ?? 0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  const r = useMotionValue(0);
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  });

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      r.set(r.get() + delta / MOVEMENT_DAMPING);
    }
  };

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        widthRef.current = canvasRef.current.offsetWidth;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      onRender: (state) => {
        const now = performance.now();
        const last = lastFrameTimeRef.current ?? now;
        const dt = Math.min(40, now - last);
        lastFrameTimeRef.current = now;

        if (!pointerInteracting.current) {
          const baseSpeed = 0.00024;
          const drift = Math.sin(now * 0.0006) * 0.00003;
          phiRef.current += (baseSpeed + drift) * dt;
        }

        const currentPhi = phiRef.current + rs.get();
        state.phi = currentPhi;
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
        onRenderFrame?.({
          phi: currentPhi,
          theta: state.theta ?? config.theta ?? 0.3,
          size: widthRef.current,
        });
      },
    });

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    }, 0);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [rs, config, onRenderFrame]);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX;
          updatePointerInteraction(e.clientX);
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  );
}
