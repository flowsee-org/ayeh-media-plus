import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ayeh.media' },
    update: {
      streak_days: 14,
      max_streak: 21,
      total_xp: 1850,
      spiritual_level: 'حافظ',
      email_verified: true,
    },
    create: {
      email: 'admin@ayeh.media',
      password: adminPassword,
      full_name: 'مدیر سامانه آیه',
      role: 'admin',
      is_scholar: true,
      email_verified: true,
      bio: 'مدیریت محتوای سامانه چندرسانه‌ای آیه',
      avatar_url: '/images/user-admin.png',
      streak_days: 14,
      max_streak: 21,
      total_xp: 1850,
      spiritual_level: 'حافظ',
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Demo Scholar User
  const scholarPassword = await bcrypt.hash('scholar123', 10);
  const demoScholar = await prisma.user.upsert({
    where: { email: 'shomali@ayeh.media' },
    update: {
      streak_days: 28,
      max_streak: 35,
      total_xp: 3200,
      spiritual_level: 'خادم قرآن',
      email_verified: true,
    },
    create: {
      email: 'shomali@ayeh.media',
      password: scholarPassword,
      full_name: 'دکتر محمدعلی شمالی',
      role: 'user',
      is_scholar: true,
      email_verified: true,
      bio: 'استاد حوزه و دانشگاه، پژوهشگر معارف قرآنی و اخلاق اسلامی',
      avatar_url: '/images/user-shomali.png',
      streak_days: 28,
      max_streak: 35,
      total_xp: 3200,
      spiritual_level: 'خادم قرآن',
    },
  });
  console.log(`✅ Scholar user seeded: ${demoScholar.email}`);

  // 2.2 Seed Active Quranic Community Users for Gamification Leaderboard
  const communityUsers = [
    {
      email: 'fatemeh.r@ayeh.media',
      full_name: 'فاطمه رسولی',
      streak_days: 19,
      max_streak: 25,
      total_xp: 2150,
      spiritual_level: 'حافظ',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    },
    {
      email: 'ali.hosseini@ayeh.media',
      full_name: 'علی حسینی',
      streak_days: 12,
      max_streak: 15,
      total_xp: 1240,
      spiritual_level: 'اهل تدبر',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    },
    {
      email: 'zahra.s@ayeh.media',
      full_name: 'زهرا سلیمانی',
      streak_days: 8,
      max_streak: 10,
      total_xp: 680,
      spiritual_level: 'قاری',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    },
    {
      email: 'mahdi.k@ayeh.media',
      full_name: 'مهدی کاظمی',
      streak_days: 5,
      max_streak: 7,
      total_xp: 420,
      spiritual_level: 'قاری',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    },
  ];

  for (const cu of communityUsers) {
    const pw = await bcrypt.hash('user123', 10);
    await prisma.user.upsert({
      where: { email: cu.email },
      update: {
        streak_days: cu.streak_days,
        max_streak: cu.max_streak,
        total_xp: cu.total_xp,
        spiritual_level: cu.spiritual_level,
        email_verified: true,
      },
      create: {
        email: cu.email,
        password: pw,
        full_name: cu.full_name,
        role: 'user',
        email_verified: true,
        avatar_url: cu.avatar_url,
        streak_days: cu.streak_days,
        max_streak: cu.max_streak,
        total_xp: cu.total_xp,
        spiritual_level: cu.spiritual_level,
      },
    });
  }

  // Seed Badges for Admin
  const adminBadges = [
    { id: 'first_step', name: 'گام نخستین', icon: 'Footprints', tier: 'bronze' },
    { id: 'streak_7', name: 'همراه هفت‌روزه نور', icon: 'Flame', tier: 'silver' },
    { id: 'khatm_companion', name: 'یار ختم جمعی', icon: 'HeartHandshake', tier: 'silver' },
  ];
  for (const b of adminBadges) {
    const exists = await prisma.userBadge.findFirst({
      where: { user_id: admin.id, badge_id: b.id },
    });
    if (!exists) {
      await prisma.userBadge.create({
        data: {
          user_id: admin.id,
          badge_id: b.id,
          badge_name: b.name,
          badge_icon: b.icon,
          description: 'نشان کسب‌شده در مسیر انس با قرآن',
          tier: b.tier,
        },
      });
    }
  }
  console.log('✅ Gamification users and badges seeded.');

  // 3. Scholars
  const scholars = [
    {
      name: 'علامه سید محمدحسین طباطبایی',
      name_arabic: 'العلامة السيد محمد حسين الطباطبائي',
      title: 'مفسر و فیلسوف بزرگ جهان اسلام',
      bio: 'صاحب تفسیر شریف المیزان فی تفسیر القرآن که از جامع‌ترین تفاسیر عقلی و روایی است.',
      birth_year: '1281 هـ.ش',
      death_year: '1360 هـ.ش',
      avatar_url: '/images/scholar-tabatabai.png',
      verified: true,
      books: JSON.stringify(['تفسیر المیزان', 'بدایة الحکمة', 'نهایة الحکمة', 'شیعه در اسلام']),
      sources: JSON.stringify(['حکمت متعالیه', 'تفسیر قرآن به قرآن']),
    },
    {
      name: 'استاد حسین الهی قمشه‌ای',
      name_arabic: 'الدكتور حسين إلهي قمشئي',
      title: 'ادیب، عارف و مترجم قرآن کریم',
      bio: 'پژوهشگر برجسته در حوزه ادبیات، عرفان و تفسیر معنوی و زیبایی‌شناختی آیات الهی.',
      birth_year: '1318 هـ.ش',
      death_year: '',
      avatar_url: '/images/scholar-elahi.png',
      verified: true,
      books: JSON.stringify(['ترجمه قرآن کریم', 'گزیده فیه ما فیه', 'کیمیای عشق']),
      sources: JSON.stringify(['ادبیات فارسی و عرفان اسلامی']),
    },
    {
      name: 'آیت‌الله ناصر مکارم شیرازی',
      name_arabic: 'آية الله ناصر مكارم الشيرازي',
      title: 'مرجع عالیقدر و مفسر قرآن',
      bio: 'سرپرست گروه مؤلفان تفسیر پرمخاطب نمونه به زبان روان و پاسخگوی پرسش‌های روز.',
      birth_year: '1305 هـ.ش',
      death_year: '',
      avatar_url: '/images/scholar-makarim.png',
      verified: true,
      books: JSON.stringify(['تفسیر نمونه', 'پیام قرآن', 'تفسیر موضوعی']),
      sources: JSON.stringify(['علوم قرآن و فقه مقارن']),
    },
    {
      name: 'استاد شهید مرتضی مطهری',
      name_arabic: 'الشهيد الشيخ مرتضى المطهري',
      title: 'فیلسوف، متفکر و اسلام‌شناس معاصر',
      bio: 'صاحب مجموعه ارزشمند «آشنایی با قرآن» و تبیین‌کننده عقلانیت و حکمت معارف اسلامی.',
      birth_year: '1298 هـ.ش',
      death_year: '1358 هـ.ش',
      avatar_url: '/images/scholar-motahari.png',
      verified: true,
      books: JSON.stringify(['آشنایی با قرآن (۱۴ جلد)', 'حکمت‌ها و اندرزها', 'سیری در سیره نبوی']),
      sources: JSON.stringify(['فلسفه اسلامی و کلام جدید']),
    },
    {
      name: 'آیت‌الله عبدالله جوادی آملی',
      name_arabic: 'آية الله عبد الله جوادي آملي',
      title: 'فیلسوف، فقیه و مفسر قرآن کریم',
      bio: 'صاحب تفسیر گرانسنگ «تسنیم» که از جامع‌ترین تفاسیر عقلی، نقلی و عرفانی معاصر است.',
      birth_year: '1312 هـ.ش',
      death_year: '',
      avatar_url: '/images/scholar-javadi.png',
      verified: true,
      books: JSON.stringify(['تفسیر تسنیم (۸۰ جلد)', 'تفسیر موضوعی قرآن', 'رحیق مختوم']),
      sources: JSON.stringify(['حکمت متعالیه و عرفان نظری']),
    },
  ];

  for (const s of scholars) {
    const existing = await prisma.scholar.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.scholar.create({ data: s });
    }
  }
  console.log(`✅ ${scholars.length} Scholars seeded.`);

  // 4. Topics
  const topics = [
    {
      name: 'صبر و پایداری',
      name_arabic: 'الصبر والثبات',
      slug: 'patience',
      description: 'آیات نورانی پیرامون فضیلت شکیبایی در برابر سختی‌ها و ثمرات استقامت مؤمنانه.',
      category: 'ethics',
      icon: 'Shield',
      theme_color: '#10B981',
      verse_keys: JSON.stringify(['2:153', '2:155', '3:200', '94:5']),
      verse_count: 4,
    },
    {
      name: 'توکل و آرامش درون',
      name_arabic: 'التوكل وطمأنينة القلب',
      slug: 'tawakkul',
      description: 'سپردن امور به پروردگار مهربان و راهکارهای قرآنی برای رفع اضطراب و اندوه.',
      category: 'beliefs',
      icon: 'Heart',
      theme_color: '#3B82F6',
      verse_keys: JSON.stringify(['13:28', '65:3', '3:159']),
      verse_count: 3,
    },
    {
      name: 'عدالت و احسان',
      name_arabic: 'العدل والإحسان',
      slug: 'justice',
      description: 'سفارش‌های اکید قرآن بر دادگری، نیکوکاری و گره‌گشایی از کار بندگان خدا.',
      category: 'social',
      icon: 'Scale',
      theme_color: '#8B5CF6',
      verse_keys: JSON.stringify(['16:90', '4:58', '5:8']),
      verse_count: 3,
    },
    {
      name: 'شکر و سپاسگزاری',
      name_arabic: 'الشكر والحمد',
      slug: 'gratitude',
      description: 'شناخت نعمت‌های بیکران الهی و افزایش برکت در سایه شکر قلبی، زبانی و عملی.',
      category: 'worship',
      icon: 'Sparkles',
      theme_color: '#F59E0B',
      verse_keys: JSON.stringify(['14:7', '55:13', '1:2']),
      verse_count: 3,
    },
  ];

  for (const t of topics) {
    const existing = await prisma.topic.findFirst({ where: { slug: t.slug } });
    if (!existing) {
      await prisma.topic.create({ data: t });
    }
  }
  console.log(`✅ ${topics.length} Topics seeded.`);


  // 6. Collections
  const collections = [
    {
      name: 'آیات آرامش و رهایی از اضطراب',
      description: 'مجموعه‌ای برگزیده از آیاتی که در سخت‌ترین احوال روحی، طمأنینه و نور را به قلب هدیه می‌دهند.',
      theme_color: '#0D9488',
      icon: 'Feather',
      cover_pattern: 'arabesque',
      verse_keys: JSON.stringify(['13:28', '94:5', '2:153']),
      verse_count: 3,
      user_id: admin.id,
    },
    {
      name: 'دروازه‌های حکمت و توحید',
      description: 'سیری در آیاتی که جهان‌بینی توحیدی و پیوند ژرف انسان با پروردگار را ترسیم می‌کنند.',
      theme_color: '#D97706',
      icon: 'Sun',
      cover_pattern: 'geometric',
      verse_keys: JSON.stringify(['1:1', '2:255']),
      verse_count: 2,
      user_id: admin.id,
    },
  ];

  for (const c of collections) {
    const existing = await prisma.collection.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.collection.create({ data: c });
    }
  }
  console.log(`✅ ${collections.length} Collections seeded.`);

  // 7. Community Posts
  const posts = [
    {
      author_id: admin.id,
      author_name: 'مدیر سامانه آیه',
      author_avatar: JSON.stringify({ character: 'scholar_classic', style: 'gold' }),
      content: 'به سامانه چندرسانه‌ای تدبّر در قرآن «آیه پلاس» خوش آمدید! در این فضا می‌توانید در کنار خواندن قرآن و پژوهش در آیات، تأملات و درس‌های کاربردی زندگی خود را با دیگر پویندگان به اشتراک بگذارید.',
      type: 'reflection',
      verse_key: '1:1',
      verse_arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      verse_translation: 'به نام خداوند بخشنده مهربان',
      media_url: '/images/9b78d20af_generated_image.png',
      media_type: 'image',
      likes_count: 5,
      comments_count: 1,
      tags: JSON.stringify(['آیه', 'قرآن', 'تدبر']),
    },
    {
      author_id: demoScholar.id,
      author_name: 'دکتر محمدعلی شمالی',
      author_avatar: JSON.stringify({ character: 'sage', style: 'emerald' }),
      content: 'در تدبّر آیه «فَإِنَّ مَعَ الْعُسْرِ يُسْرًا»، نکته ظریف آن است که سختی و آسانی در هم تنیده‌اند؛ انسان صبور در همان دل کوران مشکلات، بارقه‌های رشد و تعالی معنوی را تجربه می‌کند.',
      type: 'reflection',
      verse_key: '94:5',
      verse_arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      verse_translation: 'پس بی‌تردید همراه با هر دشواری، آسانی است.',
      likes_count: 12,
      comments_count: 0,
      tags: JSON.stringify(['شرح', 'امید', 'استقامت']),
    },
    {
      author_id: admin.id,
      author_name: 'مدیر سامانه آیه',
      author_avatar: JSON.stringify({ character: 'scholar_classic', style: 'gold' }),
      content: 'تأمل در آیه «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»؛ در دنیای پر از هیاهو و شتاب امروز، تنها پناهگاهی که تپش‌های مضطرب روح را آرام می‌سازد، انس مستمر با کلام وحی و خلوت با خدای مهربان است.',
      type: 'reflection',
      verse_key: '13:28',
      verse_arabic: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      verse_translation: 'آگاه باشید که با یاد خدا دل‌ها آرامش می‌پذیرد.',
      media_url: '/images/e8b49835b_generated_image.png',
      image_url: '/images/e8b49835b_generated_image.png',
      media_type: 'image',
      likes_count: 18,
      comments_count: 2,
      tags: JSON.stringify(['آرامش', 'ذکر', 'توکل']),
    },
    {
      author_id: demoScholar.id,
      author_name: 'دکتر محمدعلی شمالی',
      author_avatar: JSON.stringify({ character: 'sage', style: 'emerald' }),
      content: 'زیباترین پیام امید در قرآن: «لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ»؛ درهای توبه و بازگشت همواره گشوده است و خداوند تبارک و تعالی مشتاق‌تر از خود ما به بازگشت بندگان است.',
      type: 'verse_share',
      verse_key: '39:53',
      verse_arabic: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
      verse_translation: 'بگو ای بندگان من، از رحمت خدا نومید نشوید.',
      media_url: '/images/e43d77a38_generated_image.png',
      image_url: '/images/e43d77a38_generated_image.png',
      media_type: 'image',
      likes_count: 24,
      comments_count: 3,
      tags: JSON.stringify(['رحمت', 'امید', 'توبه']),
    },
  ];

  for (const p of posts) {
    const existing = await prisma.post.findFirst({ where: { content: p.content } });
    if (!existing) {
      const createdPost = await prisma.post.create({ data: p });
      // Add a comment to the first post
      if (p.comments_count > 0) {
        await prisma.comment.create({
          data: {
            post_id: createdPost.id,
            author_id: demoScholar.id,
            author_name: demoScholar.full_name,
            content: 'الحمدلله، بسیار مبارک و ارزشمند است. موفق باشید.',
          },
        });
      }
    }
  }
  console.log(`✅ ${posts.length} Posts seeded.`);

  // 7.5 Initial Stories
  const stories = [
    {
      author_id: admin.id,
      author_name: admin.full_name,
      author_avatar: admin.avatar_url,
      caption: 'صبح خود را با تلاوت آیه الکرسی نورانی و پربرکت کنید ✨',
      media_url: '/images/fd38dd0b5_generated_image.png',
      media_type: 'image',
      verse_key: '2:255',
      verse_text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      views_count: 42,
      viewed_by: JSON.stringify([admin.id]),
      expires_at: new Date(Date.now() + 86400000 * 7),
    },
    {
      author_id: demoScholar.id,
      author_name: demoScholar.full_name,
      author_avatar: demoScholar.avatar_url,
      caption: 'تدبّر کوتاه: هرگز از رحمت و گشایش پروردگار ناامید نشویم 🌿',
      media_url: '/images/9b78d20af_generated_image.png',
      media_type: 'image',
      verse_key: '39:53',
      verse_text: 'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ',
      views_count: 58,
      viewed_by: JSON.stringify([admin.id, demoScholar.id]),
      expires_at: new Date(Date.now() + 86400000 * 7),
    },
    {
      author_id: admin.id,
      author_name: admin.full_name,
      author_avatar: admin.avatar_url,
      caption: 'دوره‌های ختم قرآن فعال در آیه پلاس؛ سهم امروز خود را رزرو کنید 📖',
      media_url: '/images/69cc07788_generated_image.png',
      media_type: 'image',
      verse_key: '1:1',
      verse_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      views_count: 31,
      viewed_by: JSON.stringify([]),
      expires_at: new Date(Date.now() + 86400000 * 7),
    },
  ];

  for (const st of stories) {
    const existing = await prisma.story.findFirst({ where: { caption: st.caption } });
    if (!existing) {
      await prisma.story.create({ data: st });
    }
  }
  console.log(`✅ ${stories.length} Stories seeded.`);

  // 8. Competitions
  const comp = {
    title: 'مسابقه ماهانه تلاوت ترتیل و تدبّر در سوره نصر',
    description: 'همراهان گرامی، کلیپ صوتی یا تصویری تلاوت ترتیل خود از سوره مبارکه نصر را به همراه یک دقیقه بیان پیام زندگی آیه بارگذاری فرمایید.',
    type: 'recitation',
    prize_title: 'کمک‌هزینه سفر زیارتی مشهد مقدس',
    prize_description: 'به ۳ نفر از برگزیدگان با بیشترین آرای مردمی و داوری اساتید',
    prize_value: '۳ جایزه نفیس ۵۰ میلیون ریالی',
    rules: JSON.stringify([
      'رعایت کامل احکام تجوید و وقف و ابتدا',
      'حداکثر مدت زمان ویدیو ۳ دقیقه باشد',
      'پیوست یک برداشت اخلاقی یا تدبّری از سوره',
    ]),
    registration_deadline: null,
    status: 'active',
    entries_count: 1,
  };

  const existingComp = await prisma.competition.findFirst({ where: { title: comp.title } });
  if (!existingComp) {
    const createdComp = await prisma.competition.create({ data: comp });
    await prisma.competitionEntry.create({
      data: {
        competition_id: createdComp.id,
        author_id: demoScholar.id,
        author_name: demoScholar.full_name,
        title: 'تلاوت نمونه و تدبر',
        content: 'تلاوت خاشعانه با تأکید بر شکر و استغفار در هنگام فتح و پیروزی.',
        verse_key: '110:1',
        votes_count: 8,

      },
    });
  }
  console.log('✅ Competition seeded.');

  // 9. Videos — honest verified sources only (no fabricated stats / misattribution)
  const videos = [
    {
      id: 'video-1',
      title: 'تلاوت ترتیل سوره یاسین — مشاری راشد عفاسی',
      description: 'تلاوت کامل سوره یاسین از منبع QuranicAudio (مشاری راشد عفاسی).',
      category: 'recitation',
      media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/036.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-1.svg',
      duration: '۱:۱۸:۰۰',
      verse_key: '36:1',
      verse_arabic: 'یس وَالْقُرْآنِ الْحَكِيمِ',
      translation: 'یس. و قرآن حکیم را قسم می‌خورد.',
      transliteration: 'Yā Sīn. Wal-Qur\'ānil-Ḥakīm',
      reciter_name: 'مشاری راشد عفاسی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره یاسین', 'عفاسی', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-01-15'),
    },
    {
      id: 'video-2',
      title: 'تلاوت آیه الکرسی — محمود خلیل الحصری',
      description: 'تلاوت آیه الکرسی با صدای شیخ محمود خلیل الحصری (منبع EveryAyah).',
      category: 'recitation',
      media_url: 'https://everyayah.com/data/Husary_128kbps/002255.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-2.svg',
      duration: '۰:۰۱:۱۵',
      verse_key: '2:255',
      verse_arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      translation: 'خداوند است که هیچ معبودی جز او نیست؛ زنده و پاینده است...',
      transliteration: 'Allāhu lā ilāha illā huwal-Ḥayyul-Qayyūm',
      reciter_name: 'محمود خلیل الحصری',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['آیت الکرسی', 'حصری', 'کوتاه', 'شورت', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-02-20'),
    },
    {
      id: 'video-3',
      title: 'تلاوت آیه الکرسی — مشاری عفاسی (ویدیو)',
      description: 'ویدیوی پلتفرمی ساخته‌شده از تلاوت معتبر EveryAyah (مشاری عفاسی).',
      category: 'recitation',
      media_url: '/uploads/videos/video-3.mp4',
      media_type: 'video',
      thumbnail_url: '/uploads/thumbs/video-3.svg',
      duration: '۰:۰۰:۴۵',
      verse_key: '2:255',
      reciter_name: 'مشاری راشد عفاسی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['آیت الکرسی', 'عفاسی', 'کوتاه', 'شورت', 'ویدیو']),
      status: 'published',
      created_date: new Date('2024-03-10'),
    },
    {
      id: 'video-4',
      title: 'تلاوت سوره الرحمن — سعد الغامدی',
      description: 'تلاوت کامل سوره الرحمن از QuranicAudio (سعد الغامدی).',
      category: 'recitation',
      media_url: 'https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/055.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-4.svg',
      duration: '۰:۱۱:۳۰',
      verse_key: '55:1',
      verse_arabic: 'الرَّحْمَٰنُ عَلَّمَ الْقُرْآنَ',
      translation: 'خداوند مهربان، قرآن را تعلیم فرمود.',
      transliteration: 'Ar-Raḥmānu \'allamal-Qur\'ān',
      reciter_name: 'سعد الغامدی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره الرحمن', 'الغامدی', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-04-05'),
    },
    {
      id: 'video-5',
      title: 'تلاوت سوره ملک — عبدالباسط عبدالصمد',
      description: 'تلاوت سوره ملک با صدای عبدالباسط عبدالصمد (منبع mp3quran).',
      category: 'recitation',
      media_url: 'https://server8.mp3quran.net/basit/067.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-5.svg',
      duration: '۰:۰۶:۴۰',
      verse_key: '67:1',
      verse_arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      translation: 'مبارک است ذات آن که ملک در دست اوست و او بر هر چیز قادر است.',
      transliteration: 'Tabārakalladhī biyadihil-mulku wahuwa \'alā kulli shay\'in qadīr',
      reciter_name: 'عبدالباسط عبدالصمد',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره ملک', 'عبدالباسط', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-01-01'),
    },
    {
      id: 'video-6',
      title: 'تلاوت سوره فاتحه — مشاری عفاسی',
      description: 'تلاوت سوره حمد با صدای مشاری راشد عفاسی (QuranicAudio).',
      category: 'recitation',
      media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-6.svg',
      duration: '۰:۰۱:۰۵',
      verse_key: '1:1',
      reciter_name: 'مشاری راشد عفاسی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره فاتحه', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
      status: 'published',
      created_date: new Date('2024-05-15'),
    },
    {
      id: 'video-7',
      title: 'تلاوت آیه استعينوا بالصبر — مشاری عفاسی',
      description: 'تلاوت آیه ۱۵۳ سوره بقره با صدای مشاری عفاسی (EveryAyah).',
      category: 'recitation',
      media_url: 'https://everyayah.com/data/Alafasy_128kbps/002153.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-7.svg',
      duration: '۰:۰۰:۳۵',
      verse_key: '2:153',
      verse_arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
      translation: 'ای مؤمنان! از صبر و نماز مدد جویید، زیرا خدا با صابران است.',
      transliteration: "Yā ayyuhal-ladhīna āmanūs-ta'īnū biṣ-ṣabri waṣ-ṣalāh",
      reciter_name: 'مشاری راشد عفاسی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['بقره', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-02-28'),
    },
    {
      id: 'video-8',
      title: 'تلاوت سوره الرحمن — سعد الغامدی (mp3quran)',
      description: 'تلاوت سوره الرحمن با صدای سعد الغامدی (منبع mp3quran).',
      category: 'recitation',
      media_url: 'https://server8.mp3quran.net/s_gmd/055.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-8.svg',
      duration: '۰:۱۱:۲۰',
      verse_key: '55:1',
      reciter_name: 'سعد الغامدی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره الرحمن', 'الغامدی', 'صوتی']),
      status: 'published',
      created_date: new Date('2024-05-10'),
    },
    {
      id: 'video-9',
      title: 'تلاوت ترتیل سوره یاسین — سعد الغامدی',
      description: 'تلاوت سوره یاسین با صدای سعد الغامدی (منبع mp3quran).',
      category: 'recitation',
      media_url: 'https://server7.mp3quran.net/s_gmd/036.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-9.svg',
      duration: '۱:۱۰:۰۰',
      verse_key: '36:1',
      verse_arabic: 'يس',
      translation: 'یس.',
      transliteration: 'Yā Sīn',
      reciter_name: 'سعد الغامدی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['ترتیل', 'سوره یاسین', 'الغامدی', 'صوتی']),
      status: 'verified',
      created_date: new Date('2024-03-01'),
    },
    {
      id: 'video-10',
      title: 'تلاوت آیه الکرسی — مشاری عفاسی',
      description: 'تلاوت کوتاه آیه الکرسی با صدای مشاری عفاسی (EveryAyah).',
      category: 'recitation',
      media_url: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
      media_type: 'audio',
      thumbnail_url: '/uploads/thumbs/video-10.svg',
      duration: '۰:۰۰:۴۵',
      verse_key: '2:255',
      reciter_name: 'مشاری راشد عفاسی',
      is_live: false,
      is_competition: false,
      views_count: 0,
      likes_count: 0,
      tags: JSON.stringify(['آیت الکرسی', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
      status: 'published',
      created_date: new Date('2024-05-20'),
    },
  ];

  for (const v of videos) {
    const existing = await prisma.video.findFirst({ where: { id: v.id } });
    if (!existing) {
      await prisma.video.create({ data: v });
    }
  }
  console.log(`✅ ${videos.length} Videos seeded.`);

  const existingKhatm = await prisma.khatmSession.findFirst();
  if (!existingKhatm) {
    const khatm1 = await prisma.khatmSession.create({
      data: {
        title: 'ختم نورانی به نیت تعجیل در فرج و سلامتی امام عصر (عج)',
        description: 'دورهمی تلاوت سراسری کاربران آیه پلاس؛ هر جزء هدیه به ساحت مقدس صاحب‌الزمان (عج).',
        intention: 'تعجیل در فرج و عافیت بیماران',
        target_type: 'juz',
        total_parts: 30,
        is_private: false,
        creator_id: admin.id,
        creator_name: admin.full_name,
        creator_avatar: admin.avatar_url,
        status: 'active',
        salawat_count: 313,
        deadline: '۱۴۰۳/۰۹/۳۰',
      },
    });

    // Create 30 parts for Khatm 1
    const partsData1 = [];
    for (let i = 1; i <= 30; i++) {
      let status = 'available';
      let userId = null;
      let userName = null;
      let userAvatar = null;
      let reservedAt = null;
      let completedAt = null;

      if (i === 1 || i === 30) {
        status = 'completed';
        userId = admin.id;
        userName = admin.full_name;
        userAvatar = admin.avatar_url;
        reservedAt = new Date(Date.now() - 3600000 * 24);
        completedAt = new Date();
      } else if (i === 2 || i === 7) {
        status = 'reserved';
        userId = demoScholar.id;
        userName = demoScholar.full_name;
        userAvatar = demoScholar.avatar_url;
        reservedAt = new Date();
      }

      partsData1.push({
        session_id: khatm1.id,
        part_number: i,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        status,
        reserved_at: reservedAt,
        completed_at: completedAt,
      });
    }
    await prisma.khatmPart.createMany({ data: partsData1 });

    // Seed initial prayers/duas
    await prisma.khatmDua.createMany({
      data: [
        {
          session_id: khatm1.id,
          user_id: admin.id,
          user_name: admin.full_name,
          user_avatar: admin.avatar_url,
          message: 'اللهم عجل لولیک الفرج و العافیة و النصر. نایب‌الزیاره و دعاگوی همه عزیزان در این ختم مبارک هستیم.',
        },
        {
          session_id: khatm1.id,
          user_id: demoScholar.id,
          user_name: demoScholar.full_name,
          user_avatar: demoScholar.avatar_url,
          message: 'تلاوت جزء هفتم به برکت انفاس قدسی قرآن کریم آغاز شد. التماس دعا از همراهان قرآنی.',
        },
      ],
    });

    // Session 2: 60 Hezb circle
    const khatm2 = await prisma.khatmSession.create({
      data: {
        title: 'محفل هفتگی انس با قرآن کریم (۶۰ حزب)',
        description: 'ختم حزب‌محور برای مطالعه آسان‌تر و مشارکت اعضای خانواده و دوستان آیه پلاس.',
        intention: 'شادی روح شهدا و درگذشتگان',
        target_type: 'hezb',
        total_parts: 60,
        is_private: false,
        creator_id: demoScholar.id,
        creator_name: demoScholar.full_name,
        creator_avatar: demoScholar.avatar_url,
        status: 'active',
        salawat_count: 124,
        deadline: '۱۴۰۳/۱۰/۱۵',
      },
    });

    const partsData2 = [];
    for (let h = 1; h <= 60; h++) {
      let status = 'available';
      let userId = null;
      let userName = null;
      let userAvatar = null;
      if (h === 1) {
        status = 'completed';
        userId = demoScholar.id;
        userName = demoScholar.full_name;
        userAvatar = demoScholar.avatar_url;
      }
      partsData2.push({
        session_id: khatm2.id,
        part_number: h,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar,
        status,
      });
    }
    await prisma.khatmPart.createMany({ data: partsData2 });
    console.log(`✅ Khatm Sessions and Parts seeded successfully.`);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
