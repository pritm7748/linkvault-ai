import { YoutubeTranscript } from 'youtube-transcript';

export function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function getYouTubeVideoDetails(videoId: string): Promise<{ title: string; description: string }> {
  // Use the API Key if available, otherwise return basic info so the process doesn't fail
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    console.warn("YOUTUBE_API_KEY is missing. Returning basic placeholders.");
    return { title: '', description: '' };
  }
  
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return { title: '', description: '' };
    const data = await response.json();
    const snippet = data.items?.[0]?.snippet;
    return { 
        title: snippet?.title || '', 
        description: snippet?.description || '' 
    };
  } catch (error) {
    console.error("YouTube API Error:", error);
    return { title: '', description: '' };
  }
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    // Combine all transcript parts into one big string
    return transcriptItems.map(item => item.text).join(' ');
  } catch (error) {
    console.warn(`Could not fetch transcript for video ${videoId}. (It might not have captions).`);
    return ""; // Return empty string if no transcript found (so the app doesn't crash)
  }
}