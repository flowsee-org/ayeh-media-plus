'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import {
  ShieldCheck, User, Video, Crown, Settings, Layout, BarChart3,
  Loader2, AlertCircle, Check, X, Edit3, Trash2, MoreVertical,
  Clock, Trophy, Users, BookOpen,
} from "lucide-react";
import { fa } from "@/lib/utils";

/**
 * Ayeh Media Plus — Admin Panel
 *
 * System administrator interface for user role management,
 * system configuration, feature toggles, and global oversight.
 */

const ADMIN_SECTIONS = [
  { key: "users", label: "مدیریت کاربران", icon: Users },
  { key: "content", label: "مدیریت محتوا", icon: Video },
  { key: "competitions", label: "مسابقات", icon: Trophy },
  { key: "config", label: "پیکربندی سیستم", icon: Settings },
  { key: "analytics", label: "آنالیтика سراسری", icon: BarChart3 },
  { key: "audit", label: "ثبت‌ورات عملکرد", icon: ShieldCheck },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModal, setRoleModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await api.entities.User.list("-created_date", 100).catch(() => []);
      setUsers(allUsers || []);
      setLoading(false);
    } catch (err) {
      toast.error("خطا در بارگذاری کاربران");
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.entities.User.update(userId, { role: newRole });
      toast.success("نقش کاربر با موفقیت تغییر کرد");
      setRoleModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      toast.error("خطا در تغییر نقش");
    }
  };

  const handleBan = async (userId, ban) => {
    try {
      await api.entities.User.update(userId, { is_banned: ban });
      toast.success(ban ? "کاربر مسدود شد" : "مسدودسازی برداشته شد");
      loadUsers();
    } catch (err) {
      toast.error("خطا در مسدودسازی");
    }
  };

  const roleLabels = {
    admin: "مدیر سیستم",
    moderator: "ناظر محتوا",
    creator: "تولیدکننده محتوا",
    user: "کاربر عادی",
    anonymous: "مهمان",
  };

  const roleColors = {
    admin: "bg-red-500/10 text-red-700 border border-red-200",
    moderator: "bg-amber-500/10 text-amber-700 border border-amber-200",
    creator: "bg-blue-500/10 text-blue-700 border border-blue-200",
    user: "bg-emerald-500/10 text-emerald-700 border border-emerald-200",
    anonymous: "bg-slate-500/10 text-slate-700 border border-slate-200",
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-muted-foreground font-doran">در حال بارگذاری پنل مدیریت...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-doran">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border hidden lg:flex flex-col z-20">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span className="font-rokh-bold font-bold text-lg text-foreground">مدیریت سیستم</span>
          </div>
          <p className="text-xs text-muted-foreground font-ui">
            سلام، {user?.full_name || "مدیر"}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_SECTIONS.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === section.key
                  ? "bg-emerald-600 text-white shadow-emerald-glow"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <section.icon className={`h-5 w-5 ${activeSection === section.key ? "text-white" : "text-muted-foreground"}`} />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <Layout className="h-5 w-5" /> بازگشت به سایت
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`lg:pl-80 p-4 sm:p-6 lg:p-8 min-h-screen`}>
        <header className="mb-8">
          <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-foreground mb-1">
            {ADMIN_SECTIONS.find((s) => s.key === activeSection)?.label}
          </h1>
          <p className="text-sm text-muted-foreground">کنترل و نظارت بر سیستم آیه پلاس</p>
        </header>

        {/* Users Section */}
        {activeSection === "users" && (
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-rokh-bold font-bold text-lg text-foreground">مدیریت کاربران</h3>
              <div className="relative">
                <input type="text" placeholder="جستجوی کاربر..." className="pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-64" />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-bold font-ui text-muted-foreground uppercase">کاربر</th>
                    <th className="px-6 py-4 text-left text-xs font-bold font-ui text-muted-foreground uppercase">نقش</th>
                    <th className="px-6 py-4 text-left text-xs font-bold font-ui text-muted-foreground uppercase">وضعیت</th>
                    <th className="px-6 py-4 text-left text-xs font-bold font-ui text-muted-foreground uppercase">تاریخ ثبت‌نام</th>
                    <th className="px-6 py-4 text-right text-xs font-bold font-ui text-muted-foreground uppercase">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted/20 flex items-center justify-center text-xs font-bold">
                            {u.full_name?.charAt(0) || "ن"}
                          </div>
                          <div>
                            <div className="font-rokh-bold font-semibold text-sm text-foreground">{u.full_name || "ناشناس"}</div>
                            <div className="text-xs text-muted-foreground">{u.email || u.phone || "بدون ایمیل/تلفن"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${roleColors[u.role || "user"]}`}>
                          {roleLabels[u.role || "user"]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                          u.is_banned ? "bg-red-500/10 text-red-700 border border-red-200" : "bg-emerald-500/10 text-emerald-700 border border-emerald-200"
                        }`}>
                          {u.is_banned ? "مسدود" : "فعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-ui">
                        {new Date(u.created_date || 0).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setSelectedUser(u); setRoleModal(true); }}
                            className="p-2 text-muted-foreground hover:text-emerald-600 transition-colors"
                            title="تغییر نقش"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleBan(u.id, !u.is_banned)}
                            className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                            title={u.is_banned ? " Entfernen مسدودسازی" : "مسدودسازی"}
                          >
                            {u.is_banned ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">هیچ کاربری یافت نشد.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other sections placeholders */}
        {activeSection === "content" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-4">مدیریت محتوا</h3>
            <p className="text-muted-foreground">مدیریت ویدیوها، تلاوت‌ها و مسابقاتReadAll</p>
          </div>
        )}
        {activeSection === "competitions" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-4">مدیریت مسابقات</h3>
            <p className="text-muted-foreground">ایجاد، ویرایش و نظارت بر مسابقات قرآنی</p>
          </div>
        )}
        {activeSection === "config" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-4">پیکربندی سیستم</h3>
            <p className="text-muted-foreground">تنظیمات عمومی، توگّه‌هاییِ ویژگی و پیکربندی کل سیستم</p>
          </div>
        )}
        {activeSection === "analytics" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-4">آنالیтика سراسری</h3>
            <p className="text-muted-foreground">آمار استفاده، بازدید و تعامل کاربران در کل پلتفرم</p>
          </div>
        )}
        {activeSection === "audit" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-4">ثبت‌ورات عملکرد</h3>
            <p className="text-muted-requires">بررسی لاگ‌های مدیریت و اقدامات ناظران</p>
          </div>
        )}

        {/* Role Change Modal */}
        {roleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRoleModal(false)}>
            <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-rokh-bold font-bold text-lg text-foreground">تغییر نقش کاربر</h3>
                <button onClick={() => setRoleModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{selectedUser.full_name}</p>
              <div className="space-y-3">
                {["admin", "moderator", "creator", "user"].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    className={`w-full py-3 rounded-xl text-left font-medium transition-all border ${
                      selectedUser.role === role
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-glow"
                        : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                    }`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
