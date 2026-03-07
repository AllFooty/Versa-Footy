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
        className="relative w-full h-full overflow-hidden rounded-lg shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          aspectRatio: '16 / 9',
        }}
      >
        {/* Decorative football field lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        {/* Center circle decoration */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '50%',
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          {/* Play icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            background: 'rgba(255,255,255,0.05)',
          }}>
            <svg className="w-10 h-10" fill="white" viewBox="0 0 24 24" style={{ opacity: 0.6, marginLeft: '4px' }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '8px',
            letterSpacing: '0.5px',
          }}>
            Video Coming Soon
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '360px',
          }}>
            We're putting the finishing touches on our demo video. Stay tuned!
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

