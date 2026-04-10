import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Briefcase,
  FilePlus2,
  BrainCircuit,
  Wifi,
  WifiOff,
  Clock,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface OllamaStatus {
  online: boolean;
  model: string;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  useEffect(() => {
    const check = () => {
      fetch(`${API_BASE}/api/ai/status`)
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus({ online: false, model: "gemma4:e4b" }));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);
  return status;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/deals", label: "All Deals", icon: Briefcase },
  { href: "/deals/new", label: "New Deal", icon: FilePlus2 },
  { href: "/ai-brain", label: "Presales Brain", icon: BrainCircuit },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const ollamaStatus = useOllamaStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNav = navItems.find(
    (item) =>
      location === item.href ||
      (item.href !== "/" && location.startsWith(item.href))
  );

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f5f5f7]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="flex items-center h-16 px-4 md:px-6 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base leading-tight tracking-tight text-foreground">
                CPS Navigator
              </div>
              <div className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Cloud Deal Shaping Platform
              </div>
            </div>
          </div>

          {/* Nav Items — desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-6 flex-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive && (
                      <span className="h-0.5 w-full bg-primary absolute bottom-0 left-0 rounded-t" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Ollama status */}
            {ollamaStatus && (
              <div
                className={cn(
                  "hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border",
                  ollamaStatus.online
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                )}
              >
                {ollamaStatus.online ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                <span>{ollamaStatus.online ? "Ollama Online" : "Ollama Offline"}</span>
              </div>
            )}

            {/* User role badge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground">Presales Consultant</span>
              <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                Local Mode
              </span>
            </div>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer",
                      isActive
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
