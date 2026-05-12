import { PLATFORMS } from '../config/affiliate';

export default function PlatformBadge({ platform, className = '' }) {
  const p = PLATFORMS[platform] || PLATFORMS.other;
  return (
    <span className={`badge ${p.color} ${className}`}>
      {p.name}
    </span>
  );
}
