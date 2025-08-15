import { Router } from 'express';
import { createStreamKey } from '../lib/crypto';
import { payloadSchema } from '../lib/utils';

export const streamKeyRouter = Router();

// 接收產生 streamKey 的請求，並回傳給 user 使用 (client to server，無關 nginx)
streamKeyRouter.get('/streamKey', (req, res) => {
  const parseResult = payloadSchema.safeParse(req.query);
  if (!parseResult.success) return res.status(400).send('Invalid query');
  const { namespaceId, roomTitle, hostId } = parseResult.data;
  const result = createStreamKey({ namespaceId, roomTitle, hostId });
  res.json(result);
});

