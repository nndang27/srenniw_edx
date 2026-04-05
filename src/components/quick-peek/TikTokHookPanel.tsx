'use client'
import { useState, useRef, useEffect } from 'react'
import { Play, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'

export default function TikTokHookPanel({ videos }: { videos: string[] }) {
  const [isMuted, setIsMuted] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: -scrollContainerRef.current.clientHeight, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: scrollContainerRef.current.clientHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full max-w-sm mx-auto h-[600px] sm:h-[700px]">
      <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl relative border-[8px] border-slate-800 flex-1 h-full overflow-hidden flex flex-col w-full">
        {/* Mobile Notch Mock */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-2xl w-1/3 mx-auto z-20"></div>

        {/* Header Overlay */}
        <div className="absolute top-8 left-6 right-6 z-20 flex justify-between items-center drop-shadow-md">
          <h3 className="text-white font-bold text-lg tracking-wide flex items-center gap-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <span>🍿</span> Watch together!
          </h3>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/20 backdrop-blur-md p-2 rounded-full hover:bg-black/40 transition"
          >
            {isMuted ? (
              <VolumeX className="text-white w-5 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
            ) : (
              <Volume2 className="text-white w-5 h-5 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
            )}
          </button>
        </div>

        {/* Video Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto snap-y snap-mandatory rounded-[1.5rem] h-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-slate-950"
        >
          {videos.map((vid, idx) => (
            <VideoItem key={idx} src={vid} isMuted={isMuted} isFirst={idx === 0} />
          ))}
        </div>
      </div>

      {/* Manual Scroll Controls (Absolute Positioning to preserve panel size) */}
      {videos.length > 1 && (
        <div className="absolute -right-3 sm:-right-16 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 shrink-0">
          <button
            onClick={scrollUp}
            className="flex items-center justify-center bg-white p-3 rounded-full hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 shadow-xl border border-slate-100 text-slate-400 hover:text-indigo-600 focus:outline-none"
            aria-label="Scroll Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={scrollDown}
            className="flex items-center justify-center bg-white p-3 rounded-full hover:bg-slate-50 transition-all hover:scale-110 active:scale-95 shadow-xl border border-slate-100 text-slate-400 hover:text-indigo-600 focus:outline-none"
            aria-label="Scroll Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

function VideoItem({ src, isMuted, isFirst }: { src: string, isMuted: boolean, isFirst: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(isFirst);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer to play/pause videos on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => { });
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    }, { threshold: 0.6 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => { });
        setIsPlaying(true);
      }
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full snap-center snap-always relative overflow-hidden group cursor-pointer" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-80'}`}
        muted={isMuted}
        loop
        playsInline
      />

      {/* Play Icon Overlay (visible when paused) */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
        <Play className="w-16 h-16 text-white drop-shadow-2xl" fill="white" />
      </div>

      {/* Subtle bottom gradient for neatness */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
