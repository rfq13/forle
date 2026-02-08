const API_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  (import.meta as any).env?.VITE_API_URL ??
  "";

export const fetchMessages = async (conversationId?: string) => {
  const url = conversationId
    ? `${API_URL}/conversations/${conversationId}/messages`
    : `${API_URL}/messages`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const fetchConversation = async (id: string) => {
  const response = await fetch(`${API_URL}/conversations/${id}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const fetchConversations = async (userId: string) => {
  const response = await fetch(`${API_URL}/conversations?user_id=${userId}`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const createConversation = async (
  senderId: string,
  recipientId: string,
) => {
  const response = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/users`);
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const createUser = async (username: string, avatar_url?: string) => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user: { username, avatar_url } }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const sendMessage = async (
  content: string,
  userId: string,
  conversationId?: string,
) => {
  const url = conversationId
    ? `${API_URL}/conversations/${conversationId}/messages`
    : `${API_URL}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { content, user_id: userId } }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};
