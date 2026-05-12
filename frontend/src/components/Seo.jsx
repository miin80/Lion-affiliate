import { Helmet } from 'react-helmet-async';
import { SITE } from '../config/site';

/** Helper SEO — set title, description, og tags theo từng page. */
export default function Seo({
  title,
  description = SITE.description,
  image,
  url,
  type = 'website',
}) {
  const t = title ? `${title} — ${SITE.name}` : SITE.fullName;
  const img = image || `${SITE.url}/og-cover.jpg`;
  const u = url || SITE.url;
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={u} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={u} />
    </Helmet>
  );
}
