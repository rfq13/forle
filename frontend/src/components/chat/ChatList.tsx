import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchUsers, createConversation, fetchConversations } from "@/lib/api";
import { useAuth, User } from "@/context/AuthContext";
import cable from "@/lib/cable";

interface ChatListProps {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
  className?: string;
  refreshKey?: number;
}

interface Conversation {
  id: string;
  sender_id: number;
  recipient_id: number;
  sender: User;
  recipient: User;
  last_message?: {
    id: number;
    content: string;
    created_at: string;
    user_id: number | null;
  } | null;
}

export function ChatList({
  selectedChat,
  onSelectChat,
  className,
  refreshKey,
}: ChatListProps) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Contacts");
  const subscriptionRef = useRef<ReturnType<
    typeof cable.subscriptions.create
  > | null>(null);
  const unreadConversationIdsRef = useRef<Set<string>>(new Set());
  const [unreadVersion, setUnreadVersion] = useState(0);

  const loadData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setIsLoading(true);
      try {
        if (currentUser) {
          const [usersData, conversationsData] = await Promise.all([
            fetchUsers(),
            fetchConversations(currentUser.id),
          ]);

          // Filter out current user from contacts list
          setUsers(
            usersData.filter(
              (u: User) => String(u.id) !== String(currentUser.id),
            ),
          );
          setConversations(conversationsData);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  useEffect(() => {
    if (currentUser) {
      loadData({ silent: true });
    }
  }, [refreshKey, currentUser, loadData]);

  useEffect(() => {
    if (!currentUser) return;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    const subscription = cable.subscriptions.create(
      { channel: "UserChannel", user_id: currentUser.id },
      {
        received(payload: unknown) {
          const maybe = payload as {
            conversation_id?: number;
            sender_id?: number | null;
          };
          if (maybe?.conversation_id) {
            if (String(maybe.sender_id) !== String(currentUser.id)) {
              const convId = String(maybe.conversation_id);
              unreadConversationIdsRef.current.add(convId);
              setUnreadVersion((v) => v + 1);
            }
          }
          loadData({ silent: true });
        },
      },
    );
    subscriptionRef.current = subscription;
    return () => {
      subscription.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [currentUser, loadData]);

  const handleStartChat = async (recipientId: string) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // Find existing conversation first (client-side optimization)
      const existingConv = conversations.find(
        (c) =>
          (c.sender_id === parseInt(currentUser.id) &&
            c.recipient_id === parseInt(recipientId)) ||
          (c.recipient_id === parseInt(currentUser.id) &&
            c.sender_id === parseInt(recipientId)),
      );

      if (existingConv) {
        onSelectChat(existingConv.id.toString());
        setActiveTab("Chats"); // Switch to Chats tab to see the conversation
      } else {
        const conversation = await createConversation(
          currentUser.id,
          recipientId,
        );
        // Refresh conversations list to include the new one
        const conversationsData = await fetchConversations(currentUser.id);
        setConversations(conversationsData);

        onSelectChat(conversation.id.toString());
        setActiveTab("Chats");
        loadData();
      }
    } catch (error) {
      console.error("Failed to start conversation", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getChatPartner = (conversation: Conversation) => {
    if (!currentUser) return conversation.recipient;
    // Compare IDs as strings to handle both number and string types
    if (String(conversation.sender_id) === String(currentUser.id)) {
      return conversation.recipient;
    }
    return conversation.sender;
  };

  const isUnread = (conversationId: string) =>
    unreadConversationIdsRef.current.has(conversationId);

  const markRead = (conversationId: string) => {
    if (unreadConversationIdsRef.current.delete(conversationId)) {
      setUnreadVersion((v) => v + 1);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      markRead(selectedChat);
    }
  }, [selectedChat, unreadVersion]);

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground mb-4">
          Forle Chat
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-6 border-b border-border">
        {["Contacts", "Chats"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === tab
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading && activeTab === "Contacts" ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === "Contacts" ? (
          // Contacts List
          users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleStartChat(user.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-foreground truncate">
                  {user.username}
                </span>
              </div>
            </button>
          ))
        ) : (
          // Conversations List
          conversations.map((chat) => {
            const partner = getChatPartner(chat);
            const preview = chat.last_message?.content || "";
            return (
              <button
                key={chat.id}
                onClick={() => {
                  markRead(chat.id.toString());
                  onSelectChat(chat.id.toString());
                }}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
                  selectedChat === chat.id.toString() && "bg-secondary/70",
                )}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={partner.avatar_url} />
                  <AvatarFallback>
                    {partner.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-sm text-foreground truncate">
                      {partner.username}
                    </span>
                    {isUnread(chat.id.toString()) && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {preview || "—"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
