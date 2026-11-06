import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Spiritual Levels Configuration
export const SPIRITUAL_LEVELS = [
  { level: 1, name: 'مستمع', minXp: 0, maxXp: 250, badge: 'Ear', title: 'مستمع کلام وحی' },
  { level: 2, name: 'قاری', minXp: 251, maxXp: 750, badge: 'BookOpen', title: 'قاری و همراه آیات' },
  { level: 3, name: 'اهل تدبر', minXp: 751, maxXp: 1800, badge: 'Sparkles', title: 'تدبرگر در مفاهیم قرآن' },
  { level: 4, name: 'حافظ', minXp: 1801, maxXp: 3800, badge: 'HeartHandshake', title: 'انس‌گیرنده و حافظ آیات' },
  { level: 5, name: 'خادم قرآن', minXp: 3801, maxXp: 999999, badge: 'Crown', title: 'خادم و مروج مکتب وحی' },
];

export function calculateSpiritualLevel(totalXp) {
  for (let i = SPIRITUAL_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= SPIRITUAL_LEVELS[i].minXp) {
      return SPIRITUAL_LEVELS[i];
    }
  }
  return SPIRITUAL_LEVELS[0];
}

// Master Badge Definitions
export const ALL_BADGES = [
  {
    badge_id: 'first_step',
    badge_name: 'گام نخستین',
    badge_icon: 'Footprints',
    description: 'شروع مسیر نورانی قرائت و انس با کلام وحی',
    tier: 'bronze',
  },
  {
    badge_id: 'streak_3',
    badge_name: 'پوینده سحرخیز',
    badge_icon: 'Flame',
    description: '۳ روز استریک پیاپی قرائت قرآن',
    tier: 'bronze',
  },
  {
    badge_id: 'streak_7',
    badge_name: 'همراه هفت‌روزه نور',
    badge_icon: 'Flame',
    description: 'یک هفته مداومت بی‌وقفه در انس با قرآن کریم',
    tier: 'silver',
  },
  {
    badge_id: 'streak_30',
    badge_name: 'ماه پربرکت استقامت',
    badge_icon: 'Award',
    description: '۳۰ روز استریک متوالی قرائت و تدبر در آیات',
    tier: 'gold',
  },
  {
    badge_id: 'quiz_seeker',
    badge_name: 'جوینده معارف',
    badge_icon: 'Brain',
    description: 'پاسخ صحیح به کوییز مفهومی آیه روز',
    tier: 'bronze',
  },
  {
    badge_id: 'quiz_master',
    badge_name: 'اهل حکمت و معرفت',
    badge_icon: 'Sparkles',
    description: 'تسلط بر مفاهیم و تدبر با ثبت امتیاز کامل کوییزها',
    tier: 'silver',
  },
  {
    badge_id: 'khatm_companion',
    badge_name: 'یار ختم جمعی',
    badge_icon: 'HeartHandshake',
    description: 'مشارکت در ختم جمعی قرآن کریم و نذر صلوات',
    tier: 'silver',
  },
  {
    badge_id: 'tadabbur_champion',
    badge_name: 'نگین تدبر',
    badge_icon: 'Crown',
    description: 'دستیابی به سطح اهل تدبر و کسب بیش از ۷۵۰ امتیاز معنوی',
    tier: 'diamond',
  },
];

