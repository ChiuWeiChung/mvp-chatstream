import { Router } from 'express';
import { verifyStreamKey } from '../lib/crypto';
import { getCurrentPosition, querySchema, waitForPlaylistReady } from '../lib/utils';
import { IoContainer } from '../classes/IoContainer';

export const rtmpRouter = Router();

// 推流開始 (請求來自 Nginx-RTMP Server)
rtmpRouter.get('/on-publish', async (req, res) => {
  const source = req.query;
  const parsed = querySchema.safeParse(source);
  if (!parsed.success) return res.status(400).send('bad query');

  const { name: streamKey } = parsed.data;
  const result = verifyStreamKey(streamKey, { ttlSec: 30 * 60 });
  if (!result.ok) return res.status(403).send(`deny: ${result.reason}`);

  const { namespaceId, roomTitle, hostId } = result.payload;
  const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
  if (!currentNamespace || !currentRoom) return res.status(403).send('deny: namespace or room not found');
  if (currentRoom.host?.id && currentRoom.host.id !== hostId) return res.status(403).send('deny: host mismatch');

  // 先回 204，讓 Nginx 允許推流
  res.status(204).end();

  // 背景等 m3u8 就緒，再廣播
  const isReady = await waitForPlaylistReady(streamKey, 5000, 250);
  if (isReady) {
    currentRoom.updateStreamKey(streamKey);
    const io = IoContainer.get();
    const nsp = io.of(currentNamespace.endpoint);
    nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', streamKey);
  }
});

// 推流結束 (請求來自 Nginx-RTMP Server)
rtmpRouter.get('/on-publish-done', (req, res) => {
  const source = req.query;
  const parsed = querySchema.safeParse(source);
  if (!parsed.success) return res.status(204).end(); // Note: 即使失敗，也不影響 Nginx

  const { name: streamKey } = parsed.data;
  const result = verifyStreamKey(streamKey, { ignoreTtl: true }); // 僅解 payload，不做 TTL 檢查
  if (!result.ok) return res.status(204).end(); // Note: 即使失敗，也不影響 Nginx

  const { namespaceId, roomTitle } = result.payload;
  const { currentNamespace, currentRoom } = getCurrentPosition({ namespaceId, roomTitle });
  if (currentNamespace && currentRoom) {
    const io = IoContainer.get();
    const nsp = io.of(currentNamespace.endpoint);
    currentRoom.updateStreamKey(undefined);
    nsp.in(currentRoom.roomTitle).emit('streamCodeUpdate', undefined);
  }
  return res.status(204).end();
});
