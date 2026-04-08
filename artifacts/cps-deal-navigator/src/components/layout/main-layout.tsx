import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  Plus, 
  Settings,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/deals", label: "All Deals", icon: Briefcase },
    { href: "/deals/new", label: "New Deal", icon: Plus },
  ];

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex-shrink-0 hidden md:flex flex-col">
        <div className="h-14 border-b flex items-center px-4 font-semibold text-primary">
          <FileSpreadsheet className="w-5 h-5 mr-2" />
          CPS Deal Navigator
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                              (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b bg-card flex items-center px-4 md:hidden">
          <span className="font-semibold">CPS Deal Navigator</span>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
