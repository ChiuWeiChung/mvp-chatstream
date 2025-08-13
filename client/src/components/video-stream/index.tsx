import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { MediaController, MediaControlBar, MediaPlayButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaFullscreenButton } from 'media-chrome/react';
import { CopyIcon, MonitorStopIcon, MonitorUpIcon, ScreenShareOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VideoStreamProps } from './types';

export default function LivePlayer(props: VideoStreamProps) {
  const { roomDetail, userIsHost, nsSocket, namespaceId, onStreamCodeUpdate, roomTitle } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !roomDetail.host || !roomDetail.streamCode) return;

    let hls: Hls | null = null;
    // 使用當前頁面的 origin 來構建 HLS 串流 URL，支援手機連接
    const baseUrl = window.location.origin;
    const src = `${baseUrl}/hls/${roomDetail.streamCode}.m3u8`;

    if (Hls.isSupported()) {
      const onParsed = () => {
        video.play();
      };

      if (roomDetail.streamCode) {
        const hlsConfig = { liveSyncDuration: 2, liveMaxLatencyDuration: 4, maxBufferLength: 10 };
        hls = new Hls(hlsConfig);
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, onParsed);
      }

      return () => {
        hls?.off(Hls.Events.MANIFEST_PARSED, onParsed);
        hls?.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const onLoaded = () => video.play?.().catch(() => {});
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }
  }, [roomDetail.streamCode, roomDetail.host]);

  const handleStreamingSetup = async () => {
    if (roomDetail.host) {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/streamKey?userId=${roomDetail.host.id}`);
      const { streamKey } = (await res.json()) as { streamKey: { key: string; expiresAt: number } };
      setGeneratedCode(streamKey.key);
      setIsDialogOpen(true);
    }
  };

  const handleStartStreaming = async () => {
    if (nsSocket && generatedCode) {
      const ackResponse = await nsSocket.emitWithAck('startStreaming', { code: generatedCode, namespaceId, roomTitle });
      if (ackResponse.success) setIsDialogOpen(false);
      else console.error('Start streaming error:', ackResponse.error);
    }
  };

  const handleStopStreaming = async () => {
    if (nsSocket) {
      const ackResponse = await nsSocket.emitWithAck('stopStreaming', { namespaceId, roomTitle });
      if (!ackResponse.success) console.error('Stop streaming error:', ackResponse.error);
    }
  };

  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('streamCodeUpdate', (code?: string) => {
        console.log('streamCodeUpdate is triggered', code);
        onStreamCodeUpdate(code);
      });
    }
  }, [nsSocket, onStreamCodeUpdate]);

  if (!roomDetail.isHostInRoom) {
    return (
      <div className="flex-1 h-[20rem] md:h-auto flex flex-col items-center justify-center gap-4 bg-muted">
        <ScreenShareOffIcon className="w-16 h-16 mx-auto" />
        <p className="text-sm text-center font-bold text-muted-foreground">Oops! 主持人離開房間了</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-center bg-muted/50 p-4 min-w-[300px] w-full max-w-[768px] mx-auto text-center">
      {userIsHost && (
        <div className="flex items-center justify-center gap-4">
          {roomDetail.streamCode ? (
            <Button variant="destructive" onClick={handleStopStreaming}>
              <MonitorStopIcon /> 停止直播
            </Button>
          ) : (
            <Button onClick={handleStreamingSetup}>
              <MonitorUpIcon />
              準備直播
            </Button>
          )}
        </div>
      )}

      <MediaController className="block w-full rounded-xl overflow-hidden shadow aspect-video mx-auto pb-4">
        {/* 將 <video> 指定為受控媒體：slot="media" */}
        <video
          ref={videoRef}
          slot="media"
          autoPlay
          muted // 自動播放需 muted 才會成功
          playsInline
          poster={roomDetail.host?.image || undefined}
          className="w-full h-full object-contain"
        />

        <MediaControlBar>
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaTimeRange />
          <MediaTimeDisplay />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>

      <Dialog open={isDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>您的串流金鑰已產生</DialogTitle>
            <DialogDescription className="text-center break-all p-4 bg-muted rounded-md">{generatedCode}</DialogDescription>
            <Button
              variant="outline"
              onClick={() => {
                if (generatedCode) {
                  navigator.clipboard.writeText(generatedCode);
                  alert('已複製到剪貼簿');
                }
              }}
            >
              <CopyIcon />
              複製
            </Button>
            <DialogDescription>
              <p>1. 複製 Stream Code 到您的推播軟體（例如 OBS）並啟動推流。</p>
              <p>2. 回到本頁面，點擊「開始直播」按鈕，即可正式開播。</p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
            </DialogClose>
            <Button onClick={handleStartStreaming}>已完成推流設定，立即直播</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
