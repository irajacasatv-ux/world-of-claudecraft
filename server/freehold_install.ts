// THE SIM INSTALL: the one place a durable housing answer becomes live sim
// state. Pure and synchronous, with no store, no ports and no clock, so it is
// out here rather than inside server/freehold_persist.ts: what it decides is
// which of the load's answer shapes reaches ctx.freeholds and in what form, and
// that decision is the front half of the write seal's whole argument.
// Its ABSENT arm is what closed the eighth path to an empty tier-0 Inn Room
// landing on a real house, so it is worth reading on its own.

import { mergeFreeholdKeyReadyAt } from '../src/sim/freehold/hearth_key';
import { freeholdPlotIdAdmitted, freeholdStateFromPersisted } from '../src/sim/freehold/persisted';
import { defaultFreeholdState, loadFreehold } from '../src/sim/freehold/state';
import { asFreeholdPlotId } from '../src/sim/freehold/types';
import type { SimContext } from '../src/sim/sim_context';
import type { LoadedFreehold } from './freehold_persist';
import { freeholdOwnerKeyForAccount } from './freehold_wire';

/**
 * Install one account's durable answer into the sim. PURE and SYNCHRONOUS, and
 * it MUST run BEFORE the sim seeds its default record for this account:
 * loadFreehold is load-once, so a call made after the seed is silently
 * discarded and the owner's real plot never reaches the live map. A held load
 * installs nothing (invariant 1: install nothing, write nothing), and neither
 * does an answer marked `recordWithheld`; an absent load installs a default
 * carrying the minted identity, and a loaded one installs its document. What
 * the join hands it is the store's answer at install time (answerForInstall,
 * ruling (b)), never the handshake's answer as it arrived.
 */
