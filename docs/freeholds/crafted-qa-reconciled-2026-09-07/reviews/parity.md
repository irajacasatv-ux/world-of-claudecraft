# Crafted content cross-platform review

Coordinator transcription of the woc_cross_platform report. No confirmed gaps
or nits in the ten named commits at 0932963250; unrelated release changes
excluded. No files edited or duplicate checks run.

IWorld cfg carries the optional capability. Sim and ClientWorld share recipe
projection; ClientWorld starts dark and updates capability before reconnect
callbacks. Fresh/resumed joins use the same boot-config encoder. Only literal
true enables presentation; absent/malformed capability resets the mirror.
Headless opts in, while stock offline and editor retain documented defaults.

Training, direct grants, craft start/completion, batch limits and quartermaster
purchases all revalidate through the shared predicate before spending/granting.
Client commands stay thin sends. Knowledge remains in atomic cprof; encoding
is change-sensitive and omitted decode fields preserve state. No snapshot key
or delta semantics changed. Personal text-free trainResult events retain pid
scope and existing localized handling; quartermaster errors retain their matcher.
RL/Python actions, observations and NDJSON shapes are unchanged. Profession
crafting and housing remain outside the existing RL action space.

Reviewed the cfg facet, Sim.recipeList, ClientWorld hello/recipeList, world_hello,
both GameServer join paths, headless startup, train_recipe/crafting/vendor guards,
professions_self_mirror, event dispatch and UI error matching. Initial scoped
evidence was 20 files, 938 passed and three release-only checks skipped. Completed
protocol/parity/architecture/type/localization gates remain coordinator-owned.
