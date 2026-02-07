import { describe, it, expect } from "vitest";

describe("API Connectivity", () => {
  const API_URL =
    import.meta.env.VITE_API_URL || process.env.TEST_API_URL || "";
  const runIfConfigured = API_URL ? it : it.skip;

  runIfConfigured(
    "should be able to fetch messages from the backend",
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(`${API_URL}/messages`, {
          signal: controller.signal,
        });
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      } finally {
        clearTimeout(timeout);
      }
    },
  );

  runIfConfigured("should be able to send a message", async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: { content: "Test from Vitest" },
        }),
        signal: controller.signal,
      });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.content).toBe("Test from Vitest");
    } finally {
      clearTimeout(timeout);
    }
  });
});
