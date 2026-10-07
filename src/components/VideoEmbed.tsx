import { CHANNEL_URL, CHANNEL_NAME } from '@/lib/config';

interface VideoEmbedProps {
  videoId: string;
  title: string;
}

export default function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="video-container">
      <div className="video-wrapper">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="video-attribution">
        <span>Original Broadcast:</span>
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          Watch on Official YouTube Channel ({CHANNEL_NAME}) ↗
        </a>
      </div>
    </div>
  );
}
