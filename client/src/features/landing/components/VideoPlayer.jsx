import React, { useState, useEffect, useRef } from 'react';

const VideoPlayer = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const iframeRef = useRef(null);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  useEffect(() => {
    const currentIframeRef = iframeRef.current;
    return () => {
      if (currentIframeRef && currentIframeRef.parentNode) {
        currentIframeRef.parentNode.removeChild(currentIframeRef);
      }
    };
  }, []);

  if (isPlaying) {
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

