/**
 * Starting camera distance — midpoint of min/max so products load at scaleBase.
 * u = (2.625 - 2.0) / (3.25 - 2.0) = 0.5 → evalCurve returns scaleBase / yBase.
 */
export const DEFAULT_ORBIT_DISTANCE = 2.625;

export const CAMERA_CONFIG = {
  fov: 35,
  position: [0, 0, DEFAULT_ORBIT_DISTANCE] as [number, number, number],
  near: 0.001,
  far: 50,
};

/** Keep in sync with OrbitControls min/max — used for zoom → scale/position mapping */
export const ORBIT_DISTANCE = {
  min: 2.0,
  max: 3.25,  // matches maxDistance below; u=0 → scaleClose, u=0.5 → scaleBase, u=1 → scaleFar
} as const;

export const ORBIT_CONSTRAINTS = {
  enableZoom:    true,
  enablePan:     false,
  enableDamping: true,
  dampingFactor: 0.05,        // low = heavy, momentum-driven feel
  rotateSpeed:   0.5,         // slightly slower than default — feels premium
  zoomSpeed:     0.4,         // controlled, deliberate zoom
  minDistance:   ORBIT_DISTANCE.min,
  maxDistance:   ORBIT_DISTANCE.max,
  minPolarAngle: Math.PI / 3,
  maxPolarAngle: (Math.PI * 2) / 3,
  minAzimuthAngle: -Math.PI / 2,
  maxAzimuthAngle:  Math.PI / 2,
};
