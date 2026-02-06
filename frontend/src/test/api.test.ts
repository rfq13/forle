import { describe, it, expect } from "vitest";

describe("API Connectivity", () => {
  const API_URL = "http://172.18.162.234:3000";

  it("should be able to fetch messages from the backend", async () => {
    try {
      const response = await fetch(`${API_URL}/messages`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      console.log("Successfully fetched messages:", data);
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  });

  it("should be able to send a message", async () => {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: { content: "Test from Vitest" } }),
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.content).toBe("Test from Vitest");
      console.log("Successfully sent message:", data);
    } catch (error) {
      console.error("Send error:", error);
      throw error;
    }
  });
});
