'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import {
  BookOpen, Video, MessageCircle, User, ShieldCheck, Clock,
  Check, X, Loader2, Filter, Search, Trophy, Crown,
  ChevronRight, MoreHorizontal, Edit3, Trash2,
} from "lucide-react";
import { fa } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/design-tokens";

/**
 * Ayeh Media Plus — Moderation Dashboard
 *
 * Religious content supervisor interface for reviewing, approving,
 * tagging, or rejecting incoming Quranic videos, comments, entries,
 * and user reports.
 */

const QUEUE_TYPES = [
  { key: "all", label: "همه", icon: ShieldCheck },
  { key: "video", label: "ویدیوها", icon: Video },
  { key: "entry", label: "آثار مسابقه", icon: Trophy },
  { key: "comment", label: "نظرات", icon: MessageCircle },
  { key: "report", label: "گزارش‌ها", icon: User },
];

export default function ModerationDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionModal, setActionModal] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [filterType, filterStatus]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.entities.ModerationAction.filter(
        {},
        "-created_date",
        50
      );
      // In a real implementation, this would be a dedicated moderation queue endpoint
      // For now, we fetch pending items from each model
      const [videos, entries, comments, reports] = await Promise.all([
        api.entities.Video.filter({ status: "pending_review" }, "-created_date", 20).catch(() => []),
        api.entities.CompetitionEntry.filter({ status: "pending_review" }, "-created_date", 20).catch(() => []),
        api.entities.Comment.filter({ status: "pending_review" }, "-created_date", 20).catch(() => []),
        api.entities.Report.filter({ status: "pending" }, "-created_date", 20).catch(() => []),
      ]);

      const combined = [
        ...videos.map((v) => ({ ...v, target_type: "video" })),
        ...entries.map((e) => ({ ...e, target_type: "entry" })),
        ...comments.map((c) => ({ ...c, target_type: "comment" })),
        ...reports.map((r) => ({ ...r, target_type: "report" })),
      ].sort((a, b) => new Date(b.created_date || b.reviewed_at || 0) - new Date(a.created_date || a.reviewed_at || 0));

      setQueue(combined);
      setTotal(combined.length);
      setLoading(false);
    } catch (err) {
      toast.error("خطا در بارگذاری صف بررسی");
      setLoading(false);
    }
  };

  const handleAction = async (action, reason) => {
    if (!selectedItem) return;
    try {
      await api.entities.ModerationAction.create({
        target_type: selectedItem.target_type,
        target_id: selectedItem.id,
        action,
        reason: reason || "",
        actor_id: user?.id,
        actor_name: user?.full_name || "مدیر",
      });

      // Update target status
      switch (selectedItem.target_type) {
        case "video":
          await api.entities.Video.update(selectedItem.id, {
            status: action === "approve" ? "verified" : action === "reject" ? "rejected" : "archived",
            rejection_reason: action === "reject" ? reason : undefined,
          });
          break;
        case "entry":
          await api.entities.CompetitionEntry.update(selectedItem.id, {
            status: action === "approve" ? "verified" : action === "reject" ? "rejected" : "disqualified",
            rejection_reason: action === "reject" ? reason : undefined,
          });
          break;
        case "comment":
          await api.entities.Comment.update(selectedItem.id, {
            status: action === "approve" ? "published" : action === "reject" ? "hidden" : "removed",
          });
          break;
      }

      toast.success(`عملیات ${action} با موفقیت انجام شد`);
      setActionModal(false);
      setSelectedItem(null);
      loadQueue();
    } catch (err) {
      toast.error("خطا در انجام عملیات");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-muted-foreground font-doran">در حال بارگذاری صف بررسی...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-doran">
      <div className="container-quranic py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-foreground mb-1">صف بررسی محتوا</h1>
            <p className="text-sm text-muted-foreground">
              بررسی، تایید یا رد محتوای ارسالی توسط کاربران و تولیدکنندگان
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/moderation/reports")}
              className="px-4 py-2 rounded-xl bg-transparent text-muted-foreground hover:bg-muted border border-border font-medium text-sm transition-colors"
            >
              <User className="h-4 w-4 mr-2" /> گزارش‌ها
            </button>
            <button
              onClick={() => navigate("/moderation/audit-log")}
              className="px-4 py-2 rounded-xl bg-transparent text-muted-foreground hover:bg-muted border border-border font-medium text-sm transition-colors"
            >
              <ShieldCheck className="h-4 w-4 mr-2" /> گزارش‌های فعالیت
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="rounded-2xl border border-border bg-card p-1 mb-8 shadow-sm">
          <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
            {QUEUE_TYPES.map((qt) => (
              <button
                key={qt.key}
                onClick={() => setFilterType(qt.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === qt.key
                    ? "bg-emerald-600 text-white shadow-emerald-glow"
                    : "bg-transparent text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <qt.icon className="h-3.5 w-3.5" />
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Queue List */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-6 py-4 text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider">محتوای</th>
                <th className="px-6 py-4 text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider">فرستنده</th>
                <th className="px-6 py-4 text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider">نوع</th>
                <th className="px-6 py-4 text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider">تاریخ</th>
                <th className="px-6 py-4 text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider text-right">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {queue.length > 0 ? (
                queue.map((item) => {
                  const statusCfg = STATUS_COLORS[item.status || item.status || "pending_review"];
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground/60">
                            {item.target_type === "video" ? <Video className="h-5 w-5" /> : item.target_type === "entry" ? <Trophy className="h-5 w-5" /> : item.target_type === "comment" ? <MessageCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="font-rokh-bold font-semibold text-sm text-foreground truncate max-w-[200px]">
                              {item.title || item.content || item.message || "بدون عنوان"}
                            </div>
                            {item.competition_title && (
                              <div className="text-xs text-muted-foreground">{item.competition_title}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center text-xs font-bold">
                            {(item.author_name || item.submitted_by || item.reporter_name || "ناشناس").charAt(0)}
                          </div>
                          <span className="text-sm font-ui text-foreground">{item.author_name || item.submitted_by || item.reporter_name || "ناشناس"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                          statusCfg?.bg && statusCfg?.text
                            ? `${statusCfg.bg.replace("bg-", "")} ${statusCfg.text.replace("text-", "")} border border-emerald-200`
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {statusCfg?.label || "در انتظار بررسی"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-ui">
                        {new Date(item.created_date || item.reviewed_at || 0).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedItem(item); setActionModal(true); }}
                          className="p-2 text-muted-foreground hover:text-emerald-600 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-2">هیچ آیتمی برای بررسی وجود ندارد</h3>
                    <p className="text-muted-foreground">صف بررسی خالی است. همه محتواها بررسی شده‌اند.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActionModal(false)}>
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-rokh-bold font-bold text-lg text-foreground">عملیات بررسی</h3>
              <button onClick={() => setActionModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {selectedItem.title || selectedItem.content || selectedItem.message}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleAction("approve", "محتوای مناسبی برای منتشرسازی است")}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <Check className="h-4 w-4 mr-2" /> تایید و انتشار
              </button>
              <button
                onClick={() => handleAction("reject", "محتوای مناسبی نیست")}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4 mr-2" /> رد و عدم انتشار
              </button>
              <button
                onClick={() => handleAction("hide", "محتوا مخفی شد")}
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
              >
                <Clock className="h-4 w-4 mr-2" /> مخفی کردن موقت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
