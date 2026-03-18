"use client";

import type { AppView } from "@/lib/customiser/types";
import type { ReactNode } from "react";

interface StageLayoutProps {
  view: AppView;
  startScreen: ReactNode;
  workspace: ReactNode;
}

export default function StageLayout({ view, startScreen, workspace }: StageLayoutProps) {
  if (view === "start") {
    return (
      <div className="relative flex h-dvh w-full items-center justify-center">
        {startScreen}
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {workspace}
    </div>
  );
}
