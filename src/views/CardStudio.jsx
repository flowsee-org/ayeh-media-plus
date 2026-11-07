'use client';
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Download,
  Share2,
  Copy,
  Send,
  Sparkles,
  Smartphone,
  Square,
  Monitor,
  Palette,
  Type,
  User,
  Upload,
  ArrowRight,
  Loader2,
  Search,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { PRESETS, serializeAvatar } from "@/lib/avatars";
import {
  CARD_FORMATS,
  CARD_THEMES,
  MOSQUE_BACKGROUNDS,
  ARABIC_FONTS,
  PERSIAN_FONTS,
  buildVerseCardSvg,
  svgToDataUrl,
  svgToPngBlob,
  copyImageToClipboard,
  shareVerseCardNative,
} from "@/lib/verseCard";

// Popular Curated Verses Preset
const CURATED_VERSES = [
  {
    key: "24:35",
    surahName: "سوره نور",
    arabic: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ کَمِشْکَاةٍ فِیهَا مِصْبَاحٌ",
    translation: "خداوند نور آسمان‌ها و زمین است؛ مثل نور خداوند همانند چراغدانی است که در آن چراغی پرفروغ باشد...",
    translator: "ترجمه استاد مکارم شیرازی",
  },
  {
    key: "2:255",
    surahName: "سوره بقره (آیت الکرسی)",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَیُّ الْقَیُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    translation: "خداوند یگانه‌ای است که معبودی جز او نیست؛ زنده و برپادارنده جهان است؛ هیچ‌گاه خواب و چرت او را فرا نمی‌گیرد...",
    translator: "ترجمه استاد انصاریان",
  },
  {
    key: "13:28",
    surahName: "سوره رعد",
    arabic: "الَّذِینَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِکْرِ اللَّهِ ۗ أَلَا بِذِکْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    translation: "آنان که ایمان آورده‌اند و دل‌هایشان به یاد خدا آرام می‌گیرد؛ آگاه باشید تنها با یاد خدا دل‌ها آرامش می‌یابد.",
    translator: "ترجمه استاد بهرام‌پور",
  },
  {
    key: "65:3",
    surahName: "سوره طلاق",
    arabic: "وَمَن یَتَوَکَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ",
    translation: "و هر کس بر خداوند توکل کند، خدا او را بس است و امر خویش را به انجام می‌رساند.",
    translator: "ترجمه استاد مکارم شیرازی",
  },
  {
    key: "14:7",
    surahName: "سوره ابراهیم",
    arabic: "لَئِن شَکَرْتُمْ لَأَزِیدَنَّکُمْ ۖ وَلَئِن کَفَرْتُمْ إِنَّ عَذَابِی لَشَدِیدٌ",
    translation: "اگر شکرگزاری کنید، بی‌گمان بر شما خواهم افزود و اگر ناسپاسی کنید مجازاتم سخت خواهد بود.",
    translator: "ترجمه استاد انصاریان",
  },
  {
    key: "94:5",
    surahName: "سوره انشراح",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ یُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ یُسْرًا",
    translation: "پس قطعا با هر سختی آسانی و گشایشی همراه است؛ آری مسلماً همراه با هر سختی گشایش است.",
    translator: "ترجمه استاد خرمشاهی",
  },
];

