import { useEffect, useState, type ComponentType } from "react";

export function EarthMount() {
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./EarthApp").then((mod) => {
      if (!cancelled) setApp(() => mod.EarthApp);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!App) {
    return (
      <div className="grid h-dvh place-items-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-pulse rounded-full border border-border" />
          <p className="font-display text-lg italic text-fg">Helios</p>
          <p className="text-xs tracking-[0.2em] text-subtle">LOADING EARTH</p>
        </div>
      </div>
    );
  }

  return <App />;
}
