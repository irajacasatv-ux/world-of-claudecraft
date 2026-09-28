// The weld between an event router's host interface and the Hud members it
// reaches. The routers (src/ui/hud/quest/quest_event_router.ts and its
// siblings) take the Hud untyped because those members are private, so no
// compiler checks that the Hud still declares them: a rename on the Hud would
// leave the router reading undefined at runtime. These two reads close that:
// the member list comes from the router's OWN interface declaration (so the
// weld cannot drift from what the router reads), and each name must be
// declared as a Hud class member in src/ui/hud.ts.
import { stripComments } from './strip_comments';

/** The member names an `export interface <name> ... {` block declares, in
 *  source order. Throws if the interface is not found. */
export function interfaceMembers(source: string, name: string): string[] {
  const code = stripComments(source);
  const start = code.search(new RegExp(`export interface ${name}\\b[^{]*\\{`));
  if (start < 0) throw new Error(`interface ${name} not found`);
  const open = code.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = code.slice(open + 1, end);
  // Members sit at the body's first indentation level (two spaces); nested
  // object-type members sit deeper and are not the interface's own.
  return [...body.matchAll(/^ {2}(?:readonly\s+)?(\w+)\??\s*[(:<]/gm)].map((m) => m[1]);
}

/** Whether src/ui/hud.ts declares `member` on a class: a two-space member
 *  (field, getter, method, with any modifiers) or a four-space constructor
 *  parameter property (`private sim: IWorld,`). */
export function hudDeclares(hudSource: string, member: string): boolean {
  const code = stripComments(hudSource);
  const classMember = new RegExp(
    `^ {2}(?:(?:private|protected|public|readonly|get|static)\\s+)*${member}\\s*[(:=<?!]`,
    'm',
  );
  const paramProperty = new RegExp(
    `^ {4}(?:private|protected|public)\\s+(?:readonly\\s+)?${member}\\s*:`,
    'm',
  );
  return classMember.test(code) || paramProperty.test(code);
}
