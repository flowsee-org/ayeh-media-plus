'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import {
  Video, Play, Eye, ThumbsUp, Share2, Clock, BarChart3,
  Upload, Crown, ShieldAlert, Trophy, Loader2, MoreVertical,
  Edit3, Trash2, Video as VideoIcon,
} from "lucide-react";
import { fa } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/design-tokens";

/**
 * Ayeh Media Plus — Creator Dashboard
 *
 * Dedicated dashboard for content creators / reciters / competition organizers
 * to manage their uploads, view analytics, and respond to comments.
 */

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      const userVideos = await api.videos
        .list({ mine: true, sort: "-created_date", limit: 50 })
        .catch(() => []);

      const list = Array.isArray(userVideos) ? userVideos : userVideos?.items || [];
      setVideos(list);
      setStats({
        total_videos: list.length,
        total_views: list.reduce((sum, v) => sum + (v.views_count || 0), 0),
        total_likes: list.reduce((sum, v) => sum + (v.likes_count || 0), 0),
        published: list.filter((v) => v.status === "published").length,
        pending: list.filter((v) => v.status === "pending_review").length,
      });
      setLoading(false);
    } catch (err) {
      toast.error("خطا در بارگذاری داشبورد");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این محتوا اطمینان دارید؟")) return;
    try {
      await api.videos.delete(id);
      toast.success("محتوا حذف شد");
      loadData();
    } catch (err) {
      toast.error("خطا در حذف محتوا");
    }
  };

  const handleUpload = () => {
    navigate("/upload");
  };

  const statusConfig = (status) => {
    const map = {
      pending_review: { label: "در انتظار بررسی", color: "bg-amber-500/10 text-amber-700 border border-amber-200" },
      verified: { label: "تایید شده", color: "bg-emerald-500/10 text-emerald-700 border border-emerald-200" },
      published: { label: "منتشر شده", color: "bg-emerald-500/10 text-emerald-700 border border-emerald-200" },
      rejected: { label: "رد شده", color: "bg-red-500/10 text-red-700 border border-red-200" },
      archived: { label: "بایگانی شده", color: "bg-slate-500/10 text-slate-700 border border-slate-200" },
    };
    return map[status] || map.pending_review;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-muted-foreground font-doran">در حال بارگذاری داشبورد...</p>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "بینش کلی", icon: BarChart3 },
    { key: "videos", label: "محتوای من", icon: Video },
    { key: "analytics", label: "آنالیтика", icon: Play },
  ];

  return (
    <div className="font-doran">
      <div className="page-shell">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-foreground mb-1">داشبورد تولیدکننده</h1>
            <p className="text-sm text-muted-foreground font-editorial">
              مدیریت محتوای خود، نمایش آنالیтика و پاسخ به نظرات
            </p>
          </div>
          <button
            onClick={handleUpload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-sm transition-all"
          >
            <Upload className="h-4 w-4" /> بارگذاری محتوای جدید
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "کل ویدیوها", value: fa(stats?.total_videos || 0), icon: Video, color: "text-emerald-600" },
            { label: "بازدیدها", value: fa(stats?.total_views || 0), icon: Eye, color: "text-blue-600" },
            { label: "لایک‌ها", value: fa(stats?.total_likes || 0), icon: ThumbsUp, color: "text-rose-600" },
            { label: "در انتظار بررسی", value: fa(stats?.pending || 0), icon: Clock, color: "text-amber-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded flex items-center justify-center ${stat.color} bg-${stat.color.replace("text-", "bg-").replace("600", "50")}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-rokh-bold font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-ui">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-emerald-600 text-white shadow-emerald-glow"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? "text-white" : "text-muted-foreground"}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analytics tab — measured from uploaded videos */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded border border-border bg-card p-6 shadow-sm">
              <h3 className="font-rokh-bold font-bold text-lg mb-4">عملکرد محتوا</h3>
              <div className="space-y-3">
                {[
                  { label: "میانگین بازدید", value: fa(stats?.total_videos ? Math.round((stats.total_views || 0) / stats.total_videos) : 0) },
                  { label: "نسبت لایک به بازدید", value: `${fa(stats?.total_views ? Math.round(((stats.total_likes || 0) / stats.total_views) * 100) : 0)}٪` },
                  { label: "منتشر شده", value: fa(stats?.published || 0) },
                  { label: "در انتظار بررسی", value: fa(stats?.pending || 0) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-ui font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-border bg-card p-6 shadow-sm">
              <h3 className="font-rokh-bold font-bold text-lg mb-4">پربازدیدترین‌ها</h3>
              <div className="space-y-3">
                {[...videos]
                  .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                  .slice(0, 5)
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/watch/${v.id}`)}
                      className="w-full text-right flex items-center justify-between gap-3 text-sm hover:bg-muted/30 rounded px-2 py-2 transition-colors"
                    >
                      <span className="truncate font-medium">{v.title}</span>
                      <span className="shrink-0 text-muted-foreground font-ui">{fa(v.views_count || 0)}</span>
                    </button>
                  ))}
                {videos.length === 0 && (
                  <p className="text-sm text-muted-foreground">هنوز داده‌ای برای آنالیز وجود ندارد.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content: Videos List (overview + videos tabs) */}
        {(activeTab === "overview" || activeTab === "videos") && (
          <div className="rounded border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-rokh-bold font-bold text-lg text-foreground">محتوای آپلود شده</h3>
              {videos.length === 0 && (
                <button onClick={handleUpload} className="text-sm text-emerald-600 hover:underline font-medium">
                  بارگذاری اولین محتوا
                </button>
              )}
            </div>
            <div className="divide-y divide-border/50">
              {videos.length > 0 ? (
                videos.map((video) => (
                  <div key={video.id} className="px-6 py-4 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-gradient-to-br from-emerald-900/30 to-emerald-900/50 overflow-hidden">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-400">
                            <VideoIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-rokh-bold font-semibold text-sm text-foreground truncate">{video.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{video.category}</span>
                          <span>•</span>
                          <span>{fa(video.views_count || 0)} بازدید</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${statusConfig(video.status).color}`}>
                        {statusConfig(video.status).label}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/watch/${video.id}`)}
                          className="p-2 text-muted-foreground hover:text-emerald-600 transition-colors"
                          title="مشاهده"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/edit-video/${video.id}`)}
                          className="p-2 text-muted-foreground hover:text-emerald-600 transition-colors"
                          title="ویرایش"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-2">هنوز محتوایی آپلود نکرده‌اید</h3>
                  <p className="text-sm text-muted-foreground mb-6">محتوای قرآنی خود را بارگذاری کنید و با جامعه به اشتراک بگذارید.</p>
                  <button onClick={handleUpload} className="px-5 py-2.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors">
                    بارگذاری محتوای جدید
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
