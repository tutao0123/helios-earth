import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock,
  Globe2,
  LocateFixed,
  MapPin,
  Menu,
  Pause,
  Play,
  X,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  KIND_LABEL,
  REGION_LABEL,
  REGIONS,
  getLab,
  labsInRegion,
  type Lab,
} from "@/lib/ai-labs";
import { SPEEDS, useGlobe } from "@/lib/globe-store";
import { formatCoord, getSubsolarPoint } from "@/lib/sun";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-8 animate-pulse rounded-full bg-surface-2" />;
  }
  return user ? (
    <SignedIn>
      <div className="rounded-full border border-border bg-surface/80 px-2 py-1 text-fg backdrop-blur-sm">
        <UserButton />
      </div>
    </SignedIn>
  ) : (
    <SignedOut>
      <Link
        to="/login"
        className="inline-flex h-10 items-center rounded-sm border border-border bg-surface/80 px-3 text-sm text-muted backdrop-blur-sm hover:bg-surface-2 hover:text-fg"
      >
        登录
      </Link>
    </SignedOut>
  );
}

function formatClock(ms: number, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(ms));
}

export function Hud() {
  const speed = useGlobe((s) => s.speed);
  const selectedId = useGlobe((s) => s.selectedId);
  const region = useGlobe((s) => s.region);
  const panelOpen = useGlobe((s) => s.panelOpen);
  const texturesReady = useGlobe((s) => s.texturesReady);
  const [display, setDisplay] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setDisplay(useGlobe.getState().simTime);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const sub = useMemo(() => getSubsolarPoint(new Date(display)), [display]);
  const selected = getLab(selectedId);
  const labs = labsInRegion(region);
  const offsetHours = (display - Date.now()) / 3_600_000;

  return (
    <>
      {!texturesReady && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-bg">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 animate-pulse rounded-full border border-border" />
            <p className="font-display text-lg italic text-fg">Helios</p>
            <p className="text-xs tracking-[0.2em] text-subtle">LOADING EARTH</p>
          </div>
        </div>
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
        <div className="pointer-events-auto max-w-[16rem]">
          <p className="font-display text-2xl italic leading-none tracking-tight text-fg sm:text-3xl">
            Helios
          </p>
          <p className="mt-1 text-xs text-muted">实时日照 · 全球 AI 版图</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-sm border border-border bg-surface/80 text-fg backdrop-blur-sm md:hidden"
            onClick={() => useGlobe.getState().setPanelOpen(!panelOpen)}
            aria-label="打开实验室列表"
          >
            {panelOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <AuthSlot />
        </div>
      </header>

      <aside
        className={cn(
          "absolute top-20 bottom-32 left-3 z-20 w-[min(100%-1.5rem,20.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface/85 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.8)] backdrop-blur-md sm:left-5 md:flex",
          panelOpen ? "flex" : "hidden",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-subtle">LABS</p>
            <p className="text-sm text-fg">{labs.length} 个观测点</p>
            <p className="text-xs text-subtle">截至 2026 年 8 月</p>
          </div>
          <Globe2 className="size-4 text-muted" />
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => useGlobe.getState().setRegion(r)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs",
                region === r ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {REGION_LABEL[r]}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {labs.map((lab) => (
            <LabRow key={lab.id} lab={lab} active={lab.id === selectedId} />
          ))}
        </ul>
      </aside>

      {selected && (
        <article className="absolute right-3 bottom-32 top-auto z-20 max-h-[min(48vh,26rem)] w-[min(100%-1.5rem,22rem)] overflow-y-auto rounded-xl border border-border bg-surface/90 p-4 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.8)] backdrop-blur-md sm:right-5 md:top-20 md:bottom-32 md:max-h-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.16em] text-subtle">{selected.cityZh}</p>
              <h2 className="font-display text-2xl italic leading-tight text-fg">
                {selected.nameZh}
              </h2>
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-fg"
              onClick={() => useGlobe.getState().select(null)}
              aria-label="关闭"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="accent">{KIND_LABEL[selected.kind]}</Badge>
            <Badge>{selected.countryZh}</Badge>
            {selected.intel != null && <Badge variant="solid">智力 {selected.intel}</Badge>}
          </div>
          <p className="mt-4 font-mono text-sm text-fg">{selected.flagship}</p>
          {(selected.context || selected.released) && (
            <p className="mt-1 font-mono text-xs text-muted">
              {selected.context ? `${selected.context} 上下文` : null}
              {selected.context && selected.released ? " · " : null}
              {selected.released}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-muted">{selected.summary}</p>
          <ul className="mt-3 space-y-1.5">
            {selected.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-sm text-fg">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-subtle">
            <MapPin className="size-3" />
            {formatCoord(selected.lat, selected.lon)}
          </p>
        </article>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
        <div className="rounded-xl border border-border bg-surface/85 px-3 py-3 backdrop-blur-md sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock className="size-3.5" />
              <span className="font-mono tabular-nums text-fg">{formatClock(display, "UTC")}</span>
              <span className="text-subtle">UTC</span>
              <span className="hidden font-mono tabular-nums sm:inline">
                {formatClock(display, Intl.DateTimeFormat().resolvedOptions().timeZone)} 本地
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <LocateFixed className="size-3.5" />
              <span>日下点 {formatCoord(sub.lat, sub.lon)}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="range"
              min={-12}
              max={12}
              step={0.05}
              value={Math.max(-12, Math.min(12, offsetHours))}
              onChange={(e) => {
                const hours = Number(e.target.value);
                useGlobe.getState().setSpeed(0);
                useGlobe.getState().setSimTime(Date.now() + hours * 3_600_000);
              }}
              className="h-8 w-full sm:flex-1"
              aria-label="时间偏移"
            />
            <div className="flex flex-wrap items-center gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => useGlobe.getState().setSpeed(s.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs",
                    speed === s.id ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {s.id === 0 ? <Pause className="size-3" /> : null}
                  {s.id === 1 ? <Play className="size-3" /> : null}
                  {s.label}
                </button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => useGlobe.getState().jumpToNow()}>
                此刻
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LabRow({ lab, active }: { lab: Lab; active: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => useGlobe.getState().flyTo(lab.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-2",
          active && "bg-surface-2",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border font-mono text-xs text-muted">
          {lab.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-fg">{lab.nameZh}</span>
          <span className="block truncate font-mono text-xs text-subtle">{lab.flagship}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-subtle" />
      </button>
    </li>
  );
}
