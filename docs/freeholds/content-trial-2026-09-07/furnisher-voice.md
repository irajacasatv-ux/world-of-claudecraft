# Freehold Furnisher voice follow-up

Status: deferred by Fernando's explicit 2026-09-07 instruction to skip the NPC
voice for this content contribution and complete it before the feature ships.
The NPC keeps its text greeting. No voice ID, borrowed character alias or
fabricated generation evidence is assigned.

Character: the Freehold Furnisher, a practical Eastbrook craftswoman. Her warm
rustic leathers and open expression match the authored appearance in
`src/render/characters/npc_looks.ts` `NPC_LOOKS.freehold_furnisher`.

Proposed direction for the future casting pass: an adult woman's warm,
conversational voice with a steady pace and clear diction. She knows how her
goods are made and welcomes a customer without sounding ceremonial or salesy.
Use an original voice through the existing ElevenLabs NPC pipeline. Do not
imitate a real person or borrow another named NPC's identity.

The authored greeting is the first review sample:

> A sturdy chair, a warm lantern, a place for your books. Have a look.

Before feature shipment, the voice owner must cast and review the voice, render
the greeting through the existing generation and normalization pipeline, retain
provider/provenance evidence, register the real voice and shipping audio, and
remove the exact pending exception only after voice coverage and SFX checks
pass. The parent contribution's release checklist records this requirement.
