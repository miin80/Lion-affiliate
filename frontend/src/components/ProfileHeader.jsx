import { motion } from 'framer-motion';
import { useSiteSettings } from '../hooks/useSiteSettings';
import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
  ShopeeIcon,
  CheckCircle,
  ArrowRight,
} from './icons';

const SOCIAL_ICONS = {
  tiktok: { icon: TikTokIcon, label: 'TikTok', hover: 'hover:bg-black hover:text-white' },
  facebook: { icon: FacebookIcon, label: 'Facebook', hover: 'hover:bg-blue-600 hover:text-white' },
  instagram: { icon: InstagramIcon, label: 'Instagram', hover: 'hover:bg-brand-pink-500 hover:text-white' },
  youtube: { icon: YouTubeIcon, label: 'YouTube', hover: 'hover:bg-red-600 hover:text-white' },
  shopee: { icon: ShopeeIcon, label: 'Shopee', hover: 'hover:bg-brand-orange-500 hover:text-white' },
};

export default function ProfileHeader() {
  const { settings } = useSiteSettings();
  const profile = settings.profile || {};
  const socials = settings.socials || {};
  const follow = settings.buttons?.follow || {};

  return (
    <section className="relative overflow-hidden">
      {/* Cover gradient backdrop — đã rút ngắn ~25% để giảm khoảng trắng đầu trang */}
      <div className="relative h-20 bg-gradient-brand sm:h-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
      </div>

      <div className="container-page -mt-14 sm:-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar — to hơn để giống KOL landing (112 mobile / 144 desktop) */}
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              loading="eager"
              className="h-28 w-28 rounded-full object-cover shadow-avatar sm:h-36 sm:w-36"
            />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ring-1 ring-brand-orange-200 sm:h-9 sm:w-9">
              <CheckCircle className="h-5 w-5 text-brand-orange-500 sm:h-6 sm:w-6" />
            </span>
          </div>

          {/* Name */}
          <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
            {profile.name}
          </h1>

          {/* Bio */}
          {profile.shortBio && (
            <p className="mt-1 max-w-md px-2 text-sm text-brand-ink-500 sm:text-base">
              {profile.shortBio}
            </p>
          )}

          {/* Stats — chỉ render khi có ít nhất 1 số stat (tránh div rỗng tạo khoảng trống lạ). */}
          {profile.stats && (profile.stats.followers || profile.stats.reviewed || profile.stats.happy) && (
            <div className="mt-3 flex items-center gap-5 text-xs">
              {profile.stats.followers && (
                <Stat number={profile.stats.followers} label="Followers" />
              )}
              {profile.stats.followers && profile.stats.reviewed && (
                <span className="h-3 w-px bg-brand-ink-200" />
              )}
              {profile.stats.reviewed && (
                <Stat number={profile.stats.reviewed} label="Đã review" />
              )}
              {profile.stats.reviewed && profile.stats.happy && (
                <span className="h-3 w-px bg-brand-ink-200" />
              )}
              {profile.stats.happy && <Stat number={profile.stats.happy} label="Hài lòng" />}
            </div>
          )}

          {/* Socials — chỉ hiện icon nào có URL */}
          <div className="mt-4 flex items-center gap-2">
            {Object.entries(socials)
              .filter(([, url]) => url && url.trim())
              .map(([k, url]) => {
                const cfg = SOCIAL_ICONS[k];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={cfg.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-ink-700 shadow-soft ring-1 ring-brand-ink-200 transition ${cfg.hover}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
          </div>

          {/* Follow CTA — gradient orange→pink + icon + shadow mạnh hơn (primary action) */}
          {follow.url && (
            <a
              href={follow.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3 text-sm font-extrabold text-white shadow-cta transition hover:-translate-y-0.5 hover:shadow-cta-pink"
            >
              <FollowIcon socials={socials} />
              {follow.text || 'Theo dõi mình'}
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Icon nền tảng cho nút Follow — ưu tiên Facebook → TikTok → fallback CheckCircle.
 * Logic: theo URL admin set trong follow.url thì khó detect, nên check social nào có URL.
 */
function FollowIcon({ socials }) {
  if (socials.facebook) return <FacebookIcon className="h-4 w-4" />;
  if (socials.tiktok) return <TikTokIcon className="h-4 w-4" />;
  return <CheckCircle className="h-4 w-4" />;
}

function Stat({ number, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-extrabold text-brand-ink-900">{number}</span>
      <span className="text-[10px] uppercase tracking-wide text-brand-ink-500">
        {label}
      </span>
    </div>
  );
}
