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

    toast.success("Welcome back");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
          <span className="text-black font-bold text-2xl">T</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Techsoft Quiz</h1>
        <p className="text-zinc-500 text-sm mt-1">Sign in to the admin panel</p>
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-400 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-11 focus:border-amber-500/50 focus:ring-amber-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-400 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600 h-11 focus:border-amber-500/50 focus:ring-amber-500/20"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-semibold h-11 mt-2 shadow-md shadow-amber-500/20"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
