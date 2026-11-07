'use client';
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { IslamicStar } from "@/components/IslamicOrnaments";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#041a14] via-[#063326] to-[#02130e] px-4" dir="rtl">
      <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-950 shadow-emerald-glow mb-4 border border-amber-400/40">
            <Mail className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">بازیابی رمز عبور</h1>
          <p className="text-blue-200/70 mt-2 text-sm">پیوند بازنشانی رمز برای ایمیل شما ارسال خواهد شد</p>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-premium">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-400/40" />
            <IslamicStar size={14} className="text-orange-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-400/40" />
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-emerald-400 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <p className="text-white font-medium text-sm leading-relaxed">
                در صورتی که حسابی با ایمیل <span className="text-orange-300 dir-ltr inline-block">{email}</span> ثبت شده باشد، پیوند تغییر رمز ارسال گردید.
              </p>
              {resetToken && (
                <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-200 text-xs text-center mt-3">
                  <span>پیوند مستقیم تغییر رمز (محیط آزمایشی): </span>
                  <Link to={`/reset-password?token=${resetToken}`} className="underline font-bold text-white block mt-1">
                    تغییر فوری رمز عبور
                  </Link>
                </div>
              )}
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-orange-300 font-semibold hover:text-orange-200 text-sm transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به صفحه ورود</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-200 text-sm font-medium">ایمیل حساب کاربری</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60 focus:ring-orange-400/30"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white border-0 shadow-gold-glow transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ارسال پیوند...
                  </>
                ) : (
                  "ارسال پیوند بازیابی"
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-200/70 hover:text-orange-300 transition-colors"
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
