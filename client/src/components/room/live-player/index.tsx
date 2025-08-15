import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { MediaController, MediaControlBar, MediaPlayButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaFullscreenButton } from 'media-chrome/react';
import { CopyIcon, LoaderIcon, MonitorStopIcon, MonitorUpIcon, ScreenShareOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Socket } from 'socket.io-client';
import { RoomDetail } from '@/components/room/types';
import { toast } from 'sonner';

interface LivePlayerProps {
  roomDetail: RoomDetail;
  userIsHost: boolean;
  nsSocket?: Socket;
  namespaceId: number;
  onStreamCodeUpdate: (code?: string) => void;
  roomTitle: string;
}

export default function LivePlayer(props: LivePlayerProps) {
  const { roomDetail, userIsHost, nsSocket, namespaceId, onStreamCodeUpdate, roomTitle } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | undefined>(undefined);

  // 直播設定
  const handleStreamingSetup = async () => {
    if (roomDetail.host) {
      const apiUrl = import.meta.env.VITE_API_URL;
      const params = new URLSearchParams({
        namespaceId: namespaceId.toString(),
        hostId: roomDetail.host.id,
        roomTitle,
      });
      const res = await fetch(`${apiUrl}/api/streamKey?${params.toString()}`);
      const { key } = (await res.json()) as { key: string; expiresAt: number };
      setGeneratedKey(key);
      setIsDialogOpen(true);
    }
  };

  // 停止直播
  const handleStopStreaming = async () => {
    if (nsSocket) {
      const ackResponse = await nsSocket.emitWithAck('stopStreaming', { namespaceId, roomTitle });
      if (!ackResponse.success) console.error('Stop streaming error:', ackResponse.error);
    }
  };

  const renderHeader = () => {
    if (userIsHost) {
      return (
        <div className="flex items-center justify-center gap-4">
          {roomDetail.streamCode ? (
            <Button variant="destructive" onClick={handleStopStreaming}>
              <MonitorStopIcon /> 停止直播
            </Button>
          ) : (
            <Button onClick={handleStreamingSetup}>
              <MonitorUpIcon /> 準備直播
            </Button>
          )}
        </div>
      );
    }

    if (!roomDetail.streamCode) {
      return <p className="text-sm text-center font-bold text-muted-foreground">Oops! 主持人尚未開始直播</p>;
    }

    return null;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !roomDetail.host || !roomDetail.streamCode) return;

    let hls: Hls | null = null;
    // 使用當前頁面的 origin 來構建 HLS 串流 URL，支援手機連接
    const src = `${window.location.origin}/hls/${roomDetail.streamCode}.m3u8`;

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
    } else console.error('Hls is not supported');
  }, [roomDetail.streamCode, roomDetail.host]);

  // 監聽 streamCodeUpdate 事件
  useEffect(() => {
    if (nsSocket) {
      nsSocket.on('streamCodeUpdate', (code?: string) => {
        if (code) setIsDialogOpen(false);
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
      {renderHeader()}

      <MediaController className="block w-full rounded-xl overflow-hidden shadow aspect-video mx-auto pb-4">
        <video
          ref={videoRef}
          slot="media" // 將 <video> 指定為受控媒體：slot="media"
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
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>您的串流金鑰如下</DialogTitle>
            <div className="flex items-center justify-center gap-2">
              <DialogDescription className="text-center break-all p-4 bg-muted rounded-md">{generatedKey}</DialogDescription>
              <Button
                variant="outline"
                className="h-full"
                onClick={() => {
                  if (generatedKey) {
                    navigator.clipboard.writeText(generatedKey);
                    toast.success('已複製到剪貼簿');
                  }
                }}
              >
                <CopyIcon />
                複製
              </Button>
            </div>
          </DialogHeader>

          <DialogDescription className=" flex flex-col gap-2">
            <span>1. 複製 Stream Code 到您的推播軟體（例如 OBS）並啟動推流。</span>
            <span>2. 系統將偵測推流後自動開始直播。</span>
          </DialogDescription>
          <div className="flex items-center justify-center gap-2">
            <LoaderIcon className="animate-spin" />
            <span className="text-sm text-center text-muted-foreground">正在等待推流設定...</span>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="destructive" onClick={() => setIsDialogOpen(false)} className="w-full">
                取消
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
