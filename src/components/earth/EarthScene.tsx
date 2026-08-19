import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { LABS, getLab, type Lab } from "@/lib/ai-labs";
import { latLonToVec3, quatFromOutward, terminatorBasis } from "@/lib/geo";
import { useGlobe } from "@/lib/globe-store";
import { getSubsolarPoint } from "@/lib/sun";
import { earthFrag, earthVert } from "./shaders";

const VIEW_DISTANCE = 4.9;
const FLY_DISTANCE = 3.65;
const MIN_DISTANCE = 2.7;
const MAX_DISTANCE = 7.6;

const SUN = new THREE.Vector3();
const CAM = new THREE.Vector3();
const TMP = new THREE.Vector3();
const Q = new THREE.Quaternion();

type ControlsHandle = {
  enabled: boolean;
  target: THREE.Vector3;
  update: () => void;
};

function sunFromTime(time: number, out: THREE.Vector3) {
  const sub = getSubsolarPoint(new Date(time));
  return latLonToVec3(sub.lat, sub.lon, 1, out);
}

function EarthGlobe({ sunDir }: { sunDir: THREE.Vector3 }) {
  const [dayMap, nightMap, specMap] = useTexture([
    "/textures/earth-day.jpg",
    "/textures/earth-night.jpg",
    "/textures/earth-spec.jpg",
  ]);

  useEffect(() => {
    for (const t of [dayMap, nightMap, specMap]) {
      t.anisotropy = 8;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
    }
    specMap.colorSpace = THREE.NoColorSpace;
    useGlobe.getState().setTexturesReady(true);
  }, [dayMap, nightMap, specMap]);

  const earthMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uDay: { value: dayMap },
        uNight: { value: nightMap },
        uSpec: { value: specMap },
        uSun: { value: new THREE.Vector3(1, 0, 0) },
        uCam: { value: new THREE.Vector3(0, 0, VIEW_DISTANCE) },
      },
      vertexShader: earthVert,
      fragmentShader: earthFrag,
    });
  }, [dayMap, nightMap, specMap]);

  const { camera } = useThree();

  useFrame(() => {
    camera.getWorldPosition(CAM);
    earthMat.uniforms.uSun.value.copy(sunDir);
    earthMat.uniforms.uCam.value.copy(CAM);
  });

  useEffect(() => {
    return () => {
      earthMat.dispose();
    };
  }, [earthMat]);

  return (
    <mesh material={earthMat}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  );
}

function Terminator({ sunDir }: { sunDir: THREE.Vector3 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(160 * 3), 3));
    return g;
  }, []);

  useFrame(() => {
    const { a, b } = terminatorBasis(sunDir);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const n = pos.count;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * Math.PI * 2;
      TMP.copy(a)
        .multiplyScalar(Math.cos(t) * 1.011)
        .addScaledVector(b, Math.sin(t) * 1.011);
      pos.setXYZ(i, TMP.x, TMP.y, TMP.z);
    }
    pos.needsUpdate = true;
  });

  return (
    <lineLoop geometry={geo}>
      <lineBasicMaterial color="#9eb6c4" transparent opacity={0.22} />
    </lineLoop>
  );
}

function SubsolarMarker({ sunDir }: { sunDir: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.copy(sunDir).setLength(1.035);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color="#f2f0ea" />
    </mesh>
  );
}

function Pin({ lab }: { lab: Lab }) {
  const selected = useGlobe((s) => s.selectedId === lab.id);
  const hovered = useGlobe((s) => s.hoveredId === lab.id);
  const region = useGlobe((s) => s.region);
  const hidden = region !== "all" && lab.region !== region;
  const pos = useMemo(() => latLonToVec3(lab.lat, lab.lon, 1.018), [lab.lat, lab.lon]);
  const quat = useMemo(() => quatFromOutward(lab.lat, lab.lon, Q.clone()), [lab.lat, lab.lon]);
  const pulse = useRef(0);
  const core = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!core.current) return;
    pulse.current += delta;
    const s = selected ? 1.35 + Math.sin(pulse.current * 3) * 0.08 : hovered ? 1.2 : 1;
    core.current.scale.setScalar(s);
  });

  if (hidden) return null;

  return (
    <group position={pos} quaternion={quat}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          useGlobe.getState().hover(lab.id);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          useGlobe.getState().hover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          useGlobe.getState().flyTo(lab.id);
        }}
      >
        <sphereGeometry args={[0.062, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0045, 0.0045, 0.05, 8]} />
        <meshBasicMaterial color={selected ? "#f4f1ea" : "#9aadb8"} />
      </mesh>
      <mesh position={[0, 0, 0.058]} ref={core}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={selected ? "#f4f1ea" : "#d5dee4"} />
      </mesh>
      <mesh position={[0, 0, 0.058]}>
        <ringGeometry args={[0.028, 0.036, 24]} />
        <meshBasicMaterial
          color={selected ? "#e8eef2" : "#8aa0ae"}
          side={THREE.DoubleSide}
          transparent
          opacity={selected ? 0.95 : 0.7}
        />
      </mesh>
      {(selected || hovered) && (
        <Html
          position={[0, 0, 0.1]}
          center
          distanceFactor={3.4}
          style={{ pointerEvents: "none" }}
          zIndexRange={[20, 0]}
        >
          <div className="pin-label">{lab.nameZh}</div>
        </Html>
      )}
    </group>
  );
}

