"use client";

const KEY_INTENSITY  = 10.0;
const RIM_INTENSITY  = 0.0;
const FILL_INTENSITY = 5.0;

export default function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />

      {/* Key — top-right, warm highlight on silver */}
      <directionalLight
        position={[2, 3, 1.5]}
        intensity={KEY_INTENSITY}
        color="#fff8f0"
      />

      {/* Rim/kicker — behind-left, edge highlight on metal */}
      <directionalLight
        position={[-2, 1, -2]}
        intensity={RIM_INTENSITY}
        color="#e8eaf0"
      />

      {/* Fill — soft from below to lift shadows */}
      <directionalLight
        position={[0, -1, 1]}
        intensity={FILL_INTENSITY}
        color="#f0f0ff"
      />
    </>
  );
}