export function installLoadedFreehold(
  ctx: SimContext,
  accountId: number,
  loaded: LoadedFreehold | undefined,
): void {
  // A STRUCTURAL guard, not a type assertion. This value arrives on a spread
  // meta bag that crosses a module boundary, and every field below is read
  // straight into sim state; a bag that lost its shape would install a record
  // with undefined fields rather than refusing.
  if (!loaded || typeof loaded !== 'object') return;
  // AND IT HAS TO NAME THIS ACCOUNT. LoadedFreehold carries accountId precisely
  // so the answer names its subject, and this is the one field the structural
  // guard above skipped. If a bag ever crossed with another account's answer,
  // that account's house and Hearth clock would install under this owner key,
  // and the store's seal cannot catch it because the seal compares identities,
  // not accounts. The blast radius would be two houses.
  if (loaded.accountId !== accountId) return;
  const ownerKey = freeholdOwnerKeyForAccount(accountId);
  // The CLOCK FIRST, and unconditionally. It is a separate durable fact from
  // the plot: an account whose plot row is held, or absent entirely, still has
  // a Hearth cooldown, and dropping it because the plot could not be installed
  // hands that account a free travel on every login. AND THAT PROTECTION IS
  // DEFEATED TODAY BY WHAT THE HOLD PATHS SUPPLY, which is worth saying here
  // rather than leaving the comment reading as a closed case: every refusal
  // answers a COLD clock whose ready time is zero, and a forward-only merge of
  // zero leaves the cooldown reading ready, so the free travel this argues
  // against is exactly what a repeatedly refused login gets. Harmless while
  // nothing writes the row; recorded as an activation gate in
  // docs/freeholds/persistence-rollout-contract.md section 8a. The forward-only merge
  // itself belongs to the sim, which owns the Map.
  // INDEPENDENTLY guarded, because they are independent durable facts: a bag
  // that lost its clock must still install the plot, and vice versa. Coupling
  // them means one malformed field costs the owner both.
  if (typeof loaded.hearthReadyAtMs === 'number') {
    mergeFreeholdKeyReadyAt(ctx, ownerKey, loaded.hearthReadyAtMs);
  }
  // A WITHHELD ANSWER PUTS NO RECORD IN, and it is checked before the absent
  // arm because it can look exactly like one: see `recordWithheld`. It acts
  // only on a positive `false`, so a bag that lost the field fails closed. The
  // join's WITHHELD verdict stands on it: no loaded entry vouches for that
  // answer, so addPlayer seeds the stand-in, which the insert refusal (no row
  // yet) or the seal (a row) refuses, write-blocking the session; no capture
  // can be lost there, because a capture never outlives its entry. The eleventh
  // path's cost this arm used to carry (a joiner write-blocked and a waiting
  // capture released) is gone: the join now installs from the entry that holds
  // the capture.
  if (loaded.recordWithheld !== false) return;
  // THE ABSENT ARM: no hold, no state, no durable row. The sim's default record
  // IS the truth for this account, but the store has already MINTED the identity
  // the row it is about to insert will carry, and nothing else ever teaches a
  // live record its own name. Installing a default that carries it here, through
  // the same load-once path a row install uses, is what makes the record and the
  // row answer to one identity from the FIRST session rather than from the
  // second.
  //
  // IT IS HALF OF WHAT CLOSES IT, and the other half is in the store: this arm
  // runs only when the load ANSWERED, and it returns early below on any hold, so
  // a record seeded while its own load was refused is never named here. The
  // store's absent arm refuses to create a row for such a record at all, which
  // is what stops the seal falling back to comparing a stand-in with a stand-in.
  //
  // WHAT IT CLOSES. The write seal's name comparison was INERT for an entry that
  // minted its own row: `applyWriteResult` caches the identity the live record
  // carried, that identity was the stand-in, and a freshly seeded default
  // carries the same literal, so the two were equal by value and the comparison
  // could not fire. The two continuity arms were then the whole seal and both
  // are revision-shaped, so a reseeded default whose revision had caught up
  // satisfied neither and an empty tier-0 Inn Room was compare-and-swapped over
  // a real house with plot_id untouched and no counter moving. That was the
  // EIGHTH distinct path to violating this subsystem's one invariant. It also
  // closes the mirror of it, where the same account's entry re-read the row it
  // had just inserted and the two names then differed for the opposite reason.
  //
  // ON THE ABSENT ARM ONLY, and that is the whole difference between the safe
  // form and the unsafe one. Stamping the minted identity onto whatever record
  // is already live bypasses load-once and rewrites a freshly SEEDED default's
  // identity to the minted name, which kills the name comparison and, through
  // the stand-in test, both continuity arms with it: a new path to the same
  // loss. loadFreehold is load-once and honors the dark-realm flag, so a record
  // that already exists is returned untouched and a dark realm installs nothing;
  // addPlayer's ensureFreeholdRecord then finds this record and leaves it alone.
  //
  // THE IDENTITY IS CHECKED, because it crosses the same spread bag every other
  // field here does and because an identity the wire refuses would make every
  // later build-presence frame fail at the type boundary with no diagnostic.
  // An unchecked one is simply not installed, and the account falls back to the
  // stand-in exactly as it did before this arm existed.
  if (loaded.hold === null && loaded.state === null && loaded.durableRev === null) {
    if (freeholdPlotIdAdmitted(loaded.plotId)) {
      loadFreehold(ctx, ownerKey, defaultFreeholdState(ownerKey, asFreeholdPlotId(loaded.plotId)));
    }
    return;
  }
  if (loaded.hold !== null || loaded.state === null) return;
  if (typeof loaded.state !== 'object') {
    // A skip here means addPlayer seeds a default while the store's entry still
    // believes it loaded a real row, which used to be how a default reached the
    // row. It no longer is: runWrite's identity seal refuses to write a record
    // still carrying the unassigned plot id over a row that HAS a durable
    // revision, so the row survives and the account is write-blocked instead.
    // A throw here would refuse the login for a case the real store cannot
    // produce, which is a worse trade than one held session.
    return;
  }
  loadFreehold(ctx, ownerKey, freeholdStateFromPersisted(loaded.state, ownerKey));
}
