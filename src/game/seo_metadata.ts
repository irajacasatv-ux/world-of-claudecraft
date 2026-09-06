// --- Homepage SEO metadata (canonical, og:url, the JSON-LD structured data) ---
// Re-stamped on every locale switch by the shell's translatePage() pass so the
// canonical URL, the OpenGraph url and the schema.org graph in index.html follow
// the active language. The guide SPA mirrors this pattern in src/guide/head.ts.
// Moved whole out of src/main.ts (the firewall rule: bootstrap helpers live in
// src/game/ siblings) under the monolith ratchet.
import { languageTag, type SupportedLanguage, t } from '../ui/i18n';

const SITE_URL = 'https://worldofclaudecraft.com/';

export function localizedSiteUrl(lang: SupportedLanguage): string {
  if (lang === 'en') return SITE_URL;
  const url = new URL(SITE_URL);
  url.searchParams.set('lang', lang);
  return url.toString();
}

export function updateSeoMetadata(lang: SupportedLanguage): void {
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonicalHref = localizedSiteUrl(lang);
  if (canonical) canonical.href = canonicalHref;

  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = canonicalHref;

  const jsonLd = document.getElementById('structured-data') as HTMLScriptElement | null;
  if (jsonLd) {
    const sameAs = [
      'https://github.com/levy-street/world-of-claudecraft',
      'https://discord.com/invite/worldofclaudecraft',
      'https://www.youtube.com/@WoClaudeCraft',
      'https://x.com/WoClaudecraft',
      'https://www.instagram.com/worldofclaudecraft/',
      'https://www.tiktok.com/@worldofclaudecraft',
      'https://www.reddit.com/r/WorldofClaudecraft/',
    ];
    jsonLd.textContent = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': 'https://worldofclaudecraft.com/#website',
            name: 'World of ClaudeCraft',
            alternateName: 'World of Claudecraft',
            url: canonicalHref,
            inLanguage: languageTag(lang),
            description: t('seo.description'),
            publisher: {
              '@id': 'https://worldofclaudecraft.com/#organization',
            },
          },
          {
            '@type': 'Organization',
            '@id': 'https://worldofclaudecraft.com/#organization',
            name: 'World of ClaudeCraft',
            url: 'https://worldofclaudecraft.com/',
            logo: 'https://worldofclaudecraft.com/woc_logo_square.webp',
            sameAs,
          },
          {
            '@type': 'VideoGame',
            '@id': 'https://worldofclaudecraft.com/#game',
            name: 'World of ClaudeCraft',
            alternateName: 'World of Claudecraft',
            genre: t('seo.genre'),
            playMode: t('seo.playMode'),
            applicationCategory: t('seo.applicationCategory'),
            operatingSystem: t('seo.operatingSystem'),
            url: canonicalHref,
            image: 'https://worldofclaudecraft.com/woc_logo_square.webp',
            description: t('seo.description'),
            inLanguage: languageTag(lang),
            publisher: {
              '@id': 'https://worldofclaudecraft.com/#organization',
            },
            sameAs,
          },
        ],
      },
      null,
      2,
    );
  }
}
