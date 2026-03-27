export const CAMERA_CONFIG = {
  fov: 35,
  // z matches midOrbitDistance = (min + max) / 2 = (2.0 + 4.5) / 2 = 3.25
  // so u = 0.5 on first load — no snap when product is selected
  position: [0, 0, 3.25] as [number, number, number],
  near: 0.001,
  far: 50,
};

/** Keep in sync with OrbitControls min/max — used for zoom → scale/position mapping */
export const ORBIT_DISTANCE = {
  min: 2.0,
  max: 4.5,
} as const;

export const ORBIT_CONSTRAINTS = {
  enableZoom:    true,
  enablePan:     false,
  enableDamping: true,
  dampingFactor: 0.04,        // low = heavy, momentum-driven feel
  rotateSpeed:   0.5,         // slightly slower than default — feels premium
  zoomSpeed:     0.4,         // controlled, deliberate zoom
  minDistance:   ORBIT_DISTANCE.min,
  maxDistance:   3.25,
  minPolarAngle: Math.PI / 3,
  maxPolarAngle: (Math.PI * 2) / 3,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle:  Math.PI / 2,
};
