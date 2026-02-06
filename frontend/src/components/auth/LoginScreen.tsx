import { useState, useEffect } from "react";
import { User, useAuth } from "@/context/AuthContext";
import { fetchUsers, createUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus, Users } from "lucide-react";

export function LoginScreen() {
  const { login } = useAuth();
  const [view, setView] = useState<"selection" | "existing" | "create">(
    "selection",
  );
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (view === "existing") {
      loadUsers();
    }
  }, [view]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      // Generate random avatar for new user
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
      const newUser = await createUser(username, avatarUrl);
      login(newUser);
    } catch (error) {
      console.error("Failed to create user", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "selection") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Welcome to Forle Chat
            </CardTitle>
            <CardDescription>Choose how you want to connect</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 text-lg"
              onClick={() => setView("existing")}
            >
              <Users className="w-8 h-8" />
              Use Existing Contact
            </Button>
            <Button
              className="h-24 flex flex-col items-center justify-center gap-2 text-lg"
              onClick={() => setView("create")}
            >
              <UserPlus className="w-8 h-8" />
              Create New Contact
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "existing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md h-[80vh] flex flex-col">
          <CardHeader>
            <CardTitle>Select Contact</CardTitle>
            <CardDescription>
              Choose an existing profile to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">
                No contacts found.
              </p>
            ) : (
              users.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => login(user)}
                >
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{user.username}</div>
                  </div>
                </Button>
              ))
            )}
          </CardContent>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setView("selection")}
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Contact</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Chatting
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setView("selection")}
            >
              Back
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
