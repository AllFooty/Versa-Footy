import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const iframeRef = useRef(null);
  const hasValidVideo = videoId && videoId !== 'your-video-id';

  const handlePlay = () => {
    if (hasValidVideo) {
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const currentIframeRef = iframeRef.current;
    return () => {
      if (currentIframeRef && currentIframeRef.parentNode) {
        currentIframeRef.parentNode.removeChild(currentIframeRef);
      }
    };
  }, []);

  if (isPlaying && hasValidVideo) {
    return (
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
        title="Versa Footy video"
      />
    );
  }

  // Placeholder state when no video is available yet
  if (!hasValidVideo) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          aspectRatio: '16 / 9',
        }}
      >
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Center circle decoration */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '50%',
        }} />
        {/* Centered content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(4px)',
          }}>
            <svg width="28" height="28" fill="white" viewBox="0 0 24 24" style={{ opacity: 0.5, marginLeft: '3px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 6px 0',
            letterSpacing: '0.3px',
          }}>
            Video Coming Soon
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
            maxWidth: '320px',
          }}>
            We're putting the finishing touches on our demo video.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full cursor-pointer group overflow-hidden rounded-lg shadow-lg"
      onClick={handlePlay}
    >
      {!imageError ? (
        <img
          src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
          alt="Video thumbnail"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-600 text-lg font-semibold">Video Preview Unavailable</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 opacity-100 group-hover:opacity-70">
        <div className="bg-red-600 rounded-full p-4 transition-transform duration-300 group-hover:scale-110">
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4">
        <p className="text-lg font-bold">Versa Footy in Action</p>
        <p className="text-sm">Click to play video</p>
      </div>
    </div>
  );
};

export default VideoPlayer;

