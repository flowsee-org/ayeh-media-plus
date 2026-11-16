'use client';
import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/design-system/BrandLogo";

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
      <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <BrandLogo variant="inline" />
          </div>
          <div className="bg-card rounded border border-border shadow-sm p-6 sm:p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-amber-500/10 text-amber-600 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-rokh-bold font-bold text-foreground mb-2">پیوند نامعتبر است</h1>
            <p className="text-muted-foreground text-sm mb-6 font-editorial">
              این پیوند بازیابی فاقد شناسه امنیتی لازم است یا منقضی شده است.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
            >
              درخواست مجدد پیوند بازیابی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="inline" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-rokh-bold font-bold text-foreground">تنظیم رمز عبور جدید</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
            رمز عبور جدید حساب خود را وارد کنید
          </p>
        </div>

        <div className="bg-card rounded border border-border shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center text-primary mb-2">
                <CheckCircle className="w-12 h-12" />
              </div>
              <p className="text-foreground font-medium text-sm font-doran">رمز عبور با موفقیت به‌روزرسانی شد.</p>
              <p className="text-muted-foreground text-xs">در حال هدایت به صفحه ورود...</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>ورود فوری</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور جدید</Label>
                <div className="relative">
                  <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    autoFocus
                    placeholder="حداقل ۶ کاراکتر"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pe-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">تکرار رمز عبور جدید</Label>
                <div className="relative">
                  <Lock className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type="password"
                    dir="ltr"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pe-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ms-2 animate-spin" />
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
