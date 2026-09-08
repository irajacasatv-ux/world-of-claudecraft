# Added test registration inventory


86eb86bbe2 diff --git a/tests/bag_filter.test.ts b/tests/bag_filter.test.ts

86eb86bbe2 diff --git a/tests/crafted_item_tooltip_coverage.test.ts b/tests/crafted_item_tooltip_coverage.test.ts

86eb86bbe2 diff --git a/tests/crafting_reagent_refresh.test.ts b/tests/crafting_reagent_refresh.test.ts
  it.each([false, true])(

86eb86bbe2 diff --git a/tests/deeds_content.test.ts b/tests/deeds_content.test.ts

86eb86bbe2 diff --git a/tests/exchange_eligibility.test.ts b/tests/exchange_eligibility.test.ts

86eb86bbe2 diff --git a/tests/freehold_crafted_availability.test.ts b/tests/freehold_crafted_availability.test.ts
  it('preserves catalog identity and existing content while hiding the ten new recipes', () => {
  it.each(FURNISHING_RECIPES)(
  it.each(Object.values(FURNISHING_PATTERN_ITEMS))(
  it.each(Object.keys(FURNISHING_PATTERN_ITEMS))(

86eb86bbe2 diff --git a/tests/freehold_crafted_presentation.test.ts b/tests/freehold_crafted_presentation.test.ts
  it('starts an actual client dark before its first hello', () => {
  it('reuses the extracted purse calculation for the live HUD capability', () => {
  it('keeps the extracted hello legacy bytes and copy anchors exact', () => {
  it('keeps existing trainer rows unchanged while hiding only the seven new lessons', () => {
  it('hides exactly three quartermaster patterns without changing existing price rows', () => {
  it.each([undefined, false, 1, '1', 'true', null, {}])(
  it.each([false, true])(

86eb86bbe2 diff --git a/tests/freehold_module.test.ts b/tests/freehold_module.test.ts

86eb86bbe2 diff --git a/tests/furnishing_crafting.test.ts b/tests/furnishing_crafting.test.ts
  it('covers exactly ten registered crafting outputs', () => {
  it.each(FURNISHING_RECIPES)(
  it.each(FURNISHING_RECIPES)(
  it('executes the maximum 50 casts with self-signed material discounts at the skill cap', () => {
  it('refuses a full bag when reagent consumption cannot release an output slot', () => {
  it('stops a queued batch if materials disappear before completion and keeps its first output', () => {
  it.each([

86eb86bbe2 diff --git a/tests/furnishing_item_kind.test.ts b/tests/furnishing_item_kind.test.ts
  it('covers exactly eighteen authored furnishings and the hostile-payload test fixture', () => {

86eb86bbe2 diff --git a/tests/furnishing_recipes.test.ts b/tests/furnishing_recipes.test.ts
  it('merges every recipe exactly once and resolves both canonical indexes', () => {
  it('pins the seven trainer and three pattern craft and station identities', () => {
  it('retains every accepted bill and exact measured stand-in transform', () => {
  it('keeps recipe and stand-in collections deeply immutable', () => {
  it.each(TRAINER_RECIPES)(
  it.each(PATTERN_RECIPES)(

86eb86bbe2 diff --git a/tests/helpers/bare_client.ts b/tests/helpers/bare_client.ts

86eb86bbe2 diff --git a/tests/hud_update_drive.test.ts b/tests/hud_update_drive.test.ts

86eb86bbe2 diff --git a/tests/monolith_budget.test.ts b/tests/monolith_budget.test.ts

86eb86bbe2 diff --git a/tests/professions_blob_growth.test.ts b/tests/professions_blob_growth.test.ts

86eb86bbe2 diff --git a/tests/professions_craft_xp.test.ts b/tests/professions_craft_xp.test.ts

86eb86bbe2 diff --git a/tests/professions_crafting_hub.test.ts b/tests/professions_crafting_hub.test.ts

86eb86bbe2 diff --git a/tests/provisioner_firewall.test.ts b/tests/provisioner_firewall.test.ts
  it('covers every bill and admits produce only in cooking and alchemy decor', () => {
  it('rejects every protected material even in the two produce-eligible crafts', () => {
  it('proves the produce exception refuses seeds, a gear craft and a non-furnishing output', () => {

86eb86bbe2 diff --git a/tests/provisioning_supply_line.test.ts b/tests/provisioning_supply_line.test.ts

86eb86bbe2 diff --git a/tests/provisioning_supply_line_apex.test.ts b/tests/provisioning_supply_line_apex.test.ts

86eb86bbe2 diff --git a/tests/recipe_economy.test.ts b/tests/recipe_economy.test.ts

86eb86bbe2 diff --git a/tests/recipe_visibility.test.ts b/tests/recipe_visibility.test.ts
  it('keeps stable dark list identity and the live lit catalog while length is unchanged', () => {
  it('rebuilds for append and splice while preserving the furnishing filter', () => {

86eb86bbe2 diff --git a/tests/train_window_hud.test.ts b/tests/train_window_hud.test.ts
  it('passes the strict host capability into the actual trainer view build', () => {
  it('builds the actual heroic vendor rows through the active IWorld capability', () => {

8bd097d898 diff --git a/tests/apex_pattern_channels.test.ts b/tests/apex_pattern_channels.test.ts
  it('the drop-acquisition recipe set partitions seven disjoint families', () => {

8bd097d898 diff --git a/tests/apex_pattern_items.test.ts b/tests/apex_pattern_items.test.ts

8bd097d898 diff --git a/tests/furnishing_pattern_items.test.ts b/tests/furnishing_pattern_items.test.ts
  it('registers exactly the approved three tradable teaching items and 16-Mark offers', () => {
  it('keeps the seven trainer recipes separate from the three pattern recipes', () => {
  it('learns at skill 50, consumes only the clicked copy, and refuses the second learn', () => {
  it.each([
  it('refuses stale, malformed and wrong-item slot selections without falling back', () => {
  it('keeps the selected pattern and recipe unknown while dead', () => {
  it('buys distinct copies for 16 Marks apiece without learning or charging copper', () => {
  it.each(['insufficient Marks', 'dead', 'out of range', 'full bags'] as const)(

8bd097d898 diff --git a/tests/heroic_vendor.test.ts b/tests/heroic_vendor.test.ts
    it('preserves twenty legacy rung prices and three accepted furnishing prices', () => {
  it.each([

8bd097d898 diff --git a/tests/shipped_item_ids.golden.json b/tests/shipped_item_ids.golden.json

b3c2452b49 diff --git a/tests/crucible_reliquary.test.ts b/tests/crucible_reliquary.test.ts

b3c2452b49 diff --git a/tests/freehold_content.test.ts b/tests/freehold_content.test.ts
  it('pins the accepted crafted footprints, radii, costs, resale and rare presentation literally', () => {
  it('keeps every furnishing power-neutral with finite positive placement costs and walk-through rugs', () => {
  it('pins skill 50 and gold-sink budget 20 on each one-piece crafted furnishing recipe', () => {
  it('catalogues the ten crafted outputs on one Hearth page with their actual profession sources', () => {

b3c2452b49 diff --git a/tests/freehold_crafted_art.test.ts b/tests/freehold_crafted_art.test.ts
  it('admits exactly thirteen items from the immutable final source seal', () => {
  it('links shipping art to separate generated originals and normalized masters', async () => {
  it('retains eighteen distinct calls and the five corrections with exact reference lineage', () => {
  it('retains style-reference roles and the canonical conversion receipts', () => {
  it('keeps every sealed review sheet and the final native-size comparisons', async () => {

b3c2452b49 diff --git a/tests/item_art_audit_builder.test.ts b/tests/item_art_audit_builder.test.ts

b3c2452b49 diff --git a/tests/item_art_consistency.test.ts b/tests/item_art_consistency.test.ts
  it('extends the dated catalog with the Field Kit, eight vendor furnishings and thirteen crafted-content icons', () => {

b3c2452b49 diff --git a/tests/masterwrought_art_completion.test.ts b/tests/masterwrought_art_completion.test.ts

b3c2452b49 diff --git a/tests/profile_page.test.ts b/tests/profile_page.test.ts

b3c2452b49 diff --git a/tests/reliquary_content.test.ts b/tests/reliquary_content.test.ts

b3c2452b49 diff --git a/tests/reliquary_empty_shelf.test.ts b/tests/reliquary_empty_shelf.test.ts

b3c2452b49 diff --git a/tests/reliquary_hearth_shelf.test.ts b/tests/reliquary_hearth_shelf.test.ts

b3c2452b49 diff --git a/tests/reliquary_hearth_window.test.ts b/tests/reliquary_hearth_window.test.ts

b3c2452b49 diff --git a/tests/reliquary_i18n.test.ts b/tests/reliquary_i18n.test.ts

b3c2452b49 diff --git a/tests/reliquary_state.test.ts b/tests/reliquary_state.test.ts

3666d89647 diff --git a/tests/guide.test.ts b/tests/guide.test.ts

3666d89647 diff --git a/tests/guide_reliquary_hearth.test.ts b/tests/guide_reliquary_hearth.test.ts

ea3b62fad1 diff --git a/tests/apex_pattern_channels.test.ts b/tests/apex_pattern_channels.test.ts
//      (recipe_pattern_items.test.ts sweeps the shape but is floorless);

ea3b62fad1 diff --git a/tests/bags_view.test.ts b/tests/bags_view.test.ts
  it.each(manuals)('%s advertises learning only on a host that enables Freeholds', (id) => {
  it.each(manuals)(
  it('preserves ordinary manual and formula use hints with an absent, false, or true capability', () => {

ea3b62fad1 diff --git a/tests/bags_window.test.ts b/tests/bags_window.test.ts
  it.each([undefined, false, true])(

ea3b62fad1 diff --git a/tests/ci_workflow.test.ts b/tests/ci_workflow.test.ts

ea3b62fad1 diff --git a/tests/freehold_crafted_availability.test.ts b/tests/freehold_crafted_availability.test.ts

ea3b62fad1 diff --git a/tests/furnishing_market_catalog.test.ts b/tests/furnishing_market_catalog.test.ts
  it.each([...CRAFTED_FURNISHING_IDS, ...PATTERN_IDS])(
  it.each(CRAFTED_FURNISHING_IDS)(

ea3b62fad1 diff --git a/tests/guide_provisioning.test.ts b/tests/guide_provisioning.test.ts
  it('classifies every generated cooking output from its live item kind', () => {
  it('renders the actual supper table as ornamental and describes its lack of food or buffs', () => {
  it('renders the furnishing classification for another item without a supper-table special case', () => {

ea3b62fad1 diff --git a/tests/provisioner_firewall.test.ts b/tests/provisioner_firewall.test.ts

ea3b62fad1 diff --git a/tests/recipe_pattern_tooltip_view.test.ts b/tests/recipe_pattern_tooltip_view.test.ts
// A real trainer-only recipe: the acquisition gate must silence it.
  it.each(FURNISHING_MANUALS)(
  it.each(FURNISHING_MANUALS)(
  it('leaves ordinary manual and formula rendering identical on all capability states', () => {

ea3b62fad1 diff --git a/tests/server/freehold_wire.test.ts b/tests/server/freehold_wire.test.ts

47655ffb54 diff --git a/tests/ci_workflow.test.ts b/tests/ci_workflow.test.ts

47655ffb54 diff --git a/tests/deeds_content.test.ts b/tests/deeds_content.test.ts

47655ffb54 diff --git a/tests/furnishing_recipes.test.ts b/tests/furnishing_recipes.test.ts
  it.each([

47655ffb54 diff --git a/tests/furnishing_rift_admission.test.ts b/tests/furnishing_rift_admission.test.ts
  it.each(CASES)(

1be1aef461 diff --git a/tests/bags_window.test.ts b/tests/bags_window.test.ts

1be1aef461 diff --git a/tests/bags_window_use_routing.test.ts b/tests/bags_window_use_routing.test.ts
// happy-dom container (the bags_window_instance_marker.test.ts fixture idiom) and
  it.each([undefined, false, true])(
  it('reads capability again when the already-open touch menu activates', () => {
  it('gives the same refusal on a direct desktop click', () => {
  it('preserves trade mode on an unavailable realm', () => {
    it.each([undefined, false, true])('retains ordinary Use with capability %s', (flag) => {

85f99f6a32 diff --git a/tests/pr_shot_targets.test.ts b/tests/pr_shot_targets.test.ts
  it('resets Japanese guide storage to English before every manual variant, including forced colors', async () => {

5f4821bec7 diff --git a/tests/browser/error_toast_layer.browser.test.ts b/tests/browser/error_toast_layer.browser.test.ts
  it('paints above the overlapping sheet and remains pointer-inert', () => {
  it('preserves the existing desktop toast and managed-window layers', () => {

5f4821bec7 diff --git a/tests/crafted_item_tooltip_coverage.test.ts b/tests/crafted_item_tooltip_coverage.test.ts

5f4821bec7 diff --git a/tests/freehold_npc_spawn.test.ts b/tests/freehold_npc_spawn.test.ts

5f4821bec7 diff --git a/tests/furnishing_tooltip_view.test.ts b/tests/furnishing_tooltip_view.test.ts
