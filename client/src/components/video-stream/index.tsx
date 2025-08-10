import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { MediaController, MediaControlBar, MediaPlayButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaFullscreenButton } from 'media-chrome/react';

interface VideoStreamProps {
  hostId: string;
  className?: string;
}

export default function LivePlayer({ className = '', hostId }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;
    // 使用當前頁面的 origin 來構建 HLS 串流 URL，支援手機連接
    const baseUrl = window.location.origin;
    const src = `${baseUrl}/hls/${hostId}.m3u8`;

    if (Hls.isSupported()) {
      hls = new Hls({
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 4,
        maxBufferLength: 10,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      const onParsed = () => {
        video.play?.().catch(() => {});
      };
      hls.on(Hls.Events.MANIFEST_PARSED, onParsed);

      return () => {
        hls.off(Hls.Events.MANIFEST_PARSED, onParsed);
        hls.destroy();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const onLoaded = () => video.play?.().catch(() => {});
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }
  }, [hostId]);

  return (
    <div className={`flex items-center justify-center bg-muted/50 p-4 min-w-[300px] w-full max-w-[768px] text-center ${className}`}>
      <MediaController className="block w-full rounded-xl overflow-hidden shadow aspect-video mx-auto pb-4">
        {/* 將 <video> 指定為受控媒體：slot="media" */}
        <video
          ref={videoRef}
          slot="media"
          autoPlay
          muted // 自動播放需 muted 才會成功
          playsInline
          // poster="/poster.jpg"
          // preload="metadata"
        />

        <MediaControlBar>
          <MediaPlayButton />
          <MediaMuteButton />
          <MediaTimeRange />
          <MediaTimeDisplay />
          <MediaFullscreenButton />
        </MediaControlBar>
      </MediaController>
    </div>
  );
}
