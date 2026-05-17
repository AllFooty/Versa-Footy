export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const re = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const m = url.match(re);
  if (m && m[2].length === 11) {
    return `https://www.youtube.com/embed/${m[2]}`;
  }
  return null;
}

export function isDirectVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg|m4v)$/i.test(url.split("?")[0]);
}
