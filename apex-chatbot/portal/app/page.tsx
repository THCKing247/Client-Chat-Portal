"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BotConfig {
  model: string;
  temperature: number;
  max_output_tokens: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Check if password reset is required when session loads
      // Only set to true if the flag is actually present in metadata
      // But skip if we just reset the password in this session
      const justResetPassword = typeof window !== 'undefined' && sessionStorage.getItem("password_reset_in_progress") === "true";
      
      if (session?.user) {
        const userMetadata = session.user.user_metadata || {};
        // Don't show password reset if we just reset it in this session
        const needsReset = userMetadata.must_reset_password === true && !justResetPassword;
        setNeedsPasswordReset(needsReset);
      } else {
        setNeedsPasswordReset(false);
      }

      // Fetch bot config if user is logged in
      if (session?.access_token) {
        try {
          const res = await fetch(`${apiUrl}/bot-config`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const config = await res.json();
            setBotConfig({
              model: config.model || "gpt-4o-mini",
              temperature: config.temperature || 0.2,
              max_output_tokens: config.max_output_tokens || 400,
            });
          }
        } catch (error) {
          // Silently fail - config is optional
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Update password reset state when auth changes
      // But respect sessionStorage flag if password was just reset
      const justResetPassword = typeof window !== 'undefined' && sessionStorage.getItem("password_reset_in_progress") === "true";
      if (session?.user) {
        const userMetadata = session.user.user_metadata || {};
        const needsReset = userMetadata.must_reset_password === true && !justResetPassword;
        setNeedsPasswordReset(needsReset);
      } else {
        setNeedsPasswordReset(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [apiUrl]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoginLoading(false);

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.user) {
      // Refresh user data to get latest metadata (including must_reset_password flag)
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      const currentUser = refreshedUser || data.user;
      
      // Check if account is locked
      const userMetadata = currentUser.user_metadata || {};
      if (userMetadata.account_locked === true) {
        await supabase.auth.signOut();
        setLoginError("Your account has been locked. Please contact your account administrator.");
        return;
      }

      // Check if password reset is required
      if (userMetadata.must_reset_password === true) {
        // Clear any previous session flag (in case user is logging in fresh)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem("password_reset_in_progress");
        }
        setNeedsPasswordReset(true);
        setUser(currentUser);
        setEmail("");
        setPassword("");
        return;
      }

      // No password reset needed - proceed normally
      setNeedsPasswordReset(false);
      setUser(currentUser);
      setEmail("");
      setPassword("");
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);
    
    // Store in sessionStorage that we're resetting password (to prevent showing form again if API fails)
    sessionStorage.setItem("password_reset_in_progress", "true");

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setResetError(updateError.message);
        setResetLoading(false);
        return;
      }

      // Clear the must_reset_password flag by updating user metadata
      // We need to call the API to update metadata
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.access_token) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/auth/clear-password-reset-flag`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          let errorText = "";
          let errorData: any = {};
          
          try {
            errorText = await res.text();
            if (errorText) {
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText };
              }
            }
          } catch (e) {
            errorText = `Failed to read response: ${e}`;
          }
          
          const errorMsg = errorData?.error || errorText || res.statusText || `HTTP ${res.status}`;
          
          // Log detailed error information
          console.error(`Failed to clear password reset flag [Status: ${res.status}]:`, errorMsg);
          console.error("Full error details:", {
            status: res.status,
            statusText: res.statusText,
            error: errorMsg,
            responseText: errorText || "(empty response)",
            responseData: Object.keys(errorData).length > 0 ? errorData : "(empty object)",
            url: `${apiUrl}/auth/clear-password-reset-flag`,
          });
          
          // Log specific error based on status code
          if (res.status === 404) {
            console.error("❌ Endpoint not found - check if API server is running and endpoint is registered");
          } else if (res.status === 401 || res.status === 403) {
            console.error("❌ Authentication failed - check if user session is valid");
          } else if (res.status >= 500) {
            console.error("❌ Server error - check API server logs");
          } else {
            console.error(`❌ Unexpected error with status ${res.status}`);
          }
          // Don't fail the password reset if flag clearing fails - password was already updated
          // The user can still proceed, the flag will be cleared on next login check
        } else {
          // Successfully cleared flag - refresh user session
          const { data: { user: updatedUser } } = await supabase.auth.getUser();
          if (updatedUser) {
            setUser(updatedUser);
            // Check metadata - flag should be cleared now
            const updatedMetadata = updatedUser.user_metadata || {};
            setNeedsPasswordReset(updatedMetadata.must_reset_password === true);
          }
        }
      } else {
        // If no session, still allow access since password was updated
        console.warn("No session available to clear password reset flag");
        // Refresh user to get latest metadata
        const { data: { user: updatedUser } } = await supabase.auth.getUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      }

      // Clear form fields
      setNewPassword("");
      setConfirmPassword("");
      
      // IMPORTANT: Always clear the state after successful password reset
      // Even if API call to clear flag failed, password was updated successfully
      // The sessionStorage flag will prevent it from showing again
      setNeedsPasswordReset(false);
      
      // Keep sessionStorage flag to prevent showing form again
      // This persists across page navigations in the same session
      // The flag will be checked in the render logic and useEffect
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
    setConversationId(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setChatError(null);

    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatLoading(true);

    try {
      // Get the current session and access token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Not authenticated");
      }

      const accessToken = session.access_token;

      // Call the chat API
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to UI
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }

      // Save conversation_id if returned
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send message";
      setChatError(errorMessage);
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tech-gradient flex min-h-screen items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500"></div>
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-cyan-500/20"></div>
          <p className="mt-8 text-center font-mono text-lg font-semibold text-cyan-400">
            INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tech-gradient relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
        
        {/* Scan line effect */}
        <div className="absolute left-0 top-0 h-full w-full">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 animate-[scan-line_3s_linear_infinite]"></div>
        </div>

        <div className="glass-effect relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-block">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-900">
                  <span className="text-2xl font-bold text-cyan-400">AI</span>
                </div>
              </div>
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
              ACCESS PORTAL
            </h1>
            <p className="font-mono text-sm text-cyan-400/70">
              AUTHENTICATION REQUIRED
            </p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-sm font-semibold text-cyan-400"
                >
                  EMAIL_ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                  placeholder="user@domain.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block font-mono text-sm font-semibold text-cyan-400"
                >
                  PASSWORD
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                  placeholder="••••••••"
                />
              </div>
              {loginError && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 font-mono text-sm text-red-400 backdrop-blur-sm">
                  <span className="font-semibold">ERROR:</span> {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="tech-button w-full rounded-lg px-6 py-3 font-mono font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loginLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                    AUTHENTICATING...
                  </span>
                ) : (
                  "LOGIN →"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center font-mono text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block font-mono text-sm font-semibold text-cyan-400"
                >
                  EMAIL_ADDRESS
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                  placeholder="user@domain.com"
                />
              </div>
              {forgotPasswordMsg && (
                <div className={`rounded-lg border p-3 font-mono text-sm backdrop-blur-sm ${
                  forgotPasswordMsg.includes("sent") || forgotPasswordMsg.includes("exists")
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-400"
                }`}>
                  {forgotPasswordMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="tech-button w-full rounded-lg px-6 py-3 font-mono font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {forgotPasswordLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                    SENDING...
                  </span>
                ) : (
                  "SEND RESET LINK →"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordMsg(null);
                }}
                className="w-full text-center font-mono text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Show password reset form if needed
  // Show if: user exists, needsPasswordReset is true, AND must_reset_password is actually true in metadata
  // Only skip if we just successfully reset the password in this session
  const justResetPassword = typeof window !== 'undefined' && sessionStorage.getItem("password_reset_in_progress") === "true";
  const hasResetFlag = user?.user_metadata?.must_reset_password === true;
  
  // Show form if needsPasswordReset is true AND flag is present
  // Only hide if we just reset (sessionStorage flag exists) - this prevents showing again after successful reset
  // But allow it to show on fresh login (when sessionStorage flag doesn't exist)
  const shouldShowPasswordReset = needsPasswordReset && user && hasResetFlag && !justResetPassword;
  
  if (shouldShowPasswordReset) {
    return (
      <div className="tech-gradient relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
        
        {/* Scan line effect */}
        <div className="absolute left-0 top-0 h-full w-full">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20 animate-[scan-line_3s_linear_infinite]"></div>
        </div>

        <div className="glass-effect relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-block">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-900">
                  <span className="text-2xl font-bold text-cyan-400">AI</span>
                </div>
              </div>
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold text-transparent">
              PASSWORD RESET REQUIRED
            </h1>
            <p className="font-mono text-sm text-cyan-400/70">
              You must set a new password to continue
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block font-mono text-sm font-semibold text-cyan-400"
              >
                NEW PASSWORD
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block font-mono text-sm font-semibold text-cyan-400"
              >
                CONFIRM PASSWORD
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                placeholder="Confirm new password"
              />
            </div>
            {resetError && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 font-mono text-sm text-red-400 backdrop-blur-sm">
                <span className="font-semibold">ERROR:</span> {resetError}
              </div>
            )}
            <button
              type="submit"
              disabled={resetLoading}
              className="tech-button w-full rounded-lg px-6 py-3 font-mono font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  UPDATING...
                </span>
              ) : (
                "SET NEW PASSWORD →"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="tech-gradient relative flex min-h-screen flex-col overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>

      {/* Header */}
      <header className="glass-effect relative z-10 border-b border-cyan-500/20">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-900">
                <span className="text-lg font-bold text-cyan-400">AI</span>
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-xl font-bold text-transparent">
              TEST CHAT
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-3 py-1.5 font-mono text-xs text-cyan-400">
              {user.email}
            </div>
            <Link
              href="/users"
              className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              USERS
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              SETTINGS
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Bot Config Display */}
      {botConfig && (
        <div className="glass-effect relative z-10 border-b border-cyan-500/20">
          <div className="mx-auto max-w-4xl px-6 py-3">
            <div className="flex items-center justify-center gap-6 font-mono text-xs text-cyan-400/80">
              <div className="flex items-center gap-2">
                <span className="text-cyan-500/60">MODEL:</span>
                <span className="font-semibold text-cyan-400">{botConfig.model}</span>
              </div>
              <div className="h-4 w-px bg-cyan-500/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-500/60">TEMP:</span>
                <span className="font-semibold text-cyan-400">{botConfig.temperature}</span>
              </div>
              <div className="h-4 w-px bg-cyan-500/30"></div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-500/60">MAX TOKENS:</span>
                <span className="font-semibold text-cyan-400">{botConfig.max_output_tokens}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:0.4s]"></div>
                  </div>
                </div>
                <p className="font-mono text-sm text-cyan-400/70">
                  SYSTEM READY • AWAITING INPUT
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "message-user text-white"
                      : "message-assistant text-cyan-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="message-assistant rounded-2xl px-5 py-3">
                <div className="flex gap-2">
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error message */}
      {chatError && (
        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-2">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 font-mono text-sm text-red-400 backdrop-blur-sm">
            <span className="font-semibold">ERROR:</span> {chatError}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="glass-effect relative z-10 border-t border-cyan-500/20">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={chatLoading}
              className="tech-input flex-1 rounded-lg px-5 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputMessage.trim()}
              className="tech-button rounded-lg px-8 py-3 font-mono font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {chatLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  SEND
                </span>
              ) : (
                "SEND →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
