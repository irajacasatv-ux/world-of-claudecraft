// @vitest-environment happy-dom
//
// src/game/seo_metadata.ts: the homepage SEO metadata the shell re-stamps on every
// locale switch, moved whole out of src/main.ts under the monolith ratchet. Pins the
// two URL rules (English stays on the bare canonical, every other locale carries the
// ?lang query) and that the canonical link, the og:url meta and the JSON-LD graph all
// follow the same localized URL, against a real DOM.

import { beforeEach, describe, expect, it } from 'vitest';
import { localizedSiteUrl, updateSeoMetadata } from '../src/game/seo_metadata';
import { languageTag, setLanguage, t } from '../src/ui/i18n';

const BARE = 'https://worldofclaudecraft.com/';

function mountHead(): {
  canonical: HTMLLinkElement;
  ogUrl: HTMLMetaElement;
  jsonLd: HTMLScriptElement;
} {
  document.head.innerHTML = '';
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = BARE;
  const ogUrl = document.createElement('meta');
  ogUrl.setAttribute('property', 'og:url');
  ogUrl.content = BARE;
  const jsonLd = document.createElement('script');
  jsonLd.type = 'application/ld+json';
  jsonLd.id = 'structured-data';
  document.head.append(canonical, ogUrl, jsonLd);
  return { canonical, ogUrl, jsonLd };
}

function graphOf(jsonLd: HTMLScriptElement): Record<string, unknown>[] {
  return JSON.parse(jsonLd.textContent ?? '')['@graph'] as Record<string, unknown>[];
}

describe('localizedSiteUrl', () => {
  it('keeps English on the bare canonical and adds ?lang for every other locale', () => {
    expect(localizedSiteUrl('en')).toBe(BARE);
    expect(localizedSiteUrl('de_DE')).toBe(`${BARE}?lang=de_DE`);
    expect(localizedSiteUrl('zh_CN')).toBe(`${BARE}?lang=zh_CN`);
  });
});

describe('updateSeoMetadata', () => {
  beforeEach(() => setLanguage('en'));

  it('stamps the canonical link, og:url, and the JSON-LD graph with the localized URL', () => {
    const { canonical, ogUrl, jsonLd } = mountHead();
    updateSeoMetadata('de_DE');
    expect(canonical.href).toBe(`${BARE}?lang=de_DE`);
    expect(ogUrl.content).toBe(`${BARE}?lang=de_DE`);
    const graph = graphOf(jsonLd);
    expect(graph.map((node) => node['@type'])).toEqual(['WebSite', 'Organization', 'VideoGame']);
    const localized = graph.filter((node) => node['@type'] !== 'Organization');
    expect(localized).toHaveLength(2);
    for (const node of localized) {
      expect(node.url).toBe(`${BARE}?lang=de_DE`);
      expect(node.inLanguage).toBe(languageTag('de_DE'));
      // The description is the rendered seo.description leaf, never the raw key.
      expect(node.description).toBe(t('seo.description'));
      expect(node.description).not.toBe('seo.description');
      expect(String(node.description).length).toBeGreaterThan(0);
    }
    // The Organization node is locale-free: it anchors the bare site.
    expect(graph[1].url).toBe(BARE);
  });

  it('returns English to the bare canonical after another locale was stamped', () => {
    const { canonical, ogUrl, jsonLd } = mountHead();
    updateSeoMetadata('fr_FR');
    updateSeoMetadata('en');
    expect(canonical.href).toBe(BARE);
    expect(ogUrl.content).toBe(BARE);
    const graph = graphOf(jsonLd);
    expect(graph[0].url).toBe(BARE);
    expect(graph[0].inLanguage).toBe(languageTag('en'));
  });

  it('is a no-op on a head without the three tags (no throw, nothing created)', () => {
    document.head.innerHTML = '';
    expect(() => updateSeoMetadata('es')).not.toThrow();
    expect(document.head.children).toHaveLength(0);
  });
});
