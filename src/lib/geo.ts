import * as THREE from "three";

const DEG = Math.PI / 180;

/** Equirectangular Earth texture: lon −180 at u=0, lat +90 at v=1. */
export function latLonToVec3(lat: number, lon: number, radius = 1, target = new THREE.Vector3()) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function quatFromOutward(lat: number, lon: number, target = new THREE.Quaternion()) {
  const pos = latLonToVec3(lat, lon, 1);
  const m = new THREE.Matrix4();
  m.lookAt(pos, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
  return target.setFromRotationMatrix(m);
}

export function terminatorBasis(sunDir: THREE.Vector3) {
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  a.crossVectors(sunDir, new THREE.Vector3(0, 1, 0));
  if (a.lengthSq() < 1e-6) a.crossVectors(sunDir, new THREE.Vector3(1, 0, 0));
  a.normalize();
  b.crossVectors(sunDir, a).normalize();
  return { a, b };
}
