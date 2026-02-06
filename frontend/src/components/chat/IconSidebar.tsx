import {
  MessageSquare,
  Calendar,
  Radio,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface IconSidebarProps {
  className?: string;
}

const navItems = [
  { icon: MessageSquare, active: true },
  { icon: Calendar, active: false },
  { icon: Radio, active: false },
  { icon: Settings, active: false },
];

export function IconSidebar({ className }: IconSidebarProps) {
  const { currentUser, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col items-center py-6 bg-card border-r border-border",
        className,
      )}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-8">
        <ChevronDown className="w-5 h-5 text-primary-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="w-9 h-9">
          <AvatarImage src={currentUser?.avatar_url} />
          <AvatarFallback className="bg-avatar-warm text-primary-foreground">
            {currentUser?.username?.[0]?.toUpperCase() || "JD"}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
