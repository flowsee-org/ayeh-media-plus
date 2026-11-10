'use client';
import React, { useState } from "react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import BrandLogo from "@/components/design-system/BrandLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.resetPasswordRequest(email);
      if (res?.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch {
      // Always show success state for security
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="inline" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-rokh-bold font-bold text-foreground">بازیابی رمز عبور</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
            پیوند بازنشانی رمز برای ایمیل شما ارسال خواهد شد
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-primary mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <p className="text-foreground font-medium text-sm leading-relaxed font-doran">
                در صورتی که حسابی با ایمیل{" "}
                <span className="text-primary dir-ltr inline-block">{email}</span> ثبت شده باشد،
                پیوند تغییر رمز ارسال گردید.
              </p>
              {resetToken && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-foreground text-xs text-center mt-3">
                  <span className="text-muted-foreground">پیوند مستقیم تغییر رمز (محیط آزمایشی): </span>
                  <Link
                    to={`/reset-password?token=${resetToken}`}
                    className="underline font-bold text-primary block mt-1"
                  >
                    تغییر فوری رمز عبور
                  </Link>
                </div>
              )}
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به صفحه ورود</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل حساب کاربری</Label>
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

              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                    در حال ارسال پیوند...
                  </>
                ) : (
                  "ارسال پیوند بازیابی"
                )}
              </Button>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>انصراف و بازگشت به ورود</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
