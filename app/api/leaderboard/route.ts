import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Eğer veritabanı bağlantısı yoksa (örn. senin bilgisayarında çalışırken) 
    // sistem çökmesin diye sahte veriler gönderir.
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json([
        { name: 'EDU', score: 15200 },
        { name: 'ALI', score: 8400 },
        { name: 'CAN', score: 3200 },
        { name: 'BOT', score: 1500 }
      ]);
    }
    
    // Veritabanından en yüksek 10 skoru çek (Redis zrange)
    const data: any[] = await kv.zrange('leaderboard', 0, 9, { rev: true, withScores: true });
    const leaderboard = [];
    
    for (let i = 0; i < data.length; i += 2) {
      // İsimlerin çakışmasını önlemek için "EDU#12345" şeklinde kaydettiğimiz isimleri ekranda sadece "EDU" olarak ayırıyoruz
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
    if (!process.env.KV_REST_API_URL) return NextResponse.json({ success: true });
    
    const { name, score } = await req.json();
    const safeName = String(name).substring(0, 3).toUpperCase();
    
    // Aynı isimde birden fazla skor olabilsin diye ismin yanına zaman damgası ekliyoruz
    const member = `${safeName}#${Date.now()}`;
    
    // Redis ZADD komutu ile skoru kaydet
    await kv.zadd('leaderboard', { score, member });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}