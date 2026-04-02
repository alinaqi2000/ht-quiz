"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }

    toast.success("Logged in successfully");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">Q</span>
        </div>
        <h1 className="text-2xl font-bold text-white">HT Quiz Platform</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to access the admin panel</p>
      </div>

      {/* Form */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-sm">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-700/60 border-slate-600 text-white placeholder:text-slate-500 h-11"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium h-11 mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
