'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { usePermissions } from "@/lib/usePermissions";
import { toast } from "react-hot-toast";
import {
  ShieldCheck, Video, Settings, Layout, BarChart3,
  Loader2, AlertCircle, Check, X, Edit3,
  Trophy, Users, ExternalLink, Eye, ThumbsUp, MessageSquare,
  Lock, ShieldAlert,
} from "lucide-react";
import { fa } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Ayeh Media Plus — Admin Panel
 * Real data-backed admin sections (no placeholder stubs).
 */

const ADMIN_SECTIONS = [
  { key: "users", label: "مدیریت کاربران", icon: Users },
  { key: "content", label: "مدیریت محتوا", icon: Video },
  { key: "competitions", label: "مسابقات", icon: Trophy },
  { key: "config", label: "پیکربندی سیستم", icon: Settings },
  { key: "analytics", label: "آنالیтика سراسری", icon: BarChart3 },
  { key: "audit", label: "ثبت‌ورات عملکرد", icon: ShieldCheck },
];

const CONFIG_KEY = "ayeh-admin-feature-flags";

const DEFAULT_FLAGS = {
  uploads_enabled: true,
  comments_enabled: true,
  live_enabled: true,
  registration_enabled: true,
  maintenance_mode: false,
};

function loadFlags() {
  if (typeof window === "undefined") return DEFAULT_FLAGS;
  try {
    return { ...DEFAULT_FLAGS, ...(JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}) };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export default function AdminPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [activeSection, setActiveSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModal, setRoleModal] = useState(false);
  const [roleConfirmModal, setRoleConfirmModal] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  const canManageRoles = can(PERMISSIONS.USER_ROLE_ASSIGN);

  useEffect(() => {
    setFlags(loadFlags());
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeSection === "content") loadVideos();
    if (activeSection === "competitions") loadCompetitions();
    if (activeSection === "analytics") loadStats();
    if (activeSection === "audit") loadAudit();
  }, [activeSection]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await api.entities.User.list("-created_date", 200).catch(() => []);
      setUsers(allUsers || []);
    } catch {
      toast.error("خطا در بارگذاری کاربران");
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setSectionLoading(true);
      const res = await api.entities.Video.list("-created_date", 100).catch(() => []);
      setVideos(res || []);
    } catch {
      toast.error("خطا در بارگذاری محتوا");
    } finally {
      setSectionLoading(false);
    }
  };

  const loadCompetitions = async () => {
    try {
      setSectionLoading(true);
      const res = await api.entities.Competition.list("-created_date", 50).catch(() => []);
      setCompetitions(res || []);
    } catch {
      toast.error("خطا در بارگذاری مسابقات");
    } finally {
      setSectionLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setSectionLoading(true);
      const [u, v, c, l, b, f, p] = await Promise.all([
        api.entities.User.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Video.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Comment.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Like.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Bookmark.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Follow.list("-created_date", 1).catch(() => ({ total: 0 })),
        api.entities.Post.list("-created_date", 1).catch(() => ({ total: 0 })),
      ]);
      const allVideos = await api.entities.Video.list("-views_count", 100).catch(() => []);
      const totalViews = (allVideos || []).reduce((sum, item) => sum + (item.views_count || 0), 0);
      setStats({
        users: u.total ?? (u.length || 0),
        videos: v.total ?? (v.length || 0),
        comments: c.total ?? (c.length || 0),
        likes: l.total ?? (l.length || 0),
        bookmarks: b.total ?? (b.length || 0),
        follows: f.total ?? (f.length || 0),
        posts: p.total ?? (p.length || 0),
        totalViews,
        topVideos: (allVideos || []).slice(0, 8),
      });
    } catch {
      toast.error("خطا در بارگذاری آمار");
    } finally {
      setSectionLoading(false);
    }
  };

  const loadAudit = async () => {
    try {
      setSectionLoading(true);
      const token = api.auth.getToken();
      const res = await fetch("/api/moderation/audit-log", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("audit failed");
      const data = await res.json();
      setAuditLog(data.items || data || []);
    } catch {
      // Fall back to moderation actions entity if dedicated route empty/unavailable
      try {
        const actions = await api.entities.ModerationAction.list("-created_date", 50).catch(() => []);
        setAuditLog(actions || []);
      } catch {
        toast.error("خطا در بارگذاری لاگ");
      }
    } finally {
      setSectionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find((u) => u.id === userId);

    // Safety: cannot demote yourself
    if (userId === user?.id) {
      toast.error("نمی‌توانید نقش خود را تغییر دهید");
      return;
    }

    // Safety: cannot remove the last admin
    if (newRole !== 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (targetUser?.role === 'admin' && adminCount <= 1) {
        toast.error("نمی‌توانید آخرین مدیر سیستم را داون‌گراد کنید");
        return;
      }
    }

    // Safety: cannot assign admin unless you are admin
    if (newRole === 'admin' && user?.role !== 'admin') {
      toast.error("فقط مدیر سیستم می‌تواند نقش مدیر تخصیص دهد");
      return;
    }

    setPendingRoleChange({ userId, newRole });
    setRoleModal(false);
    setRoleConfirmModal(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    try {
      await api.entities.User.update(pendingRoleChange.userId, { role: pendingRoleChange.newRole });
      toast.success("نقش کاربر با موفقیت تغییر کرد");
      setPendingRoleChange(null);
      setRoleConfirmModal(false);
      loadUsers();
    } catch {
      toast.error("خطا در تغییر نقش");
      setRoleConfirmModal(false);
    }
  };

  const handleBan = async (userId, ban) => {
    try {
      await api.entities.User.update(userId, { is_banned: ban });
      toast.success(ban ? "کاربر مسدود شد" : "مسدودسازی برداشته شد");
      loadUsers();
    } catch {
      toast.error("خطا در مسدودسازی");
    }
  };

  const handleVideoStatus = async (videoId, status) => {
    try {
      await api.entities.Video.update(videoId, { status });
      toast.success(status === "published" ? "ویدیو منتشر شد" : `وضعیت به ${status} تغییر کرد`);
      loadVideos();
    } catch {
      toast.error("خطا در به‌روزرسانی ویدیو");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm("حذف این ویدیو قطعی است. ادامه می‌دهید؟")) return;
    try {
      await api.entities.Video.delete(videoId);
      toast.success("ویدیو حذف شد");
      loadVideos();
    } catch {
      toast.error("خطا در حذف ویدیو");
    }
  };

  const saveFlags = (next) => {
    setFlags(next);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    toast.success("تنظیمات ذخیره شد (محلی — برای استقرار چندنمونه‌ای باید به سرور منتقل شود)");
  };

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.full_name, u.email, u.phone, u.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, userQuery]);

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
    <div className="min-h-screen bg-background font-doran" dir="rtl">
      <aside className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border hidden lg:flex flex-col z-20">
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
          <Tabs defaultValue={activeSection} onValueChange={setActiveSection}>
            <TabsList className="flex-col space-y-1">
              {ADMIN_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.key}
                  value={section.key}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all shrink-0 border ${activeSection === section.key ? "bg-emerald-600 text-white border-emerald-600" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"}`}
                >
                  <section.icon className={`h-5 w-5 ${activeSection === section.key ? "text-white" : "text-muted-foreground"}`} />
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-3"
          >
            <Layout className="h-5 w-5" /> بازگشت به سایت
          </Button>
        </div>
      </aside>

      <div className="lg:pr-80 p-4 sm:p-6 lg:p-8 min-h-screen">
        <header className="mb-8">
          <div className="flex gap-2 overflow-x-auto lg:hidden mb-4">
            <Tabs defaultValue={activeSection} onValueChange={setActiveSection}>
              <TabsList className="space-y-1">
                {ADMIN_SECTIONS.map((section) => (
                  <TabsTrigger
                    key={section.key}
                    value={section.key}
                    className="shrink-0 px-3 py-2 rounded text-xs font-bold border transition-all"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-foreground mb-1">
            {ADMIN_SECTIONS.find((s) => s.key === activeSection)?.label}
          </h1>
          <p className="text-sm text-muted-foreground">کنترل و نظارت بر سیستم آیه پلاس</p>
        </header>

        {activeSection === "users" && (
          <Card className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/50 flex items-center justify-between gap-3">
              <CardTitle className="font-rokh-bold font-bold text-lg text-foreground">مدیریت کاربران</CardTitle>
              <Input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="جستجوی کاربر..."
                className="w-48 sm:w-64"
              />
            </CardHeader>
            <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 bg-muted/30">
                  <TableHead className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">کاربر</TableHead>
                  <TableHead className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">نقش</TableHead>
                  <TableHead className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">وضعیت</TableHead>
                  <TableHead className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">تاریخ ثبت‌نام</TableHead>
                  <TableHead className="px-6 py-4 text-left text-xs font-bold text-muted-foreground">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center text-xs font-bold">
                          {u.full_name?.charAt(0) || "ن"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{u.full_name || "ناشناس"}</div>
                          <div className="text-xs text-muted-foreground">{u.email || u.phone || "بدون ایمیل/تلفن"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="px-2 py-1 text-xs font-bold border">
                        {roleLabels[u.role || "user"]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant={u.is_banned ? "destructive" : "secondary"}
                        className={`px-2 py-1 text-xs font-bold border ${u.is_banned ? "border-red-200" : "border-emerald-200"}`}
                      >
                        {u.is_banned ? "مسدود" : "فعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(u.created_date || 0).toLocaleDateString("fa-IR")}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left">
                      <div className="flex gap-1 justify-end">
                        {canManageRoles && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(u); setRoleModal(true); }}
                            className="p-2 text-muted-foreground hover:text-emerald-600"
                            title="تغییر نقش"
                            disabled={u.id === user?.id}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBan(u.id, !u.is_banned)}
                          className="p-2 text-muted-foreground hover:text-red-600"
                          title={u.is_banned ? "رفع مسدودسازی" : "مسدودسازی"}
                        >
                          {u.is_banned ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      هیچ کاربری یافت نشد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        {activeSection === "content" && (
          <Card className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <CardTitle className="font-rokh-bold font-bold text-lg">ویدیوها و محتوا</CardTitle>
              <Link href="/moderation" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                صف بررسی <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
            {sectionLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <div className="divide-y divide-border/50">
                {videos.map((v) => (
                  <div key={v.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm line-clamp-1">{v.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                        <span>{v.category || "—"}</span>
                        <span>·</span>
                        <span>{v.status}</span>
                        <span>·</span>
                        <span>{fa(v.views_count || 0)} بازدید</span>
                        <span>·</span>
                        <span className="truncate max-w-[240px]">{v.media_url}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={`/watch/${v.id}`} className="px-3 py-1.5 rounded border text-xs font-bold hover:bg-muted">مشاهده</Link>
                      <Link href={`/edit-video/${v.id}`} className="px-3 py-1.5 rounded border text-xs font-bold hover:bg-muted">ویرایش</Link>
                      {v.status !== "published" && (
                        <Button variant="secondary" size="sm" onClick={() => handleVideoStatus(v.id, "published")}>
                          انتشار
                        </Button>
                      )}
                      {v.status !== "rejected" && (
                        <Button variant="outline" size="sm" onClick={() => handleVideoStatus(v.id, "rejected")}>
                          رد
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteVideo(v.id)}>
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
                {videos.length === 0 && <div className="p-10 text-center text-muted-foreground">محتوایی ثبت نشده است.</div>}
              </div>
            )}
          </CardContent>
      </Card>
        )}

        {activeSection === "competitions" && (
          <Card className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <CardTitle className="font-rokh-bold font-bold text-lg">مسابقات</CardTitle>
              <Link href="/competitions" className="text-sm text-primary hover:underline">صفحه عمومی</Link>
            </CardHeader>
            <CardContent>
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <div className="divide-y divide-border/50">
                {competitions.map((c) => (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c.status || "—"} · {c.year || c.competition_year || "—"}
                      </div>
                    </div>
                    <Link href={`/competitions/${c.id}`} className="px-3 py-1.5 rounded border text-xs font-bold hover:bg-muted">جزئیات</Link>
                  </div>
                ))}
                {competitions.length === 0 && <div className="p-10 text-center text-muted-foreground">مسابقه‌ای ثبت نشده است.</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "config" && (
          <Card className="rounded border border-border bg-card p-6 shadow-sm space-y-4">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                پرچم‌های ویژگی در این مرورگر ذخیره می‌شوند و برای استقرار چندسروره باید به تنظیمات سرور منتقل شوند. مقادیر جعلی نمایش داده نمی‌شود.
              </p>
              {Object.entries(flags).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded border border-border px-4 py-3">
                  <span className="text-sm font-medium">{key}</span>
                  <Checkbox
                    checked={!!value}
                    onCheckedChange={(v) => saveFlags({ ...flags, [key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeSection === "analytics" && (
          <div className="space-y-4">
            {sectionLoading || !stats ? (
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "کاربران", value: stats.users, icon: Users },
                    { label: "ویدیوها", value: stats.videos, icon: Video },
                    { label: "بازدید کل", value: stats.totalViews, icon: Eye },
                    { label: "لایک‌ها", value: stats.likes, icon: ThumbsUp },
                    { label: "نظرات", value: stats.comments, icon: MessageSquare },
                    { label: "نشان‌ها", value: stats.bookmarks, icon: Check },
                    { label: "دنبال‌کردن‌ها", value: stats.follows, icon: Users },
                    { label: "پست‌ها", value: stats.posts, icon: Layout },
                  ].map((card) => (
                    <Card key={card.label} className="rounded border border-border bg-card p-4">
                      <CardContent className="p-0 pt-3">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                          <card.icon className="h-4 w-4" />
                          {card.label}
                        </div>
                        <div className="text-2xl font-bold font-rokh-bold">{fa(card.value || 0)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card className="rounded border border-border bg-card overflow-hidden">
                  <CardHeader className="px-6 py-4 border-b border-border/50 font-bold">
                    پربازدیدترین ویدیوها (داده واقعی)
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {stats.topVideos.map((v) => (
                        <div key={v.id} className="px-6 py-3 flex items-center justify-between gap-3 text-sm">
                          <span className="line-clamp-1">{v.title}</span>
                          <span className="text-muted-foreground shrink-0">{fa(v.views_count || 0)} بازدید</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeSection === "audit" && (
          <div className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 font-bold">لاگ اقدامات مدیریتی / نظارت</div>
            {sectionLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
            ) : (
              <div className="divide-y divide-border/50">
                {auditLog.map((row, idx) => (
                  <div key={row.id || idx} className="px-6 py-4 text-sm">
                    <div className="font-semibold">{row.action || row.type || row.title || "اقدام"}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {row.target_type || row.entity || "—"} {row.target_id || row.entity_id || ""}
                      {" · "}
                      {row.actor_name || row.moderator_name || row.user_id || "سیستم"}
                      {" · "}
                      {row.created_date || row.created_at
                        ? new Date(row.created_date || row.created_at).toLocaleString("fa-IR")
                        : "—"}
                    </div>
                  </div>
                ))}
                {auditLog.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground">هنوز اقدامی ثبت نشده است.</div>
                )}
              </div>
            )}
          </div>
        )}

        {roleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRoleModal(false)}>
            <div className="relative w-full max-w-md rounded border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-rokh-bold font-bold text-lg text-foreground">تغییر نقش کاربر</h3>
                <Button onClick={() => setRoleModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{selectedUser.full_name}</p>
              <p className="text-xs text-muted-foreground mb-4">نقش فعلی: {roleLabels[selectedUser.role || "user"]}</p>
              <div className="space-y-3">
                {["admin", "moderator", "creator", "user"].map((role) => (
                  <Button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    className={`w-full py-3 rounded text-right font-medium transition-all border ${
                      selectedUser.role === role
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                    }` +
                    (selectedUser.id === user?.id ? " opacity-50 cursor-not-allowed" : "")}
                    disabled={selectedUser.id === user?.id}
                  >
                    {roleLabels[role]}
                    {selectedUser.id === user?.id && <span className="ml-2 text-xs">(شما)</span>}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {roleConfirmModal && pendingRoleChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRoleConfirmModal(false)}>
            <div className="relative w-full max-w-md rounded border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-rokh-bold font-bold text-lg text-foreground">تأیید تغییر نقش</h3>
                <Button onClick={() => setRoleConfirmModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">آیا از تغییر نقش به <span className="font-bold">{roleLabels[pendingRoleChange.newRole]}</span> مطمئن هستید؟</p>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setRoleConfirmModal(false)}
                    className="px-6 py-2.5 rounded border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={confirmRoleChange}
                    className="px-6 py-2.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-emerald-glow"
                  >
                    تایید و ذخیره
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
