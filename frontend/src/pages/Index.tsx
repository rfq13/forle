import { useEffect, useState } from "react";
import { IconSidebar } from "@/components/chat/IconSidebar";
import { ChatList } from "@/components/chat/ChatList";
import { ChatArea } from "@/components/chat/ChatArea";
import { MobileHeader } from "@/components/chat/MobileHeader";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [chatListRefreshKey, setChatListRefreshKey] = useState(0);
  useEffect(() => {
    setSelectedChat(null);
  }, [currentUser]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader
        showChatList={showChatList}
        onToggle={() => setShowChatList(!showChatList)}
      />

      {/* Icon Sidebar - Hidden on mobile */}
      <IconSidebar className="hidden md:flex w-16 flex-shrink-0" />

      {/* Chat List - Toggleable on mobile */}
      <ChatList
        selectedChat={selectedChat}
        onSelectChat={(id) => {
          setSelectedChat(id);
          setShowChatList(false);
        }}
        refreshKey={chatListRefreshKey}
        className={`
          w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border
          ${showChatList ? "flex" : "hidden md:flex"}
          absolute md:relative inset-0 top-14 md:top-0 z-10 md:z-auto
        `}
      />

      {/* Chat Area */}
      <ChatArea
        className={`
          flex-1 min-w-0
          ${showChatList ? "hidden md:flex" : "flex"}
        `}
        selectedChat={selectedChat}
        onMessageSent={() => setChatListRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};

export default Index;
