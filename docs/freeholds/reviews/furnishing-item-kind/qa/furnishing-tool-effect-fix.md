# Furnishing profession effect card fix

Finding Q40: `charmItemFor` accepted every item with a `toolEffect` use field.
A malformed furnishing could therefore become the cached charm for an effect and
lend its rarity to the standalone Professions tooltip title.

## Change

- `src/ui/tool_effect_tooltip.ts`: skip furnishing definitions before admitting a
  charm to the existing first-match cache. All other kinds retain their prior
  lookup behavior. The tooltip body and English catalog remain unchanged.
- `tests/furnishing_tool_effect_tooltip.test.ts`: inject synthetic legendary
  furnishings before the tooltip module first fills the charm cache. The actual
  exported `toolEffectStandaloneTooltip` renders both cases.

## Decisive coverage

1. The catalog-only Springback Charm keeps its literal rare title color
   `#0070dd` despite a furnishing with forged `quickening_charm` use metadata.
   The real Maker's Charm still provides an epic `#a335ee` title through the same
   exported call. The live catalog bonus sentence is also pinned literally.
2. A furnishing inserted before the real Maker's Charm cannot claim its cache
   entry. The title remains literal epic `#a335ee`, its real bonus prose remains
   visible, and Gatherer's Cache provides a real rare charm control.

The synthetic furnishing records use fresh IDs and the shared furnishing fixture.
Only the fixture catalog is mocked; the tooltip builder, rarity resolver, cache,
localization, escaping, and real eligible charm definitions execute normally.

## Validation evidence

The parent ran the combined failing-test command before the source edit and
recorded exit 1 in `/tmp/freeholds-02-audit/late-presentation-red.log`.
Both tests in this new file failed at the intended literal title-color assertion:
Springback Charm incorrectly rendered `#ff8000` instead of `#0070dd`, and
Maker's Charm incorrectly rendered `#ff8000` instead of `#a335ee`.

Worker command:

```sh
npx @biomejs/biome format --write src/ui/tool_effect_tooltip.ts tests/furnishing_tool_effect_tooltip.test.ts
```

Exit 0: two files checked, no format changes required.

The parent owns the passing regression run, typecheck, full gate, independent
review, and commits. This worker ran no tests or typecheck and staged or committed
nothing. No generated files, locale overlays, assets, or packet planning documents
were edited or read for this task.
