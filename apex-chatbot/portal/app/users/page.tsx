"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Row = { id: string; user_id: string; role: string; email?: string; name?: string | null; account_locked?: boolean };

export default function UsersPage() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [rows, setRows] = useState<Row[]>([]);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [firstNameToAdd, setFirstNameToAdd] = useState("");
  const [lastNameToAdd, setLastNameToAdd] = useState("");
  const [passwordToAdd, setPasswordToAdd] = useState("");
  const [roleToAdd, setRoleToAdd] = useState("agent");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("agent");
  const [editAccountLocked, setEditAccountLocked] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  async function authedFetch(url: string, opts: any = {}) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not logged in");

    return fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await authedFetch(`${api}/users`);
      const data = await res.json();
      setRows(data.users || []);
      
      // Get current user's role from the users list
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const currentUser = data.users?.find((u: Row) => u.user_id === user.id);
        if (currentUser) {
          setCurrentUserRole(currentUser.role);
        }
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser() {
    setMsg("");
    if (!emailToAdd.trim()) {
      setMsg("Email is required");
      return;
    }
    if (!firstNameToAdd.trim() || !lastNameToAdd.trim()) {
      setMsg("First name and last name are required");
      return;
    }
    
    const res = await authedFetch(`${api}/users/add-by-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: emailToAdd, 
        first_name: firstNameToAdd.trim(),
        last_name: lastNameToAdd.trim(),
        password: passwordToAdd || undefined,
        role: roleToAdd 
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error || "Add failed");

    setEmailToAdd("");
    setFirstNameToAdd("");
    setLastNameToAdd("");
    setPasswordToAdd("");
    if (data.created) {
      setMsg("User created and added ✅");
    } else if (data.note) {
      setMsg(data.note + " ✅");
    } else {
      setMsg("Added ✅");
    }
    load();
  }

  async function sendResetLink(userId: string) {
    setMsg("");
    try {
      const res = await authedFetch(`${api}/users/${userId}/send-reset`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Failed to send reset link");
        return;
      }

      setMsg("Password reset link sent ✅");
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Failed to send reset link");
    }
  }

  function generateTempPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const length = 16;
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(password);
  }

  function startEdit(row: Row) {
    const nameParts = row.name ? row.name.split(" ") : ["", ""];
    setEditFirstName(nameParts[0] || "");
    setEditLastName(nameParts.slice(1).join(" ") || "");
    setEditEmail(row.email || "");
    setEditPassword("");
    setEditRole(row.role);
    setEditAccountLocked(row.account_locked || false);
    setEditingUserId(row.id);
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditFirstName("");
    setEditLastName("");
    setEditEmail("");
    setEditPassword("");
    setEditRole("agent");
    setEditAccountLocked(false);
  }

  async function saveEdit() {
    if (!editingUserId) return;
    
    setMsg("");
    if (!editFirstName.trim() || !editLastName.trim()) {
      setMsg("First name and last name are required");
      return;
    }
    if (editEmail && !editEmail.includes("@")) {
      setMsg("Invalid email format");
      return;
    }

    try {
      const body: any = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        role: editRole,
        account_locked: editAccountLocked,
      };
      
      if (editEmail.trim()) {
        body.email = editEmail.trim().toLowerCase();
      }
      
      if (editPassword && editPassword.trim().length > 0) {
        body.password = editPassword.trim();
      }

      const res = await authedFetch(`${api}/users/${editingUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Failed to update user");
        return;
      }

      if (editPassword.trim()) {
        setMsg("User updated and temporary password set ✅");
      } else {
        setMsg("User updated ✅");
      }
      cancelEdit();
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Failed to update user");
    }
  }

  async function removeUser(rowId: string) {
    setMsg("");
    try {
      const res = await authedFetch(`${api}/users/${rowId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Remove failed");
        return;
      }

      setMsg("Removed ✅");
      load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Failed to remove user");
    }
  }

  return (
    <div className="tech-gradient relative min-h-screen overflow-hidden">
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
              USER MANAGEMENT
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              ← CHAT
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              SETTINGS
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-8">
        <div className="glass-effect rounded-2xl p-8">
          <p className="mb-6 font-mono text-sm text-cyan-400/70">
            This is who can access the client portal for your company.
          </p>

          {/* Message Display */}
          {msg && (
            <div
              className={`mb-6 rounded-lg border p-3 font-mono text-sm backdrop-blur-sm ${
                msg.includes("✅")
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-400"
              }`}
            >
              {msg}
            </div>
          )}

          {/* Current Users Section */}
          <div className="mb-8">
            <h2 className="mb-4 font-mono text-lg font-semibold text-cyan-400">
              CURRENT USERS
            </h2>
            <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500"></div>
                </div>
              ) : rows.length === 0 ? (
                <div className="py-8 text-center font-mono text-sm text-cyan-400/70">
                  No users found.
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-cyan-500/20 bg-slate-900/30 p-4"
                    >
                      {editingUserId === r.id ? (
                        <div className="space-y-4">
                          <div className="font-mono text-sm font-semibold text-cyan-400 mb-3">
                            EDIT USER
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block font-mono text-xs font-semibold text-cyan-400">
                                EMAIL
                              </label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="tech-input w-full rounded-lg px-3 py-2 font-mono text-sm text-cyan-100"
                                placeholder="user@example.com"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block font-mono text-xs font-semibold text-cyan-400">
                                FIRST NAME *
                              </label>
                              <input
                                value={editFirstName}
                                onChange={(e) => setEditFirstName(e.target.value)}
                                className="tech-input w-full rounded-lg px-3 py-2 font-mono text-sm text-cyan-100"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block font-mono text-xs font-semibold text-cyan-400">
                                LAST NAME *
                              </label>
                              <input
                                value={editLastName}
                                onChange={(e) => setEditLastName(e.target.value)}
                                className="tech-input w-full rounded-lg px-3 py-2 font-mono text-sm text-cyan-100"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block font-mono text-xs font-semibold text-cyan-400">
                                TEMPORARY PASSWORD
                              </label>
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={generateTempPassword}
                                  className="w-full rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 font-mono text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/20"
                                >
                                  GENERATE TEMPORARY PASSWORD
                                </button>
                                {editPassword && (
                                  <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 p-3">
                                    <div className="mb-1 font-mono text-xs text-cyan-500/60">
                                      Generated Password:
                                    </div>
                                    <div className="font-mono text-sm font-semibold text-cyan-400 break-all select-all">
                                      {editPassword}
                                    </div>
                                    <p className="mt-2 font-mono text-xs text-cyan-400/60">
                                      User will be prompted to reset password on next login
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block font-mono text-xs font-semibold text-cyan-400">
                                ROLE
                              </label>
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="tech-input w-full rounded-lg px-3 py-2 font-mono text-sm text-cyan-100"
                              >
                                <option value="owner" className="bg-slate-900 text-cyan-100">owner</option>
                                <option value="admin" className="bg-slate-900 text-cyan-100">admin</option>
                                <option value="agent" className="bg-slate-900 text-cyan-100">agent</option>
                              </select>
                            </div>
                            {/* Only show lock checkbox for owners and admins */}
                            {(currentUserRole === "owner" || currentUserRole === "admin") && (
                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="checkbox"
                                  id="account-locked"
                                  checked={editAccountLocked}
                                  onChange={(e) => setEditAccountLocked(e.target.checked)}
                                  className="h-4 w-4 rounded border-cyan-500/30 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500"
                                />
                                <label htmlFor="account-locked" className="font-mono text-sm font-semibold text-cyan-400">
                                  Lock Account (prevents login)
                                </label>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={saveEdit}
                              className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 font-mono text-sm font-semibold text-green-400 transition-all hover:bg-green-500/20"
                            >
                              SAVE
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20"
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            {r.name && (
                              <div className="font-mono text-sm">
                                <span className="text-cyan-500/60">NAME:</span>{" "}
                                <span className="font-semibold text-cyan-400">
                                  {r.name}
                                </span>
                              </div>
                            )}
                            <div className="font-mono text-sm">
                              <span className="text-cyan-500/60">EMAIL:</span>{" "}
                              <span className="font-semibold text-cyan-400">
                                {r.email || r.user_id}
                              </span>
                            </div>
                        <div className="font-mono text-sm">
                          <span className="text-cyan-500/60">ROLE:</span>{" "}
                          <span className="font-semibold text-cyan-400">
                            {r.role}
                          </span>
                        </div>
                        {r.account_locked && (
                          <div className="font-mono text-sm">
                            <span className="text-red-500/60">STATUS:</span>{" "}
                            <span className="font-semibold text-red-400">
                              LOCKED
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendResetLink(r.id)}
                            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/20"
                          >
                            SEND RESET
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(r)}
                            className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 font-mono text-sm font-semibold text-yellow-400 transition-all hover:bg-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/20"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => removeUser(r.id)}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add User Section */}
          <div>
            <h2 className="mb-4 font-mono text-lg font-semibold text-cyan-400">
              ADD USER (BY EMAIL)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-sm font-semibold text-cyan-400">
                  EMAIL *
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={emailToAdd}
                  onChange={(e) => setEmailToAdd(e.target.value)}
                  required
                  style={{ padding: 10 }}
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-sm font-semibold text-cyan-400">
                  FIRST NAME *
                </label>
                <input
                  placeholder="First name"
                  value={firstNameToAdd}
                  onChange={(e) => setFirstNameToAdd(e.target.value)}
                  required
                  style={{ padding: 10 }}
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-sm font-semibold text-cyan-400">
                  LAST NAME *
                </label>
                <input
                  placeholder="Last name"
                  value={lastNameToAdd}
                  onChange={(e) => setLastNameToAdd(e.target.value)}
                  required
                  style={{ padding: 10 }}
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-sm font-semibold text-cyan-400">
                  PASSWORD (OPTIONAL)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={passwordToAdd}
                  onChange={(e) => setPasswordToAdd(e.target.value)}
                  style={{ padding: 10 }}
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block font-mono text-sm font-semibold text-cyan-400">
                  ROLE
                </label>
                <select
                  value={roleToAdd}
                  onChange={(e) => setRoleToAdd(e.target.value)}
                  className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100"
                >
                  <option value="owner" className="bg-slate-900 text-cyan-100">
                    owner
                  </option>
                  <option value="admin" className="bg-slate-900 text-cyan-100">
                    admin
                  </option>
                  <option value="agent" className="bg-slate-900 text-cyan-100">
                    agent
                  </option>
                </select>
              </div>
              <button
                onClick={addUser}
                className="tech-button w-full rounded-lg px-6 py-3 font-mono font-semibold text-white"
              >
                ADD USER →
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-cyan-400/60">
              Users will be automatically created in Supabase Auth if they don't exist.
              A random password will be generated. They can reset it via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
