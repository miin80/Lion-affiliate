import PreviewFrame from './PreviewFrame';
import { PlayIcon } from '../../icons';

/**
 * VideoPreview — preview card video TikTok-style giống VideoReels public.
 */
export default function VideoPreview({ video }) {
  const thumb = video.thumb || 'https://placehold.co/360x640/f1f5f9/64748b?text=Thumb';
  return (
    <PreviewFrame title="Xem trước Video card">
      <div className="mx-auto w-44">
        <div className="relative overflow-hidden rounded-2xl bg-brand-ink-900 shadow-card">
          <img
            src={thumb}
            alt=""
            className="aspect-[9/16] w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/360x640/fee2e2/991b1b?text=Lỗi+thumb';
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {video.views && (
            <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              ▶ {video.views}
            </div>
          )}
          {video.duration && (
            <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-brand-ink-900">
              {video.duration}
            </div>
          )}
          <p className="absolute inset-x-2 bottom-12 line-clamp-2 text-xs font-bold text-white">
            {video.title || '(Tiêu đề video)'}
          </p>
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-brand-ink-900 shadow-card">
            <PlayIcon className="h-5 w-5" />
          </span>
        </div>
      </div>
    </PreviewFrame>
  );
}
