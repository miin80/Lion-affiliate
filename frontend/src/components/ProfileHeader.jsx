import { motion } from 'framer-motion';
import { SITE } from '../config/site';
import {
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
  ShopeeIcon,
  CheckCircle,
} from './icons';

const SOCIAL_ICONS = {
  tiktok: { icon: TikTokIcon, label: 'TikTok', hover: 'hover:bg-black hover:text-white' },
  facebook: { icon: FacebookIcon, label: 'Facebook', hover: 'hover:bg-blue-600 hover:text-white' },
  instagram: { icon: InstagramIcon, label: 'Instagram', hover: 'hover:bg-brand-pink-500 hover:text-white' },
  youtube: { icon: YouTubeIcon, label: 'YouTube', hover: 'hover:bg-red-600 hover:text-white' },
  shopee: { icon: ShopeeIcon, label: 'Shopee', hover: 'hover:bg-brand-orange-500 hover:text-white' },
};

export default function ProfileHeader() {
  return (
    <section className="relative overflow-hidden">
      {/* Cover gradient backdrop */}
      <div className="relative h-28 bg-gradient-brand sm:h-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
      </div>

      <div className="container-page -mt-12 sm:-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="relative">
            <img
              src={SITE.avatar}
              alt={SITE.name}
              loading="eager"
              className="h-24 w-24 rounded-full object-cover shadow-avatar sm:h-28 sm:w-28"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow ring-1 ring-brand-orange-200">
              <CheckCircle className="h-5 w-5 text-brand-orange-500" />
            </span>
          </div>

          {/* Name */}
          <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">
            {SITE.name}
          </h1>

          {/* Bio */}
          <p className="mt-1 max-w-md px-2 text-sm text-brand-ink-500 sm:text-base">
            {SITE.shortBio}
          </p>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-5 text-xs">
            <Stat number={SITE.stats.followers} label="Followers" />
            <span className="h-3 w-px bg-brand-ink-200" />
            <Stat number={SITE.stats.reviewed} label="Đã review" />
            <span className="h-3 w-px bg-brand-ink-200" />
            <Stat number={SITE.stats.happy} label="Hài lòng" />
          </div>

          {/* Socials */}
          <div className="mt-4 flex items-center gap-2">
            {Object.entries(SITE.socials)
              .filter(([, url]) => url)
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

          {/* Follow CTA */}
          <a
            href={SITE.followUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-5 px-7 py-3 text-sm"
          >
            ➕ Theo dõi mình
          </a>
        </motion.div>
      </div>
    </section>
  );
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
