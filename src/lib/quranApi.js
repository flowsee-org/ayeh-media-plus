// Robust Quran data layer: multi-source with localStorage caching + retry + CDN fallback.
// Primary: alquran.cloud  |  Fallback: fawazahmed0/quran-api CDN  |  Audio: cdn.islamic.network
import { SURAH_DATA } from "./surahData";

const PRIMARY = "https://api.alquran.cloud/v1";
const EDITIONS = "quran-uthmani,fa.makarem,ar.alafasy,en.transliteration";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";

const CACHE_PREFIX = "quran_v3:";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ── localStorage cache ── */
function lsGet(key) {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;
    const { data, ts } = JSON.parse(item);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch { return null; }
}
function lsSet(key, data) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota */ }
}

/* ── In-memory cache ── */
const memCache = new Map();

/* ── Fetch with retry ── */
async function fetchJSON(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
}

export const RECITERS = [
  { id: "ar.alafasy", name: "مشاری العفاسی", bitrate: 128, style: "ترتیل" },
  { id: "ar.parhizgar", name: "استاد شهریار پرهیزگار", bitrate: 48, style: "ترتیل آموزشی" },
  { id: "ar.abdulbasitmurattal", name: "استاد عبدالباسط عبدالصمد", bitrate: 192, style: "ترتیل" },
  { id: "ar.minshawi", name: "استاد محمد صدیق منشاوی", bitrate: 128, style: "ترتیل" },
];

/* ── Compute global verse number (1–6236) for audio URL construction ── */
export function getGlobalVerseNumber(surah, ayah) {
  let total = 0;
  for (let i = 0; i < surah - 1; i++) total += SURAH_DATA[i].numberOfAyahs;
  return total + ayah;
}
export function getAudioUrl(surah, ayah, reciterId = "ar.alafasy") {
  const reciter = RECITERS.find((r) => r.id === reciterId) || RECITERS[0];
  const verseNum = getGlobalVerseNumber(surah, ayah);
  return `https://cdn.islamic.network/quran/audio/${reciter.bitrate}/${reciter.id}/${verseNum}.mp3`;
}
export const audioUrl = getAudioUrl;

/* ── Surah list — always local, instant, never fails ── */
export function getSurahList() {
  return Promise.resolve(SURAH_DATA);
}

/* ── Full surah with all verses ── */
export async function getSurah(n) {
  const cacheKey = `surah:${n}`;
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = lsGet(cacheKey);
  if (cached) { memCache.set(cacheKey, cached); return cached; }

  // Try primary API (alquran.cloud)
  try {
    const json = await fetchJSON(`${PRIMARY}/surah/${n}/editions/${EDITIONS}`);
    const [ar, fa, au, tr] = json.data;
    const result = {
      number: ar.number,
      name: ar.name,
      englishName: ar.englishName,
      persianName: SURAH_DATA[n - 1]?.persianName || ar.englishName || "",
      revelationType: ar.revelationType,
      numberOfAyahs: ar.numberOfAyahs,
      ayahs: ar.ayahs.map((a, i) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        manzil: a.manzil,
        ruku: a.ruku,
        sajda: a.sajda,
        arabic: a.text,
        translation: fa.ayahs[i]?.text || "",
        audio: au.ayahs[i]?.audio || audioUrl(n, a.numberInSurah),
        transliteration: tr.ayahs[i]?.text || "",
      })),
    };
    memCache.set(cacheKey, result);
    lsSet(cacheKey, result);
    return result;
  } catch (primaryErr) {
    // Fallback to CDN (fawazahmed0/quran-api)
    try {
      const [arJson, faJson, trJson] = await Promise.all([
        fetchJSON(`${CDN_BASE}/ara-quranuthmaniquran/${n}.json`),
        fetchJSON(`${CDN_BASE}/per-kingfahadcomplex/${n}.json`),
        fetchJSON(`${CDN_BASE}/eng-transliteration/${n}.json`).catch(() => null),
      ]);
      const arEntries = Object.values(arJson).filter(e => Number(e.surah) === n);
      const faEntries = Object.values(faJson).filter(e => Number(e.surah) === n);
      const trEntries = trJson ? Object.values(trJson).filter(e => Number(e.surah) === n) : [];
      const surahMeta = SURAH_DATA[n - 1];

      const ayahs = arEntries.map((arEntry) => {
        const ayahNum = Number(arEntry.ayah);
        const faEntry = faEntries.find(f => Number(f.ayah) === ayahNum);
        const trEntry = trEntries.find(t => Number(t.ayah) === ayahNum);
        return {
          number: getGlobalVerseNumber(n, ayahNum),
          numberInSurah: ayahNum,
          juz: 0,
          page: 0,
          hizbQuarter: 0,
          manzil: 0,
          ruku: 0,
          sajda: false,
          arabic: arEntry.text,
          translation: faEntry?.text || "",
          audio: audioUrl(n, ayahNum),
          transliteration: trEntry?.text || "",
        };
      });

      const result = {
        number: n,
        name: surahMeta?.name || "",
        englishName: surahMeta?.persianName || "",
        persianName: surahMeta?.persianName || "",
        revelationType: surahMeta?.revelationType || "",
        numberOfAyahs: surahMeta?.numberOfAyahs || ayahs.length,
        ayahs,
      };
      memCache.set(cacheKey, result);
      lsSet(cacheKey, result);
      return result;
    } catch (fallbackErr) {
      throw new Error(`بارگذاری سوره ${n} ناموفق بود. لطفاً دوباره تلاش کنید.`);
    }
  }
}

