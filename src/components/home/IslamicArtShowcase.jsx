import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Palette, Sparkles, ArrowRight, Eye, Camera } from "lucide-react";
import { PERSIAN_ART_IMAGES } from "@/lib/persianArtSystem";

const ART_WORKS = [
  {
    id: "nasir_panorama",
    title: "تالار نور و ارسی‌های هفت‌رنگ",
    location: "مسجد نصیرالملک شیراز",
    desc: "پرتوهای خورشید از میان شیشه‌های رنگی ارسی بر ستون‌های سنگی و کاشی‌های فیروزه‌ای می‌تابند و جلوه‌ای از آیه شریفه نور (اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ) را متجلی می‌سازند.",
    image: PERSIAN_ART_IMAGES.sanctuaryPanorama,
    verse: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ (نور: ۳۵)",
    tag: "شاهکار صفوی و قاجار",
  },
  {
    id: "nasir_columns",
    title: "ستون‌های مارپیچ و کاشی‌کاری فیروزه",
    location: "شبستان زمستانی نصیرالملک",
    desc: "تراش یکپارچه ستون‌های سنگی مارپیچ در پیوند با کاشی‌های هفت‌رنگ و مقرنس‌های ظریف ایرانی.",
    image: PERSIAN_ART_IMAGES.lightColumns,
    verse: "فِی بُیُوتٍ أَذِنَ اللَّهُ أَن تُرْفَعَ (نور: ۳۶)",
    tag: "هنر سنگ‌تراشی و کاشی",
  },
  {
    id: "nasir_carpet",
    title: "فرش ایرانی در ضیافت نور قدسی",
    location: "صحن سجاده‌ای شبستان",
    desc: "هم‌آمیزی رنگ‌های گرم لاکی فرش ایرانی با تابش انوار سبز، سرخ و لاجوردی شیشه‌های ارسی.",
    image: PERSIAN_ART_IMAGES.carpetWindow,
    verse: "وَفِیهَا مَا تَشْتَهِیهِ الْأَنفُسُ (زخرف: ۷۱)",
    tag: "تار و پود اصالت",
  },
  {
    id: "nasir_vault",
    title: "مقرنس و طاق گل و بوته بهشت‌آسا",
    location: "طاق‌نمای هندسی محراب",
    desc: "نقش‌مایه‌های هندسی و ختایی در سقف که نگاه نمازگزار را از کثرت زمین به وحدت آسمان عروج می‌دهند.",
    image: PERSIAN_ART_IMAGES.vaultCeiling,
    verse: "سَبِّحِ اسْمَ رَبِّکَ الْأَعْلَى (اعلی: ۱)",
    tag: "هندسه مقدس ایرانی",
  },
  {
    id: "chehel_sotoun",
    title: "سقف زرین و نقاشی‌های کاخ چهل‌ستون",
    location: "تالار سلطنتی اصفهان",
    desc: "اوج هنر طلاکاری، مینیاتور و گچ‌بری عصر طلایی صفوی با نقوش اسلیمی و ختایی منحصربه‌فرد.",
    image: PERSIAN_ART_IMAGES.goldVault,
    verse: "تَبَارَکَ اسْمُ رَبِّکَ ذِی الْجَلَالِ وَالْإِکْرَامِ (الرحمن: ۷۸)",
    tag: "تذهیب و طلای ناب",
  },
];

export default function IslamicArtShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = ART_WORKS[activeIdx];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-rokh-bold text-amber-600 dark:text-amber-400">
              نگارخانه معماری قدسی و هنر ایرانی-اسلامی
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-rokh-bold text-foreground">
            تجلی نور کلام وحی در شاهکارهای معماری ایران
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-doran max-w-2xl">
            پیوند ناگسستنی آیات قرآن کریم با هنر تذهیب، شیشه‌های رنگی ارسی، مقرنس‌های اسلیمی و کاشی‌های هفت‌رنگ.
          </p>
        </div>

        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold font-rokh-bold shadow-md hover:shadow-lg transition-transform active:scale-95 shrink-0 self-start md:self-auto"
        >
          <Palette className="w-4 h-4 text-amber-300" />
          <span>ورود به استودیوی طراحی کارت</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Large Featured Viewer (7 cols) */}
        <div className="lg:col-span-7 relative rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[440px] shadow-2xl border border-amber-400/30 group bg-black">
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />

          {/* Artistic Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 text-xs font-bold font-rokh-bold backdrop-blur-md shadow-md">
              {current.tag}
            </span>
          </div>

          {/* Bottom Card Content */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
            <div className="text-xs font-mono text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{current.location}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-rokh-bold text-white mb-2 drop-shadow">
              {current.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-200/90 font-doran leading-relaxed mb-4 max-w-xl">
              {current.desc}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/20">
              <span className="text-xs font-arabic text-amber-200 font-bold">
                {current.verse}
              </span>

              <Link
                to={`/studio?bg=${current.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs font-rokh-bold transition-transform active:scale-95 shadow-md"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>طراحی کارت با این معماری</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Thumbnails & Selection Rail (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {ART_WORKS.map((item, idx) => {
            const isSelected = activeIdx === idx;
            return (
              <button
                key={item.id}
                onClick={() => setActiveIdx(idx)}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3.5 ${
                  isSelected
                    ? "bg-primary/10 border-amber-400 shadow-md ring-2 ring-amber-400/30"
                    : "bg-card/70 border-border hover:bg-card hover:border-border/90"
                }`}
              >
                <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-border/80 shadow-sm relative">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-0.5">
                    <span>{item.location}</span>
                    <span className="font-mono text-primary font-bold">۰{idx + 1}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold font-rokh-bold text-foreground truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 font-doran mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