// Curated daily quiz bank based on Quranic themes
const DAILY_QUIZZES = [
  {
    id: 'quiz_24_35',
    verse_key: '24:35',
    theme: 'آیه نور و هدایت الهی',
    question: 'در آیه شریفه «اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ»، خداوند نور را به چه تمثیلی نزدیک می‌فرماید؟',
    options: [
      'چراغدانی که در آن چراغی افروخته درون شیشه‌ای درخشان است (مشکاة فیها مصباح)',
      'خورشیدی درخشان در اوج آسمان بی‌پایان',
      'رودی از روشنایی در میان کوهستان‌های سرسبز',
      'ماه تمام در شبی صاف و بی‌ابر',
    ],
    correct_index: 0,
    explanation: 'خداوند در تمثیل نور خویش می‌فرماید: «مَثَلُ نُورِهِ کَمِشْکَاةٍ فِیهَا مِصْبَاحٌ الْمِصْبَاحُ فِی زُجَاجَةٍ» که کنایه از هدایت روشن، خالص و منزه الهی است.',
  },
  {
    id: 'quiz_14_7',
    verse_key: '14:7',
    theme: 'سنت شکرگزاری و ازدیاد نعمت',
    question: 'بر اساس آیه ۷ سوره ابراهیم «لَئِن شَکَرْتُمْ لَأَزِیدَنَّکُمْ»، حقیقت شکر چیست و چه نتیجه‌ای دارد؟',
    options: [
      'صرف گفتن الحمدلله به زبان بدون تغییر در عمل',
      'استفاده بهینه و هدفمند از نعمت در مسیر رضایت الهی که موجب رشد و ازدیاد نعمت می‌شود',
      'بخشش همه اموال و دارایی‌ها به دیگران',
      'روزه گرفتن دائمی در تمام روزهای سال',
    ],
    correct_index: 1,
    explanation: 'شکر حقیقی استفاده صحیح از نعمت در مسیری است که خداوند مقدر فرموده، که بنابر وعده الهی موجب فزونی ظرفیت و برکت نعمت می‌گردد.',
  },
  {
    id: 'quiz_39_53',
    verse_key: '39:53',
    theme: 'امید و رحمت بیکران الهی',
    question: 'پیام محوری و کلیدی آیه «قُلْ یَا عِبَادِیَ الَّذِینَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ» چیست؟',
    options: [
      'نهی مطلق از ناامیدی از رحمت و مغفرت جامع پروردگار',
      'توجیه اشتباهات گذشته بدون لزوم بازگشت و توبه',
      'مجازات فوری و بدون مهلت بندگان گنهکار',
      'عدم نیاز به رحمت الهی برای کسانی که کار نیک کرده‌اند',
    ],
    correct_index: 0,
    explanation: 'این آیه امیدبخش‌ترین آیه قرآن دانسته شده که به بندگان تأکید می‌کند هرگز از رحمت بیکران خدا ناامید نشوند: «إِنَّ اللَّهَ یَغْفِرُ الذُّنُوبَ جَمِیعًا».',
  },
  {
    id: 'quiz_65_3',
    verse_key: '65:3',
    theme: 'توکل، کفایت و روزی الهی',
    question: 'در آیه سوم سوره طلاق، ثمره و نتیجه «توکل بر خداوند» چگونه بیان شده است؟',
    options: [
      'خداوند خود برای او کافی است (فَهُوَ حَسْبُهُ) و از جایی که گمان ندارد روزی می‌دهد',
      'انسان باید دست از هرگونه کار و فعالیت دنیوی بردارد',
      'روزی انسان کاهش می‌یابد تا ایمانش آزموده شود',
      'نتایج صرفاً وابسته به شانس و تصادف است',
    ],
    correct_index: 0,
    explanation: 'قرآن کریم صراحتاً می‌فرماید: «وَمَن یَتَوَکَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ».',
  },
];