/* ── Single ayah ── */
export async function getAyah(surah, ayah) {
  const cacheKey = `ayah:${surah}:${ayah}`;
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = lsGet(cacheKey);
  if (cached) { memCache.set(cacheKey, cached); return cached; }

  const ref = `${surah}:${ayah}`;
  try {
    const json = await fetchJSON(`${PRIMARY}/ayah/${ref}/editions/${EDITIONS}`);
    const [ar, fa, au, tr] = json.data;
    const surahInfo = typeof ar.surah === "object" ? ar.surah : null;
    const result = {
      surah: surahInfo?.number || Number(ref.split(":")[0]),
      surahName: surahInfo?.name || SURAH_DATA[surah - 1]?.name || "",
      surahEnglishName: surahInfo?.englishName || SURAH_DATA[surah - 1]?.persianName || "",
      revelationType: surahInfo?.revelationType || SURAH_DATA[surah - 1]?.revelationType || "",
      ayah: ar.numberInSurah,
      number: ar.number,
      juz: ar.juz,
      page: ar.page,
      hizbQuarter: ar.hizbQuarter,
      arabic: ar.text,
      translation: fa.text,
      audio: au?.audio || audioUrl(surah, ar.numberInSurah),
      transliteration: tr?.text || "",
    };
    memCache.set(cacheKey, result);
    lsSet(cacheKey, result);
    return result;
  } catch (primaryErr) {
    // Fallback: construct from surah data
    try {
      const surahData = await getSurah(surah);
      const ayahData = surahData.ayahs.find(a => a.numberInSurah === ayah);
      if (ayahData) {
        const result = {
          surah,
          surahName: surahData.name,
          surahEnglishName: surahData.persianName,
          revelationType: surahData.revelationType,
          ayah,
          number: ayahData.number,
          juz: ayahData.juz,
          page: ayahData.page,
          hizbQuarter: ayahData.hizbQuarter,
          arabic: ayahData.arabic,
          translation: ayahData.translation,
          audio: ayahData.audio,
        };
        memCache.set(cacheKey, result);
        lsSet(cacheKey, result);
        return result;
      }
      throw new Error("آیه یافت نشد");
    } catch (fallbackErr) {
      throw new Error(`بارگذاری آیه ${ref} ناموفق بود.`);
    }
  }
}

/* ── Juz start references (surah:ayah) for fallback construction ── */
const JUZ_STARTS = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111],
  [7, 88], [8, 41], [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75],
  [21, 1], [23, 1], [25, 21], [27, 56], [29, 46], [33, 31], [36, 28], [39, 32],
  [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

function isAyahInJuz(surahNum, ayahNum, juzNum) {
  const [s, a] = JUZ_STARTS[juzNum - 1];
  const end = juzNum < 30 ? JUZ_STARTS[juzNum] : null;
  if (surahNum < s || (surahNum === s && ayahNum < a)) return false;
  if (end) {
    if (surahNum > end[0] || (surahNum === end[0] && ayahNum >= end[1])) return false;
  }
  return true;
}

/* ── All ayahs of a juz (1..30), grouped by surah ── */
export async function getJuz(n) {
  const cacheKey = `juz:${n}`;
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);
  const cached = lsGet(cacheKey);
  if (cached) { memCache.set(cacheKey, cached); return cached; }

  // Primary: 2 editions (keeps response small — 4 editions times out)
  try {
    const json = await fetchJSON(`${PRIMARY}/juz/${n}/editions/quran-uthmani,fa.makarem`);
    const [ar, fa] = json.data;
    const groups = {};
    ar.ayahs.forEach((a, i) => {
      const surahNum = typeof a.surah === "object" ? a.surah.number : a.surah;
      if (!groups[surahNum]) groups[surahNum] = { surah: surahNum, ayahs: [] };
      groups[surahNum].ayahs.push({
        number: a.number,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        arabic: a.text,
        translation: fa.ayahs[i]?.text || "",
        audio: audioUrl(surahNum, a.numberInSurah),
      });
    });
    const result = Object.values(groups);
    memCache.set(cacheKey, result);
    lsSet(cacheKey, result);
    return result;
  } catch (primaryErr) {
    // Fallback: construct juz from surah data using known juz boundaries
    try {
      const [startSurah] = JUZ_STARTS[n - 1];
      const endSurah = n < 30 ? JUZ_STARTS[n][0] : 114;
      const surahsToFetch = [];
      for (let s = startSurah; s <= endSurah; s++) surahsToFetch.push(s);
      // Also include the surah before start (juz may start mid-surah)
      if (startSurah > 1 && !surahsToFetch.includes(startSurah - 1)) {
        surahsToFetch.unshift(startSurah - 1);
      }

      const surahResults = await Promise.all(
        surahsToFetch.map((s) => getSurah(s).catch(() => null))
      );

      const groups = {};
      surahResults.forEach((surahData) => {
        if (!surahData) return;
        const juzAyahs = surahData.ayahs.filter((a) =>
          isAyahInJuz(surahData.number, a.numberInSurah, n)
        );
        if (juzAyahs.length > 0) {
          groups[surahData.number] = {
            surah: surahData.number,
            ayahs: juzAyahs.map((a) => ({
              number: a.number,
              numberInSurah: a.numberInSurah,
              juz: a.juz || n,
              page: a.page,
              hizbQuarter: a.hizbQuarter,
              arabic: a.arabic,
              translation: a.translation,
              audio: a.audio || audioUrl(surahData.number, a.numberInSurah),
            })),
          };
        }
      });

      const result = Object.values(groups);
      if (result.length === 0) throw new Error("empty");
      memCache.set(cacheKey, result);
      lsSet(cacheKey, result);
      return result;
    } catch (fallbackErr) {
      throw new Error(`بارگذاری جزء ${n} ناموفق بود. لطفاً دوباره تلاش کنید.`);
    }
  }
}