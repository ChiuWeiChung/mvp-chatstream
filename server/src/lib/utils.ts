import namespaces from '../data/namespaces';
import { z } from 'zod';

export const querySchema = z.object({
  app: z.string().optional(),
  name: z.string(),
  addr: z.string().optional(),
  clientid: z.string().optional(),
});

export const getCurrentPosition = ({ namespaceId, roomTitle }: { namespaceId: number; roomTitle: string }) => {
  const currentNamespace = namespaces[namespaceId];
  const currentRoom = currentNamespace.rooms.find((room) => room.roomTitle === roomTitle);
  return { currentNamespace, currentRoom };
};

export async function waitForPlaylistReady(streamName: string, timeoutMs = 5000, intervalMs = 300) {
  const baseUrl = 'http://client:8080'; // TODO: 改成環境變數，這邊指的 baseUrl 是 client 的 docker container
  const url = `${baseUrl.replace(/\/$/, '')}/hls/${encodeURIComponent(streamName)}.m3u8`;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const rsp = await fetch(url, { method: 'GET' });
      if (rsp.ok) {
        const text = await rsp.text();
        if (text.includes('#EXTM3U')) return true;
      }
    } catch (_) {} /* 還沒好，重試 */
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