// Helper: Get today's YYYY-MM-DD in UTC
function getTodayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/gamification/status
router.get('/status', authenticate({ required: false }), async (req, res) => {
  try {
    const today = getTodayDateString();

    if (!req.user) {
      // Guest status defaults
      return res.json({
        isGuest: true,
        streak_days: 0,
        max_streak: 0,
        total_xp: 0,
        spiritual_level: 'مستمع',
        current_level_info: calculateSpiritualLevel(0),
        today_quests: [
          {
            quest_type: 'reading',
            title: 'تلاوت و استماع آیه روز',
            description: 'حداقل ۲ دقیقه حضور معنوی یا گوش سپردن به تلاوت نورانی',
            target_value: 1,
            progress_value: 0,
            is_completed: false,
            xp_rewarded: 50,
          },
          {
            quest_type: 'quiz',
            title: 'تدبر مفهومی و کوییز آیه روز',
            description: 'پاسخ صحیح به پرسش تأملی از مفاهیم و تفسیر آیه منتخب',
            target_value: 1,
            progress_value: 0,
            is_completed: false,
            xp_rewarded: 40,
          },
          {
            quest_type: 'social',
            title: 'مشارکت معنوی در ختم یا جامعه',
            description: 'ثبت صلوات، ارسال دعا روی دیوار یا بازتاب در جامعه',
            target_value: 1,
            progress_value: 0,
            is_completed: false,
            xp_rewarded: 30,
          },
        ],
        unlocked_badges: [],
        all_badges: ALL_BADGES,
        completed_quests_count: 0,
        all_quests_completed: false,
      });
    }

    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        streak_days: true,
        max_streak: true,
        last_active_date: true,
        total_xp: true,
        spiritual_level: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check streak reset if user missed yesterday and today
    let streakDays = user.streak_days || 0;
    if (user.last_active_date) {
      const lastDate = new Date(user.last_active_date).toISOString().slice(0, 10);
      const yesterday = getYesterdayDateString();
      if (lastDate !== today && lastDate !== yesterday) {
        // Streak broken
        streakDays = 0;
      }
    }

    // Fetch user quests for today
    let quests = await prisma.dailyQuestProgress.findMany({
      where: { user_id: userId, date: today },
    });

    const defaultQuests = [
      {
        quest_type: 'reading',
        title: 'تلاوت و استماع آیه روز',
        description: 'حداقل ۲ دقیقه حضور معنوی یا گوش سپردن به تلاوت نورانی',
        target_value: 1,
        progress_value: 0,
        is_completed: false,
        xp_rewarded: 50,
      },
      {
        quest_type: 'quiz',
        title: 'تدبر مفهومی و کوییز آیه روز',
        description: 'پاسخ صحیح به پرسش تأملی از مفاهیم و تفسیر آیه منتخب',
        target_value: 1,
        progress_value: 0,
        is_completed: false,
        xp_rewarded: 40,
      },
      {
        quest_type: 'social',
        title: 'مشارکت معنوی در ختم یا جامعه',
        description: 'ثبت صلوات، ارسال دعا روی دیوار یا بازتاب در جامعه',
        target_value: 1,
        progress_value: 0,
        is_completed: false,
        xp_rewarded: 30,
      },
    ];

    // Merge database quest progress with default definitions
    const mergedQuests = defaultQuests.map((def) => {
      const match = quests.find((q) => q.quest_type === def.quest_type);
      if (match) {
        return {
          ...def,
          progress_value: match.progress_value,
          is_completed: match.is_completed,
        };
      }
      return def;
    });

    // Fetch user unlocked badges
    const userBadges = await prisma.userBadge.findMany({
      where: { user_id: userId },
    });

    const unlockedBadgeIds = new Set(userBadges.map((b) => b.badge_id));
    const allBadgesWithStatus = ALL_BADGES.map((b) => ({
      ...b,
      unlocked: unlockedBadgeIds.has(b.badge_id),
      unlocked_at: userBadges.find((ub) => ub.badge_id === b.badge_id)?.unlocked_at || null,
    }));

    const currentLevelInfo = calculateSpiritualLevel(user.total_xp || 0);
    const completedCount = mergedQuests.filter((q) => q.is_completed).length;

    res.json({
      isGuest: false,
      streak_days: streakDays,
      max_streak: user.max_streak || 0,
      total_xp: user.total_xp || 0,
      spiritual_level: currentLevelInfo.name,
      current_level_info: currentLevelInfo,
      today_quests: mergedQuests,
      unlocked_badges: userBadges,
      all_badges: allBadgesWithStatus,
      completed_quests_count: completedCount,
      all_quests_completed: completedCount === 3,
    });
  } catch (err) {
    console.error('Gamification status error:', err);
    res.status(500).json({ message: 'خطا در دریافت وضعیت گیمیفیکیشن', error: err.message });
  }
});

// GET /api/gamification/daily-content
router.get('/daily-content', async (req, res) => {
  try {
    // Pick today's quiz deterministically by day index
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quizIndex = dayOfYear % DAILY_QUIZZES.length;
    const quiz = DAILY_QUIZZES[quizIndex];

    // Fetch related verse if exists
    const verse = await prisma.verse.findFirst({
      where: { verse_key: quiz.verse_key },
    });

    res.json({
      date: getTodayDateString(),
      quiz: {
        id: quiz.id,
        verse_key: quiz.verse_key,
        theme: quiz.theme,
        question: quiz.question,
        options: quiz.options,
        // Do NOT send correct_index to prevent inspecting frontend source
        hasExplanation: true,
      },
      featured_verse: verse || {
        verse_key: quiz.verse_key,
        arabic: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ کَمِشْکَاةٍ فِیهَا مِصْبَاحٌ',
        translation: 'خداوند نور آسمان‌ها و زمین است؛ مثل نور خداوند همانند چراغدانی است که در آن چراغی پرفروغ باشد...',
        audio_url: 'https://everyayah.com/data/Alafasy_128kbps/024035.mp3',
      },
    });
  } catch (err) {
    console.error('Daily content error:', err);
    res.status(500).json({ message: 'خطا در دریافت محتوای روز', error: err.message });
  }
});

