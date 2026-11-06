// Comprehensive Quran topic explorer data
// Organized into categories for the Topic Explorer page

export const TOPIC_CATEGORIES = [
  {
    id: "beliefs",
    name: "عقاید",
    icon: "Heart",
    color: "#0B6E4F",
    topics: [
      { name: "توحید",           name_arabic: "تَوْحِيد",           description: "یگانگی خداوند و صفات الهی" },
      { name: "ایمان",           name_arabic: "إِیمَان",            description: "تصدیق قلبی و عمل به احکام الهی" },
      { name: "قیامت",           name_arabic: "الْقِیَامَة",         description: "روز بازپسینی و حسابرسی" },
      { name: "مرگ",             name_arabic: "الْمَوْت",            description: "گذر از دنیا به برزخ و آخرت" },
      { name: "برزخ",            name_arabic: "الْبَرْزَخ",          description: "دنیای میان مرگ و قیامت" },
      { name: "بهشت",            name_arabic: "الْجَنَّة",            description: "پاداش ابدی نیکوکاران" },
      { name: "جهنم",            name_arabic: "جَهَنَّم",            description: "کیفر گناهکاران و ظالمان" },
      { name: "شیطان",           name_arabic: "الشَّیْطَان",         description: "دشمن انسان و وسوسه‌گر" },
      { name: "منافقان",         name_arabic: "الْمُنَافِقُون",       description: "ظاهرسازان در ایمان" },
      { name: "مؤمنان",          name_arabic: "الْمُؤْمِنُون",        description: "راستگویان در ایمان و عمل" },
      { name: "کافران",          name_arabic: "الْکَافِرُون",        description: "انکارکنندگان حق" },
      { name: "فاسقان",          name_arabic: "الْفَاسِقُون",        description: "خروج‌کنندگان از اطاعت" },
      { name: "ظالمان",          name_arabic: "الظَّالِمُون",        description: "ستم‌پیشگان و متجاوزان" },
    ],
  },
  {
    id: "worship",
    name: "عبادات",
    icon: "HandHeart",
    color: "#B8860B",
    topics: [
      { name: "نماز",             name_arabic: "الصَّلَاة",          description: "ستون دین و ارتباط با خدا" },
      { name: "روزه",             name_arabic: "الصِّیَام",          description: "پاکدامنی و تقوا در ماه رمضان" },
      { name: "زکات",             name_arabic: "الزَّکَاة",           description: "حق فقیران در اموال ثروتمندان" },
      { name: "انفاق",            name_arabic: "الْإِنْفَاق",        description: "بذل مال در راه خدا" },
      { name: "جهاد",            name_arabic: "الْجِهَاد",           description: "کوشش در راه حق و دفاع از دین" },
      { name: "توبه",             name_arabic: "التَّوْبَة",          description: "بازگشت به سوی خداوند" },
      { name: "دعا",              name_arabic: "الدُّعَاء",           description: "خواندن خداوند و نیایش" },
      { name: "ذکر",              name_arabic: "الذِّکْر",            description: "یاد خدا در هر لحظه" },
    ],
  },
  {
    id: "ethics",
    name: "اخلاق",
    icon: "Sparkles",
    color: "#2D7A55",
    topics: [
      { name: "صبر",              name_arabic: "الصَّبْر",            description: "پایداری در سختی‌ها و طاعت" },
      { name: "شکر",              name_arabic: "الشُّکْر",            description: "قدرشناسی نعمت‌های الهی" },
      { name: "رحمت",            name_arabic: "الرَّحْمَة",          description: "مهربانی و شفقت به خلق" },
      { name: "عدالت",            name_arabic: "الْعَدْل",            description: "دادگری و برابری در حق" },
      { name: "اخلاق",            name_arabic: "الْأَخْلَاق",         description: "حسن خلق و کردار نیک" },
      { name: "تقوا",             name_arabic: "التَّقْوَى",          description: "پرهیز از گناه و خشیت الهی" },
      { name: "حکمت",            name_arabic: "الْحِکْمَة",          description: "دانش همراه با عمل صالح" },
      { name: "علم",              name_arabic: "الْعِلْم",            description: "دانش و معرفت و جستجوی آن" },
    ],
  },
  {
    id: "family",
    name: "خانواده",
    icon: "Users",
    color: "#8B6914",
    topics: [
      { name: "والدین",           name_arabic: "الْوَالِدَیْن",        description: "احترام و نیکی به پدر و مادر" },
      { name: "فرزندان",         name_arabic: "الْأَوْلَاد",         description: "تربیت و حقوق فرزندان" },
      { name: "ازدواج",          name_arabic: "النِّکَاح",           description: "پیمان زناشویی و احکام آن" },
      { name: "طلاق",             name_arabic: "الطَّلَاق",          description: "گسست پیمان زناشویی و احکام آن" },
      { name: "ارث",              name_arabic: "الْمِیرَاث",          description: "قسمت اموال میان وارثان" },
      { name: "حقوق زنان",       name_arabic: "حُقُوق النِّسَاء",     description: "حقوق و کرامت زنان در اسلام" },
      { name: "حقوق خانواده",    name_arabic: "حُقُوق الْأُسْرَة",   description: "حقوق متقابل اعضای خانواده" },
    ],
  },
  {
    id: "social",
    name: "حقوق اجتماعی",
    icon: "Handshake",
    color: "#1B5E3F",
    topics: [
      { name: "حقوق مردم",       name_arabic: "حُقُوق النَّاس",      description: "حقوق همگانی و اجتماعی" },
      { name: "حقوق همسایه",     name_arabic: "حَقُّ الْجَار",       description: "نیکی به همسایه و حفظ حقوق او" },
      { name: "حقوق یتیم",       name_arabic: "حَقُّ الْیَتِیم",     description: "حمایت و رسیدگی به یتیمان" },
      { name: "حقوق فقیر",       name_arabic: "حَقُّ الْفَقِیر",     description: "دستگیری از نیازمندان" },
      { name: "حقوق کارگر",      name_arabic: "حَقُّ الْعَامِل",     description: "حقوق و دستمزد کارگران" },
      { name: "اخلاق اجتماعی",   name_arabic: "الْأَخْلَاق الِاجْتِمَاعِیَّة", description: "ادب و معاشرت در جامعه" },
    ],
  },
  {
    id: "economic",
    name: "اقتصاد",
    icon: "Coins",
    color: "#9A7B0A",
    topics: [
      { name: "تجارت",           name_arabic: "التِّجَارَة",          description: "دادوستد و احکام کسب‌وکار" },
      { name: "ربا",              name_arabic: "الرِّبَا",            description: "بهره‌گیری ممنوع از اموال" },
      { name: "اقتصاد",          name_arabic: "الِاقْتِصَاد",         description: "نظام اقتصادی اسلامی و توازن" },
    ],
  },
  {
    id: "governance",
    name: "مدیریت و رهبری",
    icon: "Landmark",
    color: "#0D5C3E",
    topics: [
      { name: "مدیریت",          name_arabic: "الْإِدَارَة",          description: "هدایت و سازماندهی امور" },
      { name: "رهبری",           name_arabic: "الْقِیَادَة",          description: "پیشوایی و زعامت در جامعه" },
    ],
  },
  {
    id: "prophets",
    name: "انبیا",
    icon: "UserRound",
    color: "#0B6E4F",
    topics: [
      { name: "انبیا",           name_arabic: "الْأَنْبِیَاء",        description: "فرستادگان خدا برای هدایت بشر" },
      { name: "حضرت آدم",        name_arabic: "آدَم",               description: "پدر بشریت و نخستین پیامبر" },
      { name: "حضرت نوح",        name_arabic: "نُوح",               description: "پیامبر صبور و طوفان بزرگ" },
      { name: "حضرت ابراهیم",    name_arabic: "إِبْرَاهِیم",          description: "خلیل الرحمن و بنای کعبه" },
      { name: "حضرت موسی",       name_arabic: "مُوسَى",              description: "کلام الله و نجات بنی‌اسرائیل" },
      { name: "حضرت عیسی",       name_arabic: "عِیسَى",              description: "روح الله و معجزات او" },
      { name: "حضرت محمد",       name_arabic: "مُحَمَّد",              description: "خاتم‌الانبیاء و پیامبر رحمت" },
    ],
  },
];

// Flatten all topics for search
export const ALL_TOPICS = TOPIC_CATEGORIES.flatMap((cat) =>
  cat.topics.map((t) => ({ ...t, category: cat.id, categoryName: cat.name, color: cat.color }))
);