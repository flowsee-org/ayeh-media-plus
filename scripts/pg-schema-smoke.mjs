#!/usr/bin/env node
/**
 * Isolated PostgreSQL smoke test against schema.production.prisma.
 * Requires DATABASE_URL pointing at a disposable Postgres database.
 * Does not modify production data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stamp = Date.now();
let failed = 0;

function ok(name, cond, detail = '') {
  if (!cond) failed += 1;
  console.log(cond ? `  ✅ ${name}` : `  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('🧪 Isolated PostgreSQL CRUD probe');
  console.log(`   DATABASE_URL host check: ${String(process.env.DATABASE_URL || '').replace(/:[^:@/]+@/, ':***@')}`);

  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  const names = tables.map((t) => t.tablename);
  for (const t of [
    'Verse',
    'Video',
    'Like',
    'Bookmark',
    'Vote',
    'Report',
    'ModerationAction',
    'Follow',
    'Podcast',
    'User',
    'Competition',
    'Comment',
  ]) {
    ok(`table ${t}`, names.includes(t));
  }

  const verse = await prisma.verse.create({
    data: {
      surah_number: 1,
      verse_number: 1,
      verse_key: `pg-test-${stamp}`,
      arabic: 'الحمد',
      translation: 'pg',
      tags: JSON.stringify(['pg']),
    },
  });
  ok('verse create', Boolean(verse.id));
  const verseByKey = await prisma.verse.findUnique({ where: { verse_key: `pg-test-${stamp}` } });
  ok('verse unique key persisted', verseByKey?.id === verse.id);

  const user = await prisma.user.create({
    data: {
      email: `pg.${stamp}@test.local`,
      full_name: 'PG Test',
      role: 'user',
      email_verified: true,
    },
  });
  const followed = await prisma.user.create({
    data: {
      email: `pg.followed.${stamp}@test.local`,
      full_name: 'Followed',
      role: 'user',
      email_verified: true,
    },
  });
  const follow = await prisma.follow.create({
    data: {
      follower_id: user.id,
      follower_name: 'PG Test',
      followed_id: followed.id,
      followed_name: 'Followed',
    },
  });
  ok('follow uses followed_id', follow.followed_id === followed.id);

  const video = await prisma.video.create({
    data: {
      title: `PG Video ${stamp}`,
      reciter_id: user.id,
      media_url: 'https://example.com/v.mp4',
      status: 'published',
    },
  });
  ok('video create', Boolean(video.id));

  const like = await prisma.like.create({ data: { user_id: user.id, video_id: video.id } });
  ok('like create', Boolean(like.id));

  const bookmark = await prisma.bookmark.create({
    data: { user_id: user.id, video_id: video.id },
  });
  ok('bookmark create', Boolean(bookmark.id));

  const report = await prisma.report.create({
    data: {
      reporter_id: user.id,
      target_type: 'video',
      target_id: video.id,
      reason: 'other',
    },
  });
  ok('report create', Boolean(report.id));

  const mod = await prisma.moderationAction.create({
    data: {
      actor_id: user.id,
      actor_name: 'PG Test',
      action: 'warn',
      target_type: 'user',
      target_id: followed.id,
    },
  });
  ok('moderationAction create', Boolean(mod.id));

  const podcast = await prisma.podcast.create({
    data: {
      title: `PG Pod ${stamp}`,
      audio_url: 'https://example.com/a.mp3',
      chapters: JSON.stringify([{ title: 'A', seconds: 0 }]),
      scholar_id: user.id,
    },
  });
  ok('podcast create', Boolean(podcast.id));

  const comment = await prisma.comment.create({
    data: {
      author_id: user.id,
      author_name: 'PG',
      content: 'hi',
      video_id: video.id,
    },
  });
  ok('comment create with optional post_id', Boolean(comment.id));

  const competition = await prisma.competition.create({
    data: {
      title: `PG Comp ${stamp}`,
      organizer_id: user.id,
      organizer_name: 'PG Test',
      status: 'active',
    },
  });
  ok('competition create', Boolean(competition.id));

  const entry = await prisma.competitionEntry.create({
    data: {
      competition_id: competition.id,
      author_id: user.id,
      author_name: 'PG Test',
      title: `PG Entry ${stamp}`,
      media_type: 'audio',
      status: 'approved',
    },
  });
  ok('competitionEntry create', Boolean(entry.id));

  const vote = await prisma.vote.create({
    data: {
      user_id: user.id,
      entry_id: entry.id,
      competition_id: competition.id,
      vote_type: 'upvote',
    },
  });
  ok('vote create', Boolean(vote.id));

  await prisma.vote.delete({ where: { id: vote.id } });
  await prisma.competitionEntry.delete({ where: { id: entry.id } });
  await prisma.competition.delete({ where: { id: competition.id } });
  await prisma.comment.delete({ where: { id: comment.id } });
  await prisma.moderationAction.delete({ where: { id: mod.id } });
  await prisma.report.delete({ where: { id: report.id } });
  await prisma.bookmark.delete({ where: { id: bookmark.id } });
  await prisma.like.delete({ where: { id: like.id } });
  await prisma.video.delete({ where: { id: video.id } });
  await prisma.podcast.delete({ where: { id: podcast.id } });
  await prisma.follow.delete({ where: { id: follow.id } });
  await prisma.verse.delete({ where: { id: verse.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.user.delete({ where: { id: followed.id } });

  console.log(`\nResult: failures=${failed}`);
  if (failed) process.exit(1);
}

main()
  .catch((err) => {
    console.error('Fatal PG probe:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
