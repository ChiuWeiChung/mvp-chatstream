// LivePlayer.jsx
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { MediaController, MediaControlBar, MediaPlayButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaFullscreenButton } from 'media-chrome/react';

interface VideoStreamProps {
  hostId: string;
  className?: string;
}

/**
 * React + media-chrome/react 版本
 * - 使用 hls.js 播放 HLS；Safari 走原生 HLS
 * - 使用 MediaController/MediaControlBar 等 React 包裝元件
 * - 卸載時清理 hls 實例
 */
export default function LivePlayer({ className = '', hostId }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;
    const src = `http://localhost:8080/hls/${hostId}.m3u8`;

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
    <div className={`md:flex-1 justify-center bg-muted/50 p-4 min-w-[300px] text-center ${className}`}>
      {/* <MediaController className="block h-full rounded-xl overflow-hidden shadow aspect-video mx-auto"> */}
      <MediaController className="block w-full max-w-[1024px] rounded-xl overflow-hidden shadow aspect-video mx-auto pb-4">
        {/* 將 <video> 指定為受控媒體：slot="media" */}
        <video
          ref={videoRef}
          slot="media"
          autoPlay
          muted
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

      {/* Tips:
         1) 跨網域資源需正確 CORS header（m3u8/TS）。
         2) 自動播放通常需 muted 才會成功。
      */}
    </div>
  );
}
