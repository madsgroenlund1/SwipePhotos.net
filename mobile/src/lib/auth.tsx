import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken, setUnauthorizedHandler } from "./api";
import { storage } from "./storage";

const TOKEN_KEY = "sw_session_token";
const EMAIL_KEY = "sw_email";

interface AuthValue {
  /** false until the stored session has been read */
  ready: boolean;
  signedIn: boolean;
  email: string | null;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signInWithApple: (identityToken: string) => Promise<void>;
  rotateToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setEmail(null);
    await Promise.all([storage.remove(TOKEN_KEY), storage.remove(EMAIL_KEY)]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { void signOut(); });
    (async () => {
      const [storedToken, storedEmail] = await Promise.all([storage.get(TOKEN_KEY), storage.get(EMAIL_KEY)]);
      setAuthToken(storedToken);
      setToken(storedToken);
      setEmail(storedEmail);
      setReady(true);
    })();
  }, [signOut]);

  const adopt = useCallback(async (newToken: string, newEmail: string) => {
    setAuthToken(newToken);
    setToken(newToken);
    setEmail(newEmail);
    await Promise.all([storage.set(TOKEN_KEY, newToken), storage.set(EMAIL_KEY, newEmail)]);
  }, []);

  const value = useMemo<AuthValue>(() => ({
    ready,
    signedIn: token !== null,
    email,
    requestCode: async (address) => { await api.post("/api/mobile/auth/code/start", { email: address }); },
    verifyCode: async (address, code) => {
      const res = await api.post<{ token: string; email: string }>("/api/mobile/auth/code/verify", { email: address, code });
      await adopt(res.token, res.email);
    },
    signInWithApple: async (identityToken) => {
      const res = await api.post<{ token: string; email: string }>("/api/mobile/auth/apple", { identityToken });
      await adopt(res.token, res.email);
    },
    rotateToken: async (newToken) => {
      setAuthToken(newToken);
      setToken(newToken);
      await storage.set(TOKEN_KEY, newToken);
    },
    signOut,
  }), [ready, token, email, adopt, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
