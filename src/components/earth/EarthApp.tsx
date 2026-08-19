import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useGlobe } from "@/lib/globe-store";
import { EarthScene } from "./EarthScene";
import { Hud } from "./Hud";

export function EarthApp() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useGlobe.getState().select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <Canvas
        camera={{ fov: 42, near: 0.1, far: 200, position: [0, 0.35, 2.6] }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onPointerMissed={() => useGlobe.getState().select(null)}
        onCreated={({ gl }) => {
          gl.setClearColor("#05060a");
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
        style={{ touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <EarthScene />
        </Suspense>
      </Canvas>
      <Hud />
    </div>
  );
}
