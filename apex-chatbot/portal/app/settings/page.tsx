"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

interface BotConfig {
  model: string;
  temperature: number;
  system_prompt: string;
}

export default function SettingsPage() {
  const [cfg, setCfg] = useState<BotConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${api}/bot-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCfg(await res.json());
      setLoading(false);
    });
  }, [api]);

  async function save() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    await fetch(`${api}/bot-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cfg),
    });

    setMsg("Saved!");
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="tech-gradient flex min-h-screen items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500"></div>
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-cyan-500/20"></div>
          <p className="mt-8 text-center font-mono text-lg font-semibold text-cyan-400">
            LOADING CONFIG...
          </p>
        </div>
      </div>
    );
  }

  if (!cfg) {
    return (
      <div className="tech-gradient flex min-h-screen items-center justify-center">
        <div className="font-mono text-cyan-400">No configuration found</div>
      </div>
    );
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
              CONFIGURATION PANEL
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-cyan-500/30 bg-slate-900/50 px-4 py-2 font-mono text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              ← BACK TO CHAT
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
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="mb-3 block font-mono text-sm font-semibold text-cyan-400">
                MODEL
              </label>
              <select
                value={cfg.model}
                onChange={(e) => setCfg({ ...cfg, model: e.target.value })}
                className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100"
              >
                <option value="gpt-4o-mini" className="bg-slate-900 text-cyan-100">
                  gpt-4o-mini
                </option>
                <option value="gpt-4.1" className="bg-slate-900 text-cyan-100">
                  gpt-4.1
                </option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label className="mb-3 block font-mono text-sm font-semibold text-cyan-400">
                TEMPERATURE
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={cfg.temperature}
                onChange={(e) =>
                  setCfg({ ...cfg, temperature: Number(e.target.value) })
                }
                className="tech-input w-full rounded-lg px-4 py-3 font-mono text-cyan-100"
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="mb-3 block font-mono text-sm font-semibold text-cyan-400">
                SYSTEM PROMPT
              </label>
              <textarea
                rows={8}
                value={cfg.system_prompt}
                onChange={(e) =>
                  setCfg({ ...cfg, system_prompt: e.target.value })
                }
                className="tech-input w-full rounded-lg px-4 py-3 font-mono text-sm text-cyan-100 leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={save}
                className="tech-button w-full rounded-lg px-6 py-3 font-mono font-semibold text-white"
              >
                SAVE CONFIGURATION →
              </button>
            </div>

            {/* Success Message */}
            {msg && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 font-mono text-sm text-green-400 backdrop-blur-sm">
                <span className="font-semibold">SUCCESS:</span> {msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
