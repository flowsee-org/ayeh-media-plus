'use client';
import React, { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, Phone } from "lucide-react";
import { IslamicStar } from "@/components/IslamicOrnaments";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();
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
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      navigate(returnTo || "/");
    } catch (err) {
      setError(err.message || "ایمیل یا رمز عبور اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#041a14] via-[#063326] to-[#02130e] px-4" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 pattern-islamic opacity-15 pointer-events-none" />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-950 shadow-emerald-glow mb-4 border border-amber-400/40">
            <LogIn className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">خوش آمدید</h1>
          <p className="text-blue-200/70 mt-2 text-sm">به آیه پلاس بپیوندید، تدبّر را تجربه کنید</p>
        </div>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-xl rounded-3xl border border-white/15 p-8 shadow-premium">
          {/* Star divider */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-400/40" />
            <IslamicStar size={14} className="text-orange-400" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-400/40" />
          </div>

          {/* Quick Phone + Numerical Captcha OTP Login Button */}
          <button
            type="button"
            onClick={() => openAuthModal(() => { navigate("/"); })}
            className="w-full mb-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            <Phone className="w-4 h-4 text-orange-400" />
            <span>ورود سریع با شماره همراه</span>
          </button>

          <div className="flex items-center gap-2 mb-5">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[11px] text-blue-200/50">یا با ایمیل و رمز عبور</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-200 text-sm font-medium">ایمیل</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-xs text-orange-300 hover:text-orange-200 transition-colors">
                  فراموشی رمز عبور؟
                </Link>
                <Label htmlFor="password" className="text-blue-200 text-sm font-medium">رمز عبور</Label>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  در حال ورود...
                </>
              ) : (
                "ورود به آیه پلاس"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-blue-200/60 mt-6">
            حساب ندارید؟{" "}
            <Link to="/register" className="text-orange-300 font-semibold hover:text-orange-200 transition-colors">
              همین الان بسازید
            </Link>
          </p>
        </div>

        {/* Quranic verse */}
        <p className="text-center font-arabic text-blue-300/50 text-sm mt-6" dir="rtl" lang="ar">
          وَاللَّهُ يَهْدِي مَنْ يَشَاءُ إِلَى صِرَاطٍ مُسْتَقِيمٍ
        </p>
      </div>
    </div>
  );
}