function CameraRig({ sunDir }: { sunDir: THREE.Vector3 }) {
  const controls = useRef<ControlsHandle | null>(null);
  const { camera } = useThree();
  const flyNonce = useGlobe((s) => s.flyNonce);
  const flyId = useGlobe((s) => s.flyId);
  const flying = useRef<{ t: number; from: THREE.Vector3; to: THREE.Vector3 } | null>(null);
  const lastNonce = useRef(0);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    const perp = TMP.crossVectors(sunDir, new THREE.Vector3(0, 1, 0));
    if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
    perp.normalize();
    camera.position
      .copy(sunDir)
      .multiplyScalar(0.22)
      .addScaledVector(perp, 0.95)
      .add(new THREE.Vector3(0, 0.22, 0))
      .normalize()
      .multiplyScalar(VIEW_DISTANCE);
    camera.lookAt(0, 0, 0);
  }, [camera, sunDir]);

  useEffect(() => {
    if (flyNonce === lastNonce.current || !flyId) return;
    lastNonce.current = flyNonce;
    const lab = getLab(flyId);
    if (!lab) return;
    flying.current = {
      t: 0,
      from: camera.position.clone(),
      to: latLonToVec3(lab.lat, lab.lon, FLY_DISTANCE),
    };
    if (controls.current) controls.current.enabled = false;
  }, [flyNonce, flyId, camera]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);
    const f = flying.current;
    if (f && controls.current) {
      f.t += d * 1.35;
      const k = 1 - Math.pow(1 - Math.min(f.t, 1), 3);
      camera.position.lerpVectors(f.from, f.to, k);
      controls.current.target.set(0, 0, 0);
      controls.current.update();
      if (f.t >= 1) {
        flying.current = null;
        controls.current.enabled = true;
      }
    }
  });

  return (
    <OrbitControls
      ref={controls as never}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      rotateSpeed={0.55}
      zoomSpeed={0.75}
      minPolarAngle={0.18}
      maxPolarAngle={Math.PI - 0.18}
    />
  );
}

function SunLight({ sunDir }: { sunDir: THREE.Vector3 }) {
  const dir = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (!dir.current) return;
    dir.current.position.copy(sunDir).multiplyScalar(8);
  });
  return (
    <>
      <ambientLight intensity={0.04} />
      <directionalLight ref={dir} intensity={0.35} color="#f2f0ea" />
    </>
  );
}

export function EarthScene() {
  const sunDir = useMemo(() => sunFromTime(Date.now(), new THREE.Vector3()), []);
  const lastTick = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTick.current) / 1000, 0.1);
    lastTick.current = now;
    const state = useGlobe.getState();
    if (state.speed !== 0) {
      state.setSimTime(state.simTime + dt * state.speed * 1000);
    }
    sunFromTime(useGlobe.getState().simTime, SUN);
    sunDir.copy(SUN);
  });

  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <Stars radius={90} depth={50} count={4200} factor={2.6} saturation={0} fade speed={0.2} />
      <CameraRig sunDir={sunDir} />
      <SunLight sunDir={sunDir} />
      <EarthGlobe sunDir={sunDir} />
      <Terminator sunDir={sunDir} />
      <SubsolarMarker sunDir={sunDir} />
      {LABS.map((lab) => (
        <Pin key={lab.id} lab={lab} />
      ))}
    </>
  );
}
