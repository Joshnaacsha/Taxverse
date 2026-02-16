"use client";

import createGlobe from "cobe";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function Globe({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phi = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  const onPointerUp = useCallback(() => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const onPointerOut = useCallback(() => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      return;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (pointerInteracting.current !== null && e.touches[0]) {
      const delta = e.touches[0].clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    let width = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 0,
      height: 0,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16_000,
      mapBrightness: 1.2,
      baseColor: [0.05, 0.1, 0.2],
      markerColor: [0.97, 0.5, 0.1],
      glowColor: [0.2, 0.4, 0.9],
      markers: [
        { location: [28.6139, 77.209], size: 0.07 }, // Delhi
        { location: [19.076, 72.8777], size: 0.06 }, // Mumbai
        { location: [12.9716, 77.5946], size: 0.06 }, // Bengaluru
        { location: [37.7749, -122.4194], size: 0.05 }, // SF
      ],
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phi.current += 0.003;
        } else {
          phi.current += pointerInteractionMovement.current * 0.005;
        }
        state.phi = phi.current;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    const onResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    if (canvasRef.current) canvasRef.current.style.cursor = "grab";

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("h-full w-full max-w-full select-none", className)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerOut}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    />
  );
}

