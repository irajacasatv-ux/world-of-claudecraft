# Static home interiors

`index.ts` exposes the static dressing builder and its dungeon-prewarm representation.
`model_spec_core.ts` owns the measured procedural box parts; the shared authored layout
owns their placement and solid collision radii. Measure changed parts against the space
measurement record before changing the layout's radii.

These stand-ins carry no flames, lights, interaction state, trophies or condition rig.
Reserved station anchors draw nothing, and empty plinth sockets are floor underlays.
All tiers keep the same geometry. Prepared shared resources are reused across slots;
the containing dungeon root uses the existing gated attach before revealing.

`wall_cutaway.ts` keeps authored wall faces and their closed door visual together.
The existing dungeon backface policy hides each whole opaque face when the chase
camera is outside it. No zoom adjustment or transparent material variant is used;
both wall courses are prepared by the containing dungeon gate before reveal.

`exit_label_core.ts` anchors the exit label at that measured door and follows the
same south-face cutaway policy. It restores the label when the physical door is
visible, and leaves other dungeon portals and the overworld gate unchanged.
