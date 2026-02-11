import {
  getStoredAuthToken,
  setStoredAuthToken,
  clearStoredAuthToken,
} from "@/lib/authToken";

describe("authToken", () => {
  beforeEach(() => {
    clearStoredAuthToken();
  });

  it("returns null initially", () => {
    expect(getStoredAuthToken()).toBe(null);
  });

  it("stores and retrieves auth token", () => {
    const token = "test-token-123";
    setStoredAuthToken(token);
    expect(getStoredAuthToken()).toBe(token);
  });

  it("updates existing token", () => {
    setStoredAuthToken("first-token");
    expect(getStoredAuthToken()).toBe("first-token");

    setStoredAuthToken("second-token");
    expect(getStoredAuthToken()).toBe("second-token");
  });

  it("clears stored token", () => {
    setStoredAuthToken("token-to-clear");
    expect(getStoredAuthToken()).toBe("token-to-clear");

    clearStoredAuthToken();
    expect(getStoredAuthToken()).toBe(null);
  });

  it("handles multiple clear calls", () => {
    setStoredAuthToken("token");
    clearStoredAuthToken();
    clearStoredAuthToken();
    expect(getStoredAuthToken()).toBe(null);
  });

  it("handles empty string token", () => {
    setStoredAuthToken("");
    expect(getStoredAuthToken()).toBe("");
  });

  it("maintains token state across multiple gets", () => {
    setStoredAuthToken("persistent-token");
    expect(getStoredAuthToken()).toBe("persistent-token");
    expect(getStoredAuthToken()).toBe("persistent-token");
    expect(getStoredAuthToken()).toBe("persistent-token");
  });
});
