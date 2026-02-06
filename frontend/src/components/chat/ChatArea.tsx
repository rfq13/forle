import {
  MoreHorizontal,
  Smile,
  Paperclip,
  Mic,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { fetchMessages, sendMessage, fetchConversation } from "@/lib/api";
import cable from "@/lib/cable";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChatAreaProps {
  className?: string;
  selectedChat: string | null;
  onMessageSent?: () => void;
}

interface Message {
  id: string;
  type: "sent" | "received";
  content: string;
  time: string;
  isVoice?: boolean;
  duration?: string;
  user_id?: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface ApiUser {
  id: number;
  username: string;
  avatar_url?: string;
}

interface ApiMessage {
  id: number;
  user_id: number | null;
  content: string;
  created_at: string;
  user?: ApiUser;
}

interface ApiConversation {
  id: number;
  sender_id: number;
  recipient_id: number;
  sender: ApiUser;
  recipient: ApiUser;
}

function VoiceMessage({ duration }: { duration: string }) {
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
        <Play className="w-4 h-4 ml-0.5" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-0.5 h-8">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-voice-wave rounded-full"
              style={{
                height: `${Math.random() * 100}%`,
                minHeight: "4px",
                opacity: i < 15 ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-sm text-muted-foreground flex-shrink-0">
        {duration}
      </span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <div className="flex gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-typing animate-typing-dot"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-typing animate-typing-dot"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-typing animate-typing-dot"
          style={{ animationDelay: "400ms" }}
        />
      </div>
      <span>Jane is typing</span>
    </div>
  );
}

export function ChatArea({ className, selectedChat }: ChatAreaProps) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatPartner, setChatPartner] = useState<{
    username: string;
    avatar_url?: string;
    isOnline?: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<
    typeof cable.subscriptions.create
  > | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Reset state when chat changes
    setMessages([]);
    setError(null);
    setIsLoading(true);
    setChatPartner(null);

    if (!selectedChat) {
      setIsLoading(false);
      return;
    }

    // Fetch conversation details if private chat
    fetchConversation(selectedChat)
      .then((conv: ApiConversation) => {
        const partner =
          String(conv.sender_id) === String(currentUser.id)
            ? conv.recipient
            : conv.sender;
        setChatPartner({
          username: partner.username,
          avatar_url: partner.avatar_url,
          isOnline: true,
        });
      })
      .catch((err) =>
        console.error("Failed to load conversation details", err),
      );

    // Load initial messages
    fetchMessages(selectedChat)
      .then((data: ApiMessage[]) => {
        const formattedMessages = data.map((msg) => ({
          id: msg.id.toString(),
          type: msg.user_id === parseInt(currentUser.id) ? "sent" : "received",
          content: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          user_id: msg.user_id?.toString(),
          user: msg.user,
        }));
        setMessages(formattedMessages);
        scrollToBottom();
      })
      .catch((err) => {
        console.error("Failed to load messages", err);
        setError("Failed to load chat history. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const channel = cable.subscriptions.create(
      { channel: "ChatChannel", conversation_id: selectedChat },
      {
        received(data: ApiMessage) {
          const newMessage: Message = {
            id: data.id.toString(),
            type:
              data.user_id === parseInt(currentUser.id) ? "sent" : "received",
            content: data.content,
            time: new Date(data.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            user_id: data.user_id?.toString(),
            user: data.user,
          };
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        },
      },
    );
    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
      subscriptionRef.current = null;
    };
  }, [currentUser, selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || !currentUser || !selectedChat) return;

    try {
      await sendMessage(input, currentUser.id, selectedChat);
      setInput("");
      onMessageSent?.();
      // Message will be added via ActionCable subscription
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className={cn("flex flex-col bg-background", className)}>
      {/* Header */}
      <header className="px-4 md:px-6 py-4 bg-card border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={chatPartner?.avatar_url} />
            <AvatarFallback>
              {chatPartner?.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">
              {chatPartner
                ? chatPartner.username
                : selectedChat
                  ? "Loading..."
                  : "Pilih kontak untuk memulai chat"}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-online" />
              <span className="text-sm text-online">Online</span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* ... (rest of the component) */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
        {!selectedChat ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Pilih kontak di sebelah kiri untuk mulai percakapan.</p>
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.type === "sent" ? "items-end" : "items-start",
              )}
            >
              {/* Username for received messages */}
              {message.type === "received" && message.user && (
                <span className="text-xs text-muted-foreground ml-12">
                  {message.user.username}
                </span>
              )}

              <div
                className={cn(
                  "flex w-full",
                  message.type === "sent" ? "justify-end" : "justify-start",
                )}
              >
                <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                  {message.type === "received" && (
                    <Avatar className="w-8 h-8 flex-shrink-0 mb-1">
                      <AvatarImage src={message.user?.avatar_url} />
                      <AvatarFallback>
                        {message.user?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl",
                      message.type === "sent"
                        ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md"
                        : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md",
                    )}
                  >
                    {message.isVoice ? (
                      <VoiceMessage duration={message.duration!} />
                    ) : (
                      <p className="text-sm whitespace-pre-line">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {/* <div className="px-4 md:px-6 py-2">
        <TypingIndicator />
      </div> */}

      {/* Input */}
      <div className="px-4 md:px-6 pb-4 md:pb-6">
        <div className="flex items-center gap-2 bg-card rounded-xl border border-border px-4 py-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder={
              selectedChat
                ? "Type your message..."
                : "Pilih kontak untuk mulai chat"
            }
            className="flex-1 bg-transparent border-0 text-sm placeholder:text-muted-foreground focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!selectedChat}
          />
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={handleSend}
            disabled={!selectedChat}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