// Helper: Award Badge if not already unlocked
async function maybeAwardBadge(userId, badgeId) {
  const existing = await prisma.userBadge.findFirst({
    where: { user_id: userId, badge_id: badgeId },
  });
  if (existing) return null;

  const def = ALL_BADGES.find((b) => b.badge_id === badgeId);
  if (!def) return null;

  const newBadge = await prisma.userBadge.create({
    data: {
      user_id: userId,
      badge_id: def.badge_id,
      badge_name: def.badge_name,
      badge_icon: def.badge_icon,
      description: def.description,
      tier: def.tier,
    },
  });
  return newBadge;
}

// POST /api/gamification/track-activity
router.post('/track-activity', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, duration_seconds = 30 } = req.body; // 'reading' | 'audio' | 'social'

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let streakDays = user.streak_days || 0;
    const lastActiveStr = user.last_active_date
      ? new Date(user.last_active_date).toISOString().slice(0, 10)
      : null;

    let streakUpdated = false;
    if (lastActiveStr === yesterday) {
      // Continued streak from yesterday
      streakDays += 1;
      streakUpdated = true;
    } else if (lastActiveStr !== today) {
      // First active day or streak was broken
      streakDays = 1;
      streakUpdated = true;
    }

    const maxStreak = Math.max(user.max_streak || 0, streakDays);

    let earnedXp = 10; // Base session XP
    const newlyUnlockedBadges = [];

    // Award 'first_step' badge
    const firstStepBadge = await maybeAwardBadge(userId, 'first_step');
    if (firstStepBadge) newlyUnlockedBadges.push(firstStepBadge);

    // Check streak milestones
    if (streakDays >= 3) {
      const b3 = await maybeAwardBadge(userId, 'streak_3');
      if (b3) newlyUnlockedBadges.push(b3);
    }
    if (streakDays >= 7) {
      const b7 = await maybeAwardBadge(userId, 'streak_7');
      if (b7) newlyUnlockedBadges.push(b7);
    }
    if (streakDays >= 30) {
      const b30 = await maybeAwardBadge(userId, 'streak_30');
      if (b30) newlyUnlockedBadges.push(b30);
    }

    // Quest 1: Reading quest check
    if (type === 'reading' || type === 'audio') {
      const quest = await prisma.dailyQuestProgress.findFirst({
        where: { user_id: userId, date: today, quest_type: 'reading' },
      });

      if (!quest) {
        await prisma.dailyQuestProgress.create({
          data: {
            user_id: userId,
            date: today,
            quest_type: 'reading',
            title: 'تلاوت و استماع آیه روز',
            is_completed: true,
            progress_value: 1,
            target_value: 1,
            xp_rewarded: 50,
          },
        });
        earnedXp += 50;
      } else if (!quest.is_completed) {
        await prisma.dailyQuestProgress.update({
          where: { id: quest.id },
          data: { is_completed: true, progress_value: 1, xp_rewarded: 50 },
        });
        earnedXp += 50;
      }
    }

    const newTotalXp = (user.total_xp || 0) + earnedXp;
    const newLevelInfo = calculateSpiritualLevel(newTotalXp);

    if (newLevelInfo.name === 'اهل تدبر' || newLevelInfo.name === 'حافظ' || newLevelInfo.name === 'خادم قرآن') {
      const tb = await maybeAwardBadge(userId, 'tadabbur_champion');
      if (tb) newlyUnlockedBadges.push(tb);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        streak_days: streakDays,
        max_streak: maxStreak,
        last_active_date: new Date(),
        total_xp: newTotalXp,
        spiritual_level: newLevelInfo.name,
      },
    });

    res.json({
      success: true,
      earned_xp: earnedXp,
      streak_days: streakDays,
      max_streak: maxStreak,
      streak_updated: streakUpdated,
      total_xp: newTotalXp,
      spiritual_level: newLevelInfo.name,
      current_level_info: newLevelInfo,
      new_badges: newlyUnlockedBadges,
    });
  } catch (err) {
    console.error('Track activity error:', err);
    res.status(500).json({ message: 'خطا در ثبت فعالیت', error: err.message });
  }
});

