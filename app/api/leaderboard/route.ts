import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export async function GET() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return NextResponse.json([
        { name: 'EDU', score: 15200 },
        { name: 'ALI', score: 8400 },
        { name: 'SYS', score: 3200 }
      ]);
    }
    
    const data: any[] = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
    const leaderboard = [];
    
    for (let i = 0; i < data.length; i += 2) {
      const name = String(data[i]).split('#')[0];
      leaderboard.push({ name, score: Number(data[i + 1]) });
    }
    
    return NextResponse.json(leaderboard);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return NextResponse.json({ success: true });
    
    const { name, score } = await req.json();
    const safeName = String(name).substring(0, 3).toUpperCase();
    const member = `${safeName}#${Date.now()}`;
    
    await redis.zadd('leaderboard', { score, member });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}