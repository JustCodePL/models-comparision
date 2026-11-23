import type { Experiment, MediaItem } from "../lib/types";
import { mediaUrl } from "../lib/experiments";

export function MediaView({ experiment, media, alt }: { experiment: Experiment; media: MediaItem; alt: string }) {
  const url = mediaUrl(experiment, media);
  if (media.type === "video") {
    return <video controls preload="metadata" playsInline src={url} poster={media.poster ? mediaUrl(experiment, media.poster) : undefined} width={media.width} height={media.height} />;
  }
  if (media.type === "audio") return <audio controls preload="metadata" src={url} />;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={alt} width={media.width} height={media.height} loading="lazy" /></a>;
}
