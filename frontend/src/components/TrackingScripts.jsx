import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '../hooks/useSiteSettings';

/**
 * TrackingScripts — inject GA / Clarity / FB Pixel / TikTok Pixel theo settings.
 *
 * Mỗi pixel chỉ inject khi admin set ID trong /admin → Cài đặt website → Tracking.
 * Empty ID → KHÔNG inject gì (sạch, không hard-code).
 *
 * Render ở AppShell. Helmet sẽ tự đặt script vào <head>.
 * Vì là SPA, các pixel sẽ nhận page view đầu tiên; route change sau đó cần
 * page_view event riêng (chưa làm — basic level đủ cho launch).
 */
export default function TrackingScripts() {
  const { settings } = useSiteSettings();
  const t = settings?.tracking || {};
  const ga = (t.googleAnalyticsId || '').trim();
  const clarity = (t.clarityId || '').trim();
  const fb = (t.facebookPixelId || '').trim();
  const tt = (t.tiktokPixelId || '').trim();

  return (
    <Helmet>
      {/* Google Analytics 4 */}
      {ga && (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
        />
      )}
      {ga && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga}');
        `}</script>
      )}

      {/* Microsoft Clarity */}
      {clarity && (
        <script>{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarity}");
        `}</script>
      )}

      {/* Facebook Pixel */}
      {fb && (
        <script>{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${fb}'); fbq('track', 'PageView');
        `}</script>
      )}

      {/* TikTok Pixel */}
      {tt && (
        <script>{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${tt}'); ttq.page();
          }(window, document, 'ttq');
        `}</script>
      )}
    </Helmet>
  );
}