export default function CardStudio() {
  const { user, openAuthModal } = useAuth();
  const [params] = useSearchParams();

  // Selected format and styling
  const [formatId, setFormatId] = useState("story"); // 'story' | 'square' | 'landscape'
  const [themeId, setThemeId] = useState("royal_green");
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [backgroundDim, setBackgroundDim] = useState(0.55);
  const [arabicFontId, setArabicFontId] = useState("amiri");
  const [persianFontId, setPersianFontId] = useState("peyda");
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showBismillah, setShowBismillah] = useState(true);
  const [characterId, setCharacterId] = useState(PRESETS[0].id);

  // Verse content state
  const [verseKey, setVerseKey] = useState("24:35");
  const [surahName, setSurahName] = useState("سوره نور");
  const [arabic, setArabic] = useState(CURATED_VERSES[0].arabic);
  const [translation, setTranslation] = useState(CURATED_VERSES[0].translation);
  const [translatorName, setTranslatorName] = useState("ترجمه مکارم شیرازی");
  const [authorName, setAuthorName] = useState(user?.full_name || "آیه مدیا پلاس");

  // Tab controls: 'content' | 'theme' | 'typography' | 'export'
  const [activeTab, setActiveTab] = useState("content");
  const [busyAction, setBusyAction] = useState(null);
  const fileInputRef = useRef(null);

  // Check URL params (?surah=X&ayah=Y or ?verse_key=X:Y)
  useEffect(() => {
    const sParam = params.get("surah");
    const aParam = params.get("ayah");
    const vkParam = params.get("verse_key");
    const bgParam = params.get("bg");

    if (bgParam) {
      const matchBg = MOSQUE_BACKGROUNDS.find((b) => b.id === bgParam);
      if (matchBg?.url) {
        setBackgroundUrl(matchBg.url);
        setActiveTab("theme");
        toast.success(`معماری «${matchBg.label}» اعمال شد`);
      }
    }

    if (vkParam || (sParam && aParam)) {
      const targetKey = vkParam || `${sParam}:${aParam}`;
      setVerseKey(targetKey);

      // Try fetching verse data from backend entities
      api.entities.Verse.filter({ verse_key: targetKey })
        .then((items) => {
          if (items && items.length > 0) {
            const v = items[0];
            setArabic(v.arabic);
            setTranslation(v.translation || "");
            setSurahName(v.surah_name_arabic ? `سوره مبارکه ${v.surah_name_arabic}` : `سوره شماره ${v.surah_number}`);
            toast.success(`آیه ${targetKey} در استودیو بارگذاری شد`);
          }
        })
        .catch(() => {});
    }
  }, [params]);

  useEffect(() => {
    if (user?.full_name && authorName === "آیه مدیا پلاس") {
      setAuthorName(user.full_name);
    }
  }, [user]);

  const preset = PRESETS.find((p) => p.id === characterId) || PRESETS[0];
  const avatarValue = serializeAvatar(preset.id, preset.cfg);
  const format = CARD_FORMATS.find((f) => f.id === formatId) || CARD_FORMATS[0];

  // Live SVG computation
  const svg = useMemo(() => {
    return buildVerseCardSvg({
      arabic,
      translation,
      verseKey,
      surahName,
      translatorName,
      author: authorName,
      character: avatarValue,
      themeId,
      formatId,
      backgroundUrl,
      backgroundDim,
      showAvatar,
      showBismillah,
      arabicFontId,
      persianFontId,
      fontSizeMultiplier,
    });
  }, [
    arabic,
    translation,
    verseKey,
    surahName,
    translatorName,
    authorName,
    avatarValue,
    themeId,
    formatId,
    backgroundUrl,
    backgroundDim,
    showAvatar,
    showBismillah,
    arabicFontId,
    persianFontId,
    fontSizeMultiplier,
  ]);

  const svgDataUri = useMemo(() => svgToDataUrl(svg), [svg]);

  // Handle Preset Select
  const handleSelectCuratedVerse = (item) => {
    setVerseKey(item.key);
    setSurahName(item.surahName);
    setArabic(item.arabic);
    setTranslation(item.translation);
    setTranslatorName(item.translator);
    toast.success(`آیه منتخب ${item.key} تنظیم شد`);
  };

  // Custom Image Upload
  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("لطفاً یک فایل تصویری انتخاب فرمایید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundUrl(reader.result);
      toast.success("تصویر زمینه دلخواه بارگذاری شد");
    };
    reader.readAsDataURL(file);
  };

  // 1. Download PNG
  const handleDownload = async () => {
    setBusyAction("download");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ayeh-card-${verseKey.replace(":", "-")}-${formatId}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      toast.success("کارت آیه با کیفیت بالا ذخیره شد 🎉");
    } catch (err) {
      console.error(err);
      toast.error("خطا در ایجاد خروجی تصویر");
    } finally {
      setBusyAction(null);
    }
  };

  // 2. Direct Publish to Ayeh Story
  const handlePublishStory = async () => {
    if (!user) {
      openAuthModal((_loggedIn) => {
        handlePublishStory();
      });
      return;
    }

    setBusyAction("story");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      const formData = new FormData();
      formData.append("file", blob, `story-${Date.now()}.png`);

      const uploadRes = await fetch("/api/integrations/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.file_url || svgDataUri;

      await api.entities.Story.create({
        author_id: user.id,
        author_name: user.full_name || "کاربر آیه",
        author_avatar: user.avatar_url || null,
        media_url: imageUrl,
        media_type: "image",
        verse_key: verseKey,
        verse_text: translation,
        caption: `${surahName} | آیه ${verseKey}`,
        viewed_by: [],
      });

      // Track gamification XP for sharing
      api.gamification?.trackActivity({ type: "social", duration_seconds: 30 }).catch(() => {});

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      toast.success("کارت آیه با موفقیت در استوری‌های سامانه منتشر شد ✨");
    } catch (err) {
      console.error("Story publish error:", err);
      toast.error("خطا در انتشار استوری");
    } finally {
      setBusyAction(null);
    }
  };

  // 3. Direct Publish to Ayeh Community Post
  const handlePublishPost = async () => {
    if (!user) {
      openAuthModal((_loggedIn) => {
        handlePublishPost();
      });
      return;
    }

    setBusyAction("post");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      const formData = new FormData();
      formData.append("file", blob, `post-${Date.now()}.png`);

      const uploadRes = await fetch("/api/integrations/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.file_url || svgDataUri;

      await api.entities.Post.create({
        author_id: user.id,
        author_name: user.full_name || "کاربر آیه",
        author_avatar: user.avatar_url || null,
        content: `طراحی و تدبر در آیه مبارکه ${verseKey} (${surahName}):\n\n${translation}`,
        verse_key: verseKey,
        verse_arabic: arabic,
        verse_translation: translation,
        image_url: imageUrl,
        media_url: imageUrl,
        media_type: "image",
        type: "verse_share",
        tags: ["کارت_آیه", "تدبر", surahName.replace(/\s+/g, "_")],
      });

      api.gamification?.trackActivity({ type: "social" }).catch(() => {});

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success("کارت آیه در فید جامعه قرآنی به اشتراک گذاشته شد 🌟");
    } catch (err) {
      console.error("Post publish error:", err);
      toast.error("خطا در انتشار پست");
    } finally {
      setBusyAction(null);
    }
  };

  // 4. Native Web Share API
  const handleNativeShare = async () => {
    setBusyAction("share");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      await shareVerseCardNative({
        blob,
        title: `کارت آیه ${verseKey} - آیه پلاس`,
        text: `«${arabic}»\n\n${translation}\n\nمنتشر شده در آیه پلاس`,
      });
      toast.success("منوی اشتراک‌گذاری باز شد");
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("قابلیت اشتراک بومی در این مرورگر پشتیبانی نمی‌شود.");
      }
    } finally {
      setBusyAction(null);
    }
  };

  // 5. Copy to Clipboard
  const handleCopyClipboard = async () => {
    setBusyAction("copy");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      await copyImageToClipboard(blob);
      toast.success("تصویر کارت آیه در کلیپ‌بورد کپی شد 📋");
    } catch (err) {
      toast.error("امکان کپی مستقیم تصویر در کلیپ‌بورد این مرورگر مهیا نیست.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen pb-20 pt-4 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-5">
          <Link
            to="/quran"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-kalameh transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            بازگشت به مصحف شریف
          </Link>

          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </span>
            <span className="text-xs font-bold font-kalameh text-foreground">
              استودیوی طراحی استوری و کارت قرآنی
            </span>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Live Preview Canvas (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Aspect Ratio Selector Pills */}
            <div className="flex items-center gap-2 mb-4 bg-card p-1.5 rounded-2xl border border-border shadow-sm">
              {CARD_FORMATS.map((f) => {
                const isSelected = formatId === f.id;
                const IconComponent =
                  f.id === "story" ? Smartphone : f.id === "square" ? Square : Monitor;

                return (
                  <button
                    key={f.id}
                    onClick={() => setFormatId(f.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-kalameh transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Card Container */}
            <div className="w-full max-w-[360px] sm:max-w-[420px] rounded-3xl p-2 bg-gradient-to-br from-emerald-950/40 via-card to-card border border-primary/30 shadow-2xl backdrop-blur-md relative overflow-hidden group">
              <div
                className="w-full relative rounded-2xl overflow-hidden shadow-inner flex items-center justify-center bg-black/50"
                style={{
                  aspectRatio: format.ratio,
                }}
              >
                <img
                  src={svgDataUri}
                  alt="پیش‌نمایش زنده کارت آیه"
                  className="w-full h-full object-contain select-none"
                />
              </div>

              <div className="text-center mt-2.5 text-[11px] text-muted-foreground font-mono">
                وضوح خروجی: {format.width} × {format.height} پیکسل (Full HD)
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="w-full max-w-[420px] grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <button
                onClick={handleDownload}
                disabled={busyAction !== null}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold font-kalameh shadow-md transition-transform active:scale-95 disabled:opacity-50"
                title="دانلود فایل PNG"
              >
                {busyAction === "download" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>دانلود</span>
              </button>

              <button
                onClick={handlePublishStory}
                disabled={busyAction !== null}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-kalameh shadow-md transition-transform active:scale-95 disabled:opacity-50"
                title="انتشار مستقیم در استوری‌های آیه"
              >
                {busyAction === "story" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>استوری</span>
              </button>

              <button
                onClick={handlePublishPost}
                disabled={busyAction !== null}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold font-kalameh shadow-md transition-transform active:scale-95 disabled:opacity-50"
                title="انتشار به عنوان پست در جامعه"
              >
                {busyAction === "post" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>پست جامعه</span>
              </button>

              <button
                onClick={handleNativeShare}
                disabled={busyAction !== null}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold font-kalameh border border-border shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                title="اشتراک بومی در پیام‌رسان‌ها"
              >
                {busyAction === "share" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>اشتراک</span>
              </button>
            </div>

            <div className="mt-2">
              <button
                onClick={handleCopyClipboard}
                disabled={busyAction !== null}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-kalameh transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                کپی مستقیم تصویر در کلیپ‌بورد
              </button>
            </div>
          </div>

          {/* RIGHT: Customization Control Panel (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl bg-card border border-border/70 p-5 sm:p-7 shadow-xl">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-border/70 pb-3 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("content")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold font-kalameh transition-all shrink-0 ${
                  activeTab === "content"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                متن و آیه
              </button>

              <button
                onClick={() => setActiveTab("theme")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold font-kalameh transition-all shrink-0 ${
                  activeTab === "theme"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                قالب و پس‌زمینه
              </button>

              <button
                onClick={() => setActiveTab("typography")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold font-kalameh transition-all shrink-0 ${
                  activeTab === "typography"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                تایپوگرافی و قلم
              </button>

              <button
                onClick={() => setActiveTab("avatar")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold font-kalameh transition-all shrink-0 ${
                  activeTab === "avatar"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                پرتره و امضا
              </button>
            </div>

            {/* TAB 1: Content & Curated Verses */}
            {activeTab === "content" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Curated Verses Selector */}
                <div>
                  <label className="text-xs font-bold font-kalameh text-foreground block mb-2">
                    انتخاب سریع از بین آیات منتخب و آرامش‌بخش قرآن:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CURATED_VERSES.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleSelectCuratedVerse(item)}
                        className={`p-2.5 rounded-xl border text-right transition-all text-xs ${
                          verseKey === item.key
                            ? "bg-primary/10 border-primary font-bold text-foreground"
                            : "bg-muted/40 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="font-kalameh font-bold text-foreground">
                          {item.surahName}
                        </div>
                        <div className="text-[10px] text-primary font-mono mt-0.5">
                          آیه {item.key}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verse Key & Surah Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                      شماره آیه (مثال: 24:35)
                    </label>
                    <input
                      type="text"
                      value={verseKey}
                      onChange={(e) => setVerseKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                      نام سوره مبارکه
                    </label>
                    <input
                      type="text"
                      value={surahName}
                      onChange={(e) => setSurahName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-kalameh focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                {/* Arabic Text */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                    متن عربی آیه با اعراب
                  </label>
                  <textarea
                    rows={3}
                    value={arabic}
                    onChange={(e) => setArabic(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-background text-foreground font-arabic text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                    dir="rtl"
                  />
                </div>

                {/* Translation Text */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                    ترجمه روان فارسی
                  </label>
                  <textarea
                    rows={3}
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 text-right font-peyda"
                    dir="rtl"
                  />
                </div>

                {/* Translator Name */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                    نام مترجم یا مفسر
                  </label>
                  <input
                    type="text"
                    value={translatorName}
                    onChange={(e) => setTranslatorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-kalameh focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Themes & Mosque Photography */}
            {activeTab === "theme" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Royal Themes Palette */}
                <div>
                  <label className="text-xs font-bold font-kalameh text-foreground block mb-2.5">
                    پالت و سبک تذهیب اسلامی:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CARD_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                          themeId === t.id
                            ? "border-primary shadow-md ring-2 ring-primary/30"
                            : "border-border hover:border-border/80"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                        }}
                      >
                        <span className="text-xs font-bold font-kalameh" style={{ color: t.text }}>
                          {t.label}
                        </span>
                        <span
                          className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                          style={{ backgroundColor: t.accent, borderColor: t.border }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mosque Photography Backgrounds */}
                <div>
                  <label className="text-xs font-bold font-kalameh text-foreground block mb-2.5">
                    تصویر پس‌زمینه (عکاسی مساجد تاریخی):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {MOSQUE_BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackgroundUrl(bg.url)}
                        className={`p-2 rounded-2xl border text-right transition-all overflow-hidden ${
                          backgroundUrl === bg.url
                            ? "border-primary ring-2 ring-primary/30 bg-primary/10"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        {bg.url ? (
                          <div className="h-16 w-full rounded-xl overflow-hidden mb-1.5 bg-black/30">
                            <img src={bg.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-16 w-full rounded-xl mb-1.5 bg-muted/60 flex items-center justify-center text-muted-foreground text-xs font-kalameh">
                            الگوی وکتوری
                          </div>
                        )}
                        <span className="text-[11px] font-kalameh font-semibold text-foreground truncate block">
                          {bg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom File Upload & Dim Slider */}
                <div className="pt-2 border-t border-border/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold font-kalameh text-foreground">
                        آپلود تصویر دلخواه از دستگاه
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        فرمت‌های JPG و PNG با کیفیت بالا
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-xs font-bold font-kalameh flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      انتخاب عکس
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomImageUpload}
                      className="hidden"
                    />
                  </div>

                  {backgroundUrl && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 font-kalameh">
                        <span>میزان تیرگی پس‌زمینه جهت خوانایی بهتر متن:</span>
                        <span className="font-mono">{Math.round(backgroundDim * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.85"
                        step="0.05"
                        value={backgroundDim}
                        onChange={(e) => setBackgroundDim(parseFloat(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Typography & Fonts */}
            {activeTab === "typography" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Arabic Font Selector */}
                <div>
                  <label className="text-xs font-bold font-kalameh text-foreground block mb-2">
                    قلم متن قرآن (عربی):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {ARABIC_FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setArabicFontId(f.id)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          arabicFontId === f.id
                            ? "bg-primary/10 border-primary font-bold text-foreground"
                            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-bold font-kalameh block">{f.label}</span>
                        <span className="text-sm font-arabic text-primary mt-1 block">
                          بِسْمِ اللَّهِ
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Persian Font Selector */}
                <div>
                  <label className="text-xs font-bold font-kalameh text-foreground block mb-2">
                    قلم ترجمه فارسی:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PERSIAN_FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setPersianFontId(f.id)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          persianFontId === f.id
                            ? "bg-primary/10 border-primary font-bold text-foreground"
                            : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs font-bold font-kalameh block">{f.label}</span>
                        <span className="text-xs text-muted-foreground mt-1 block font-peyda">
                          به نام خداوند بخشنده
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Multiplier Slider */}
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-kalameh">
                    <span>مقیاس اندازه متن آیات و ترجمه:</span>
                    <span className="font-mono">{(fontSizeMultiplier * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.35"
                    step="0.05"
                    value={fontSizeMultiplier}
                    onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Avatar, Katibeh & Branding */}
            {activeTab === "avatar" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border cursor-pointer">
                    <span className="text-xs font-bold font-kalameh text-foreground">
                      نمایش کتیبه نورانی بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ در بالای کارت
                    </span>
                    <input
                      type="checkbox"
                      checked={showBismillah}
                      onChange={(e) => setShowBismillah(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border cursor-pointer">
                    <span className="text-xs font-bold font-kalameh text-foreground">
                      نمایش شمسه تذهیب و پرتره اسلامی کاربر در مرکز کارت
                    </span>
                    <input
                      type="checkbox"
                      checked={showAvatar}
                      onChange={(e) => setShowAvatar(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Character Avatar Picker */}
                {showAvatar && (
                  <div>
                    <label className="text-xs font-bold font-kalameh text-foreground block mb-2">
                      انتخاب پرتره معنوی شمسه:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setCharacterId(p.id)}
                          className={`p-2 rounded-2xl border text-center transition-all ${
                            characterId === p.id
                              ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="text-xs font-kalameh font-bold text-foreground">
                            {p.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author Name / Watermark */}
                <div className="pt-2 border-t border-border/60">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5 font-kalameh">
                    نام امضاکننده یا طراح در پای کارت
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-kalameh focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="مثال: آیه پلاس یا نام شما"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
