import { Helmet } from 'react-helmet-async';
import { SITE } from '../config/site';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * Helper SEO — set title, description, og tags theo từng page.
 * Tự lấy site name + description từ settings nếu có, fallback SITE config.
 */
export default function Seo({
  title,
  description,
  image,
  url,
  type = 'website',
}) {
  const { settings } = useSiteSettings();
  const profileName = settings?.profile?.name || SITE.name;
  const defaultDesc = settings?.profile?.shortBio || SITE.description;

  const finalTitle = title ? `${title} — ${profileName}` : SITE.fullName;
  const finalDesc = description || defaultDesc;
  // OG image: ưu tiên prop, fallback avatar (nếu là URL https), cuối cùng /og-cover.jpg
  const avatarUrl = settings?.profile?.avatar;
  const isHttpsAvatar = typeof avatarUrl === 'string' && avatarUrl.startsWith('http');
  const finalImage = image || (isHttpsAvatar ? avatarUrl : `${SITE.url}/og-cover.jpg`);
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : SITE.url);

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <meta name="robots" content="index, follow" />
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={profileName} />
      <meta property="og:locale" content="vi_VN" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
      {/* Canonical */}
      <link rel="canonical" href={finalUrl} />
      {/* Theme color */}
      <meta name="theme-color" content="#f97316" />
    </Helmet>
  );
}
