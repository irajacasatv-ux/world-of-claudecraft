// A module whose load starts a dynamic import that itself starts another: the control for the
// lazy-locale reach pin in tests/i18n_lazy_loader.test.ts, which must record a slice reached
// only at the end of such a chain.
void import('./i18n_reach_chain_hop');

export {};
