'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import {
  Video, Play, Eye, ThumbsUp, Share2, Clock, BarChart3,
  Upload, Edit3, Trash2, VideoIcon as VideoIconLucide,
} from "lucide-react";
import { fa } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_CONFIG = {
  pending_review: { label: "در انتظار بررسی", variant: "warning" },
  verified: { label: "تایید شده", variant: "success" },
  published: { label: "منتشر شده", variant: "success" },
  rejected: { label: "رد شده", variant: "destructive" },
  archived: { label: "بایگانی شده", variant: "secondary" },
};

export default function CreatorDashboard() {
  const router = useRouter();
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
    router.push("/upload");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
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
          <Button
            onClick={handleUpload}
            variant="primary"
            size="sm"
          >
            <Upload className="h-4 w-4" /> بارگذاری محتوای جدید
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "کل ویدیوها", value: fa(stats?.total_videos || 0), icon: Video },
            { label: "بازدیدها", value: fa(stats?.total_views || 0), icon: Eye },
            { label: "لایک‌ها", value: fa(stats?.total_likes || 0), icon: ThumbsUp },
            { label: "در انتظار بررسی", value: fa(stats?.pending || 0), icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className="rounded border border-border bg-card shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded flex items-center justify-center bg-muted/50 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-rokh-bold font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground font-ui">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <div className="flex gap-1 mb-6">
            <TabsList className="gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all shrink-0 border"
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? "" : "text-muted-foreground"}`} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="rounded border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-rokh-bold font-bold text-lg">عملکرد محتوا</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
              <Card className="rounded border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="font-rokh-bold font-bold text-lg">پربازدیدترین‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...videos]
                      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
                      .slice(0, 5)
                      .map((v) => (
                        <Button
                          key={v.id}
                          variant="ghost"
                          onClick={() => router.push(`/watch/${v.id}`)}
                          className="w-full text-right justify-between gap-3 text-sm hover:bg-muted/30 rounded px-2 py-2 transition-colors"
                        >
                          <span className="truncate font-medium">{v.title}</span>
                          <span className="shrink-0 text-muted-foreground font-ui">{fa(v.views_count || 0)}</span>
                        </Button>
                      ))}
                    {videos.length === 0 && (
                      <p className="text-sm text-muted-foreground">هنوز داده‌ای برای آنالیز وجود ندارد.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos tab */}
          <TabsContent value="videos" className="mt-6">
            <div className="rounded border border-border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeader className="w-1/3">عنوان</TableHeader>
                    <TableHeader className="w-1/6">دسته‌بندی</TableHeader>
                    <TableHeader className="w-1/6">بازدید</TableHeader>
                    <TableHeader className="w-1/6">وضعیت</TableHeader>
                    <TableHeader className="w-1/6 text-left">عملیات</TableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.length > 0 ? (
                    videos.map((video) => (
                      <TableRow key={video.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded bg-gradient-to-br from-emerald-900/30 to-emerald-900/50 overflow-hidden">
                              {video.thumbnail_url ? (
                                <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-emerald-400">
                                  <VideoIconLucide className="h-6 w-6" />
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
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-xs text-muted-foreground">{video.category}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className="text-sm font-medium text-muted-foreground">{fa(video.views_count || 0)}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={STATUS_CONFIG[video.status]?.variant || "secondary"} size="sm">
                            {STATUS_CONFIG[video.status]?.label || video.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-left">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/watch/${video.id}`)} title="مشاهده">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/edit-video/${video.id}`)} title="ویرایش">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(video.id)} title="حذف">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <h3 className="font-rokh-bold font-bold text-lg text-foreground mb-2">هنوز محتوایی آپلود نکرده‌اید</h3>
                          <p className="text-sm text-muted-foreground mb-6">محتوای قرآنی خود را بارگذاری کنید و با جامعه به اشتراک بگذارید.</p>
                          <Button variant="primary" onClick={handleUpload} className="w-auto">
                            بارگذاری محتوای جدید
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
