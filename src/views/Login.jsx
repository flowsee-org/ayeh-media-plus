'use client';
import React, { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useSearchParams } from 'next/navigation';
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Phone } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import BrandLogo from "@/components/design-system/BrandLogo";

export default function Login() {
  const { openAuthModal, checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.loginViaEmailPassword(email, password);
      await checkUserAuth();
      const returnTo = searchParams.get("returnTo");
      navigate(returnTo || "/");
    } catch (err) {
      // Backend gates email/password login until OTP verification succeeds.
      // Resend a code and hand the user to the existing Register OTP step.
      if (err?.status === 403 && err?.data?.code === "EMAIL_NOT_VERIFIED") {
        const pendingEmail = err.data.email || email;
        try {
          await api.auth.resendOtp(pendingEmail);
        } catch {
          // Still route to verify UI even if resend fails (user can retry there).
        }
        const returnTo = searchParams.get("returnTo");
        const qs = new URLSearchParams({ email: pendingEmail, verify: "1" });
        if (returnTo) qs.set("returnTo", returnTo);
        navigate(`/register?${qs.toString()}`);
        return;
      }
      setError(err.message || "ایمیل یا رمز عبور اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="inline" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-rokh-bold font-bold text-foreground">ورود به آیه پلاس</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
            ویدیوهای قرآنی را تماشا و منتشر کنید
          </p>
        </div>

        <div className="bg-card rounded border border-border shadow-sm p-6 sm:p-8">
          <button
            type="button"
            onClick={() => openAuthModal(() => { navigate("/"); })}
            className="w-full mb-5 py-3 rounded bg-muted hover:bg-muted/80 border border-border text-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-primary" />
            ورود سریع با شماره همراه
          </button>

          <div className="flex items-center gap-2 mb-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">یا با ایمیل</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pe-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">رمز عبور</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  فراموشی رمز؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-10 h-11"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 ms-2" />
                  ورود
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            حساب ندارید؟{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              ثبت‌نام
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
