export const CAMERA_CONFIG = {
  fov: 35,
  position: [0, 0.5, 4] as [number, number, number],
  near: 0.1,
  far: 20,
};

export const ORBIT_CONSTRAINTS = {
  minPolarAngle: Math.PI / 3,
  maxPolarAngle: (Math.PI * 5) / 9,
  minAzimuthAngle: -Math.PI / 4,
  maxAzimuthAngle: Math.PI / 4,
  enableZoom: false,
  enablePan: false,
  dampingFactor: 0.08,
  enableDamping: true,
};
