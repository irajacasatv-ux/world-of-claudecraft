interface CharacterDependencyDef {
  lazyPreload?: boolean;
  attach?: readonly { url: string }[];
}

/** Fixed NPC attachments are required rig parts even when sold as player cosmetics. */
export function streamedCharacterUrls(
  allUrls: readonly string[],
  cosmeticUrls: ReadonlySet<string>,
  defs: Readonly<Record<string, CharacterDependencyDef>>,
  iosMemoryProfile: boolean,
  bodyPrefixes: readonly string[],
): string[] {
  const required = new Set(
    Object.values(defs)
      .filter((def) => !def.lazyPreload)
      .flatMap((def) => (def.attach ?? []).map((part) => part.url)),
  );
  return allUrls.filter(
    (url) =>
      (cosmeticUrls.has(url) && !required.has(url)) ||
      (iosMemoryProfile && bodyPrefixes.some((prefix) => url.includes(prefix))),
  );
}
