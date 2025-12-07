/**
 * Utility functions for handling YouTube URLs
 */

/**
 * Converts various YouTube URL formats to an embeddable URL
 * @param {string} url - The YouTube URL
 * @returns {string|null} The embed URL or null if invalid
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  // Match various YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }

  return null;
};

/**
 * Checks if a URL is a valid YouTube URL
 * @param {string} url - The URL to check
 * @returns {boolean} True if it's a valid YouTube URL
 */
export const isYouTubeUrl = (url) => {
  return getYouTubeEmbedUrl(url) !== null;
};
