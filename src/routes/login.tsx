import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6">
      <div className="w-full max-w-sm rounded-[var(--radius-xl)] border border-border bg-surface p-6">
        <p className="font-display text-3xl italic text-fg">Helios</p>
        <p className="mt-2 text-sm text-muted">登录后可在任何设备上继续观测。</p>
        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                使用 {p.label} 继续
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">登录已关闭。</p>
          )}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-muted hover:text-fg">
          返回地球
        </Link>
      </div>
    </main>
  );
}
