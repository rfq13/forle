import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MobileHeaderProps {
  showChatList: boolean;
  onToggle: () => void;
  className?: string;
}

export function MobileHeader({
  showChatList,
  onToggle,
  className,
}: MobileHeaderProps) {
  const { currentUser, logout } = useAuth();

  return (
    <header
      className={cn(
        "h-14 px-4 flex items-center justify-between bg-card border-b border-border md:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={currentUser?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {currentUser?.username?.[0]?.toUpperCase() || "LC"}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground">Live Chat</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors"
        >
          {showChatList ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>
    </header>
  );
}
