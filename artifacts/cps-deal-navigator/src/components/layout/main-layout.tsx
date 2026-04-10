import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  FilePlus2,
  BrainCircuit,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface OllamaStatus {
  online: boolean;
  model: string;
  modelAvailable: boolean;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);

  useEffect(() => {
    const check = () => {
      fetch(`${API_BASE}/api/ai/status`)
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus({ online: false, model: "gemma4:e4b", modelAvailable: false }));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const ollamaStatus = useOllamaStatus();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/deals", label: "All Deals", icon: Briefcase },
    { href: "/deals/new", label: "New Deal", icon: FilePlus2 },
    { href: "/ai-brain", label: "Presales Brain", icon: BrainCircuit },
  ];

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="w-64 border-r bg-card flex-shrink-0 hidden md:flex flex-col">
        <div className="h-14 border-b flex items-center px-5 gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm tracking-tight">CPS Deal Navigator</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t space-y-1">
          {ollamaStatus ? (
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-md text-xs",
                ollamaStatus.online
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-muted text-muted-foreground border"
              )}
            >
              {ollamaStatus.online ? (
                <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {ollamaStatus.online ? "Ollama Connected" : "Ollama Offline"}
                </div>
                <div className="truncate opacity-70">{ollamaStatus.model}</div>
              </div>
            </div>
          ) : (
            <div className="h-[52px] rounded-md bg-muted animate-pulse" />
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b bg-card flex items-center px-4 md:hidden">
          <span className="font-semibold text-sm">CPS Deal Navigator</span>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
