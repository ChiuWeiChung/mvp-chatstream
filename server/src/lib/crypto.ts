// src/streamKey.ts
import crypto from 'node:crypto';

// Base64URL（適合放 URL/查詢字串，不會有 + / =）
const b64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

type StreamKeyPayload = {
  userId: string;
  ts: number; // UNIX 秒
  nonce: string; // 隨機鹽
};

// ===== Server 設定 =====
const SECRET = process.env.STREAM_KEY_SECRET!; // 務必放環境變數
const DEFAULT_TTL_SEC = 60 * 60; // 1 小時


// 產生金鑰：userId + timestamp + 隨機數 + HMAC 簽章
export function createStreamKey(userId: string, ttlSec = DEFAULT_TTL_SEC) {
  if (!SECRET) throw new Error('STREAM_KEY_SECRET is not set');
  
  const ts = Math.floor(Date.now() / 1000);
  const nonce = b64url(crypto.randomBytes(12)); // 96-bit nonce
  const payload = `${userId}.${ts}.${nonce}`;
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(payload, 'utf8').digest());

  return {
    key: `${payload}.${sig}`,
    expiresAt: ts + ttlSec,
  };
}

// 驗證金鑰：簽章正確 + 未過期
export function verifyStreamKey(key: string, { now = Math.floor(Date.now() / 1000), ttlSec = DEFAULT_TTL_SEC } = {}): { ok: true; userId: string } | { ok: false; reason: string } {
  if (!SECRET) return { ok: false, reason: 'secret-missing' };

  const parts = key.split('.');
  if (parts.length !== 4) return { ok: false, reason: 'format' };

  const [userId, tsStr, nonce, sig] = parts;
  const ts = Number(tsStr);
  if (!userId || !Number.isFinite(ts) || !nonce || !sig) {
    return { ok: false, reason: 'payload' };
  }

  const msg = `${userId}.${ts}.${nonce}`;
  const expectedSig = b64url(crypto.createHmac('sha256', SECRET).update(msg, 'utf8').digest());

  // 時間常數比較，防止 side-channel
  const validSig = sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));

  if (!validSig) return { ok: false, reason: 'signature' };
  if (now > ts + ttlSec) return { ok: false, reason: 'expired' };

  return { ok: true, userId };
}