// POST /api/gamification/complete-quest
router.post('/complete-quest', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { quest_type, answer_index } = req.body;
    const today = getTodayDateString();

    if (!['quiz', 'social'].includes(quest_type)) {
      return res.status(400).json({ message: 'نوع مأموریت نامعتبر است' });
    }

    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quiz = DAILY_QUIZZES[dayOfYear % DAILY_QUIZZES.length];

    let xpToAward = 0;
    const newlyUnlockedBadges = [];

    if (quest_type === 'quiz') {
      if (answer_index === undefined || answer_index !== quiz.correct_index) {
        return res.status(400).json({
          success: false,
          correct: false,
          message: 'پاسخ انتخاب‌شده نادرست است. لطفاً تأمل فرموده و دوباره تلاش کنید.',
          explanation: quiz.explanation,
        });
      }

      xpToAward = 40;
      const bQuiz = await maybeAwardBadge(userId, 'quiz_seeker');
      if (bQuiz) newlyUnlockedBadges.push(bQuiz);
    } else if (quest_type === 'social') {
      xpToAward = 30;
      const bSocial = await maybeAwardBadge(userId, 'khatm_companion');
      if (bSocial) newlyUnlockedBadges.push(bSocial);
    }

    // Upsert quest in DB
    const existingQuest = await prisma.dailyQuestProgress.findFirst({
      where: { user_id: userId, date: today, quest_type },
    });

    let alreadyAwarded = false;
    if (existingQuest) {
      if (existingQuest.is_completed) {
        alreadyAwarded = true;
      } else {
        await prisma.dailyQuestProgress.update({
          where: { id: existingQuest.id },
          data: { is_completed: true, progress_value: 1, xp_rewarded: xpToAward },
        });
      }
    } else {
      await prisma.dailyQuestProgress.create({
        data: {
          user_id: userId,
          date: today,
          quest_type,
          title: quest_type === 'quiz' ? 'تدبر مفهومی و کوییز آیه روز' : 'مشارکت معنوی در ختم یا جامعه',
          is_completed: true,
          progress_value: 1,
          target_value: 1,
          xp_rewarded: xpToAward,
        },
      });
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!alreadyAwarded && xpToAward > 0) {
      const newTotalXp = (user.total_xp || 0) + xpToAward;
      const newLevel = calculateSpiritualLevel(newTotalXp);
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          total_xp: newTotalXp,
          spiritual_level: newLevel.name,
        },
      });
    }

    res.json({
      success: true,
      correct: true,
      already_awarded: alreadyAwarded,
      xp_awarded: alreadyAwarded ? 0 : xpToAward,
      total_xp: user.total_xp,
      spiritual_level: user.spiritual_level,
      explanation: quiz.explanation,
      new_badges: newlyUnlockedBadges,
    });
  } catch (err) {
    console.error('Complete quest error:', err);
    res.status(500).json({ message: 'خطا در ثبت انجام مأموریت', error: err.message });
  }
});

// GET /api/gamification/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'xp' } = req.query; // 'xp' | 'streak'

    const orderBy = type === 'streak' ? { streak_days: 'desc' } : { total_xp: 'desc' };

    const topUsers = await prisma.user.findMany({
      take: 25,
      orderBy,
      select: {
        id: true,
        full_name: true,
        avatar_url: true,
        streak_days: true,
        max_streak: true,
        total_xp: true,
        spiritual_level: true,
      },
    });

    // Anonymize display names for privacy if user name is null or phone
    const formatted = topUsers.map((u, index) => {
      let displayName = u.full_name || 'کاربر نورانی آیه';
      if (displayName.startsWith('09') || displayName.includes('@')) {
        displayName = 'کاربر ' + displayName.slice(-4);
      }

      const levelInfo = calculateSpiritualLevel(u.total_xp || 0);

      // Determine League
      let league = 'نور'; // Bronze
      let leagueColor = 'amber';
      if (u.total_xp >= 1500) {
        league = 'فردوس'; // Diamond / Emerald
        leagueColor = 'emerald';
      } else if (u.total_xp >= 600) {
        league = 'تسنیم'; // Gold
        leagueColor = 'yellow';
      } else if (u.total_xp >= 200) {
        league = 'کوثر'; // Silver
        leagueColor = 'teal';
      }

      return {
        rank: index + 1,
        id: u.id,
        name: displayName,
        avatar_url: u.avatar_url,
        streak_days: u.streak_days || 0,
        total_xp: u.total_xp || 0,
        spiritual_level: u.spiritual_level || levelInfo.name,
        league,
        leagueColor,
      };
    });

    res.json({
      leaderboard: formatted,
      type,
      total_participants: topUsers.length,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'خطا در بارگذاری جدول رده‌بندی', error: err.message });
  }
});

export default router;
