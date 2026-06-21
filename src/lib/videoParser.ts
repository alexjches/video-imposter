// src/lib/videoParser.ts
// Detects video type and extracts embed URLs

import { ParsedVideo, VideoType } from '@/types';

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

const VIMEO_PATTERN = /(?:vimeo\.com\/)(\d+)/;

export function parseVideoUrl(url: string): ParsedVideo {
  if (!url || url.trim() === '') {
    return { type: 'unknown', id: null, originalUrl: url, embedUrl: null };
  }

  const trimmed = url.trim();

  // YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const id = match[1];
      return {
        type: 'youtube',
        id,
        originalUrl: trimmed,
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&enablejsapi=1`,
      };
    }
  }

  // Vimeo
  const vimeoMatch = trimmed.match(VIMEO_PATTERN);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      type: 'vimeo',
      id,
      originalUrl: trimmed,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1&controls=0&title=0&byline=0&portrait=0`,
    };
  }

  // Direct MP4 / video file
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'mp4',
      id: null,
      originalUrl: trimmed,
      embedUrl: trimmed,
    };
  }

  return { type: 'unknown', id: null, originalUrl: trimmed, embedUrl: null };
}

export function isValidVideoUrl(url: string): boolean {
  const parsed = parseVideoUrl(url);
  return parsed.type !== 'unknown';
}

export function getVideoThumbnail(url: string): string | null {
  const parsed = parseVideoUrl(url);
  if (parsed.type === 'youtube' && parsed.id) {
    return `https://img.youtube.com/vi/${parsed.id}/hqdefault.jpg`;
  }
  return null;
}
