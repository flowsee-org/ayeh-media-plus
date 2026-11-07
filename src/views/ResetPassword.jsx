'use client';
import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { IslamicStar } from "@/components/IslamicOrnaments";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }
    if (newPassword.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword({ resetToken, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "پیوند بازیابی رمز عبور نامعتبر است یا منقضی شده است");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1b4d] via-[#1a2a6c] to-[#0d1540] px-4" dir="rtl">
        <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
        <div className="relative w-full max-w-md z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 shadow-blue-glow mb-4 border border-orange-400/30">
            <AlertTriangle className="w-8 h-8 text-orange-200" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">پیوند نامعتبر است</h1>
          <p className="text-blue-200/70 text-sm mb-6">این پیوند بازیابی فاقد شناسه امنیتی لازم است یا منقضی شده است.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm shadow-gold-glow transition-all"
          >
            درخواست مجدد پیوند بازیابی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#041a14] via-[#063326] to-[#02130e] px-4" dir="rtl">
      <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-950 shadow-emerald-glow mb-4 border border-amber-400/40">
            <Lock className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">تنظیم رمز عبور جدید</h1>
          <p className="text-blue-200/70 mt-2 text-sm">رمز عبور جدید حساب خود را وارد کنید</p>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-premium">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-400/40" />
            <IslamicStar size={14} className="text-orange-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-400/40" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-emerald-400 mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>
              <p className="text-white font-medium text-sm">رمز عبور با موفقیت به‌روزرسانی شد.</p>
              <p className="text-blue-200/70 text-xs">در حال هدایت به صفحه ورود...</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-orange-300 font-semibold hover:text-orange-200 text-sm transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>ورود فوری</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-200 text-sm font-medium">رمز عبور جدید</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" aria-hidden="true" />
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    autoFocus
                    placeholder="حداقل ۶ کاراکتر"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60 focus:ring-orange-400/30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-blue-200 text-sm font-medium">تکرار رمز عبور جدید</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" aria-hidden="true" />
                  <Input
                    id="confirm"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 h-12 bg-white/8 border-white/20 text-white placeholder:text-blue-200/40 focus:border-orange-400/60 focus:ring-orange-400/30"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white border-0 shadow-gold-glow transition-all mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  "تغییر و ثبت رمز عبور"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
