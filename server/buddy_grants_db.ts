// Buddy grants queued for an OFFLINE character: the admin grant endpoint's
// offline arm (server/admin.ts grant-buddy) writes a row when the target is
// not in world, and the character's next join drains and applies it
// (server/buddy_wire.ts drainPendingBuddyGrants). SQL lives here only.
//
// Retention: rows are CONSUMED at the next join (DELETE ... RETURNING), so the
// table holds at most the grants awaiting characters that have not logged in
// since; a character deletion cascades its rows. It cannot grow per event or
// per session, so it registers no prune sweep by decision.

import { pool } from './db';

export const BUDDY_GRANTS_SCHEMA = `
-- Buddy grants queued for an OFFLINE character (server/buddy_wire.ts): the
-- admin grant endpoint writes a row when the target is not in world, and the
-- character's next join drains and applies it. One row per grant, consumed
-- with DELETE ... RETURNING so a grant can never apply twice.
CREATE TABLE IF NOT EXISTS character_buddy_grants (
  id SERIAL PRIMARY KEY,
  character_id INT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  buddy_key TEXT,
  cosmetic_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT character_buddy_grants_one_kind
    CHECK ((buddy_key IS NULL) <> (cosmetic_id IS NULL))
);
CREATE INDEX IF NOT EXISTS character_buddy_grants_character
  ON character_buddy_grants(character_id);
`;

/** One queued buddy grant (character_buddy_grants). */
export interface BuddyGrantRow {
  buddyKey?: string;
  cosmeticId?: string;
}

/** Queue a buddy/cosmetic grant for a character that is not in world. */
export async function queueBuddyGrant(characterId: number, grant: BuddyGrantRow): Promise<void> {
  await pool.query(
    `INSERT INTO character_buddy_grants (character_id, buddy_key, cosmetic_id)
     VALUES ($1, $2, $3)`,
    [characterId, grant.buddyKey ?? null, grant.cosmeticId ?? null],
  );
}

/** Consume every queued grant for a character, oldest first. One statement,
 *  so a grant can never apply twice across two racing joins. */
export async function takePendingBuddyGrants(characterId: number): Promise<BuddyGrantRow[]> {
  const res = await pool.query(
    `DELETE FROM character_buddy_grants
      WHERE character_id = $1
      RETURNING buddy_key, cosmetic_id, id`,
    [characterId],
  );
  return (res.rows as { buddy_key: string | null; cosmetic_id: string | null; id: number }[])
    .sort((a, b) => a.id - b.id)
    .map((row) =>
      row.buddy_key !== null ? { buddyKey: row.buddy_key } : { cosmeticId: row.cosmetic_id ?? '' },
    );
}
