// crypto.ts
import crypto from 'node:crypto';
import z from 'zod';

const SECRET = process.env.STREAM_KEY_SECRET!;
export const DEFAULT_TTL_SEC = 60 * 60; // 1hr

// === Helpers ===
// 適合放 URL/查詢字串，不會有 + / =）
const b64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const b64urlToBuf = (s: string) =>
  Buffer.from(
    s
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(s.length + ((4 - (s.length % 4)) % 4), '='),
    'base64',
  );

// 針對淺層物件做穩定序列化（key 依字母排序）
function stableStringify(obj: Record<string, unknown>): string {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = (obj as any)[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

const payloadSchema = z.object({ namespaceId: z.number(), roomTitle: z.string(), hostId: z.string() });
type StreamPayload = z.infer<typeof payloadSchema>; 

// key 內容：<payloadB64>.<ts>.<nonce>.<sigB64>
export function createStreamKey(payload: StreamPayload, ttlSec = DEFAULT_TTL_SEC) {
  if (!SECRET) throw new Error('STREAM_KEY_SECRET is not set');

  const ts = Math.floor(Date.now() / 1000); // UNIX 秒
  const nonce = b64url(crypto.randomBytes(12)); // 96-bit nonce

  const payloadJSON = stableStringify(payload);
  const payloadB64 = b64url(Buffer.from(payloadJSON, 'utf8'));

  const msg = `${payloadB64}.${ts}.${nonce}`;
  const digest = crypto.createHmac('sha256', SECRET).update(msg, 'utf8').digest();
  const sigB64 = b64url(digest);

  return {
    key: `${msg}.${sigB64}`,
    expiresAt: ts + ttlSec,
  };
}

// 驗證成功回傳原始 payload；ignoreTtl=true 可跳過過期檢查
export function verifyStreamKey(
  key: string,
  { now = Math.floor(Date.now() / 1000), ttlSec = DEFAULT_TTL_SEC, ignoreTtl = false }: { now?: number; ttlSec?: number; ignoreTtl?: boolean } = {},
): { ok: true; payload: StreamPayload } | { ok: false; reason: string } {
  if (!SECRET) return { ok: false, reason: 'secret-missing' };

  const parts = key.split('.');
  if (parts.length !== 4) return { ok: false, reason: 'format' };

  const [payloadB64, tsStr, nonce, sigB64] = parts;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || !payloadB64 || !nonce || !sigB64) {
    return { ok: false, reason: 'payload' };
  }

  // 重算簽章
  const msg = `${payloadB64}.${ts}.${nonce}`;
  const expectedDigest = crypto.createHmac('sha256', SECRET).update(msg, 'utf8').digest();

  const gotSig = b64urlToBuf(sigB64);
  if (gotSig.length !== expectedDigest.length) return { ok: false, reason: 'signature-length' };
  if (!crypto.timingSafeEqual(gotSig, expectedDigest)) return { ok: false, reason: 'signature' };

  // TTL 檢查
  if (!ignoreTtl && now > ts + ttlSec) return { ok: false, reason: 'expired' };

  // 還原 payload
  try {
    const json = b64urlToBuf(payloadB64).toString('utf8');
    const payload = JSON.parse(json) ;
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, reason: 'payload-shape' };
    return { ok: true, payload: parsed.data };
  } catch {
    return { ok: false, reason: 'payload-parse-error' };
  }
}
