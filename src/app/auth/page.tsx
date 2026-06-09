"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ERROR_MESSAGES: Record<string, string> = {
  "not-registered": "This Google account is not registered. Contact your administrator for access.",
};

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthErrorMessage = oauthError ? (ERROR_MESSAGES[oauthError] ?? null) : null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res?.ok || res?.error) {
      setErrorMessage("Invalid email or password");
      return;
    }

    router.push("/(secure)/tp/");
  }

  // ── REGISTER HANDLER (commented out — may be re-enabled later) ──────────────
  // async function handleRegister(e: React.FormEvent) {
  //   e.preventDefault();
  //   setLoading(true);
  //   setErrorMessage(null);
  //
  //   const res = await fetch("/api/register", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ email, password }),
  //   });
  //
  //   const data = await res.json();
  //   setLoading(false);
  //
  //   if (!res.ok) {
  //     if (data.hint === "USE_GOOGLE") {
  //       setErrorMessage("You already have an account. Continue with Google");
  //       return;
  //     }
  //     if (data.hint === "USE_LOGIN") {
  //       setErrorMessage("You already have an account. Please log in.");
  //       return;
  //     }
  //     setErrorMessage(data.error || "Unable to create account");
  //     return;
  //   }
  //
  //   await signIn("credentials", {
  //     email,
  //     password,
  //     callbackUrl: "/dashboard",
  //   });
  // }
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md">
      {oauthErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{oauthErrorMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="credentials">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials">Sign In</TabsTrigger>
          <TabsTrigger value="sso">SSO</TabsTrigger>
        </TabsList>

        {/* ── MANUAL CREDENTIAL SIGN-IN TAB ─────────────────────────────────── */}
        <TabsContent value="credentials">
          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-2.5 right-3 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </TabsContent>

        {/* ── SSO TAB ───────────────────────────────────────────────────────── */}
        <TabsContent value="sso">
          <div className="mt-4 space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Sign in using single sign-on provider.
            </p>
            <Button
              type="button"
              variant="outline"
              className="flex w-full items-center justify-center gap-2"
              onClick={() => signIn("google", { callbackUrl: "/tp" })}
            >
              {/* Inline Google "G" SVG — no new dependencies */}
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.39 3.07 29.5 1 24 1 14.82 1 7.07 6.48 3.88 14.18l7.09 5.51C12.64 13.61 17.87 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.55c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.9-2.18 5.36-4.64 7.01l7.19 5.59C43.18 37.07 46.1 31.27 46.1 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.97 28.31A14.6 14.6 0 0 1 9.5 24c0-1.5.26-2.95.72-4.31L3.13 14.18A23.94 23.94 0 0 0 0 24c0 3.86.92 7.5 2.54 10.72l8.43-6.41z"
                />
                <path
                  fill="#EA4335"
                  d="M24 47c5.5 0 10.12-1.82 13.5-4.95l-7.19-5.59C28.54 38.1 26.38 38.5 24 38.5c-6.13 0-11.36-4.11-13.03-9.69l-8.43 6.41C6.07 42.69 14.49 47 24 47z"
                />
              </svg> */}
              <Image
                src="https://api.iconify.design/logos:google-icon.svg"
                width="18"
                height="18"
                alt="Google"
              />
              Continue with Google
            </Button>
          </div>
        </TabsContent>

        {/* ── REGISTER TAB (commented out — may be re-enabled later) ────────── */}
        {/* <TabsTrigger value="register">Register</TabsTrigger> */}
        {/* <TabsContent value="register">
          <form onSubmit={handleRegister} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
