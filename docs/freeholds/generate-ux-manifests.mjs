// Regenerate the planned UX inventory from the specification tables and registry examples.
// The examples are repository-owned JavaScript. Only variant construction is evaluated;
// capture callbacks are inert and no browser, network or filesystem APIs enter the VM.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.argv[2] || process.cwd();
const output = process.argv[3] || path.join(root, 'docs/freeholds');
const spec = fs.readFileSync(path.join(root, 'docs/freeholds/ux-spec.md'), 'utf8');
const keys = [];
for (const line of spec.split('\n')) {
  const cols = line
    .split('|')
    .slice(1, -1)
    .map((s) => s.trim());
  if (cols.length === 3 && /^hudChrome\.housing\./.test(cols[0]) && /^\d\d[a-z]?$/.test(cols[2]))
    keys.push({ key: cols[0], value: cols[1], owner: cols[2] });
}
const blocks = [...spec.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]);
const find = (s) => {
  const b = blocks.find((b) => b.includes(s));
  if (!b) throw new Error('Missing block ' + s);
  return b;
};
const declarations =
  find('const housingInteriorScenes =') +
  '\n' +
  find('const housingVisualWhen =') +
  '\n' +
  find('const housingWaveAOwners =') +
  '\n' +
  find('const housingLaterRegistrations =');
const descriptors = blocks.find(
  (b) =>
    b.trimStart().startsWith('{') &&
    b.includes("key: 'housing-build-mode'") &&
    b.includes("key: 'housing-visiting'"),
);
if (!descriptors) throw new Error('Missing descriptor list');
const captureNames = [...descriptors.matchAll(/capture:\s*(\w+)/g)].map((m) => m[1]);
const sandbox = {};
for (const name of captureNames) sandbox[name] = () => {};
const functional = find('const freeholdFunctionalTargets =');
const source =
  functional +
  '\n' +
  declarations +
  '\nconst targets=[' +
  descriptors +
  '];\n' +
  `
const rows=freeholdFunctionalTargets.flatMap(target=>freeholdFunctionalVariants.map(v=>({
 target:target.key,key:v.key,scene:target.scene,view:v.key,width:v.width,height:v.height,
 mobile:v.mobile,viewport:v.viewport,theme:'classic',graphics:'low',motion:'normal',
 input:'pointer',surface:'web',light:'normal',forcedColors:'none',owner:'06'
})));
function add(target, variants) {
 for(const v of variants) {
  const {beforeLoad,...fields}=v;
  rows.push({target,...fields,owner:housingVariantOwner(target,v.scene)});
 }
}
const grouped=new Map(targets.map(t=>[t.key,[...t.variants]]));
for(const entry of housingLaterRegistrations) {
 if(!grouped.has(entry.target))grouped.set(entry.target,[]);
 grouped.get(entry.target).push(...entry.variants);
}
for(const [target,variants] of grouped)add(target,variants);
result=rows;
`;
vm.runInNewContext(source, sandbox, { timeout: 3000 });
fs.mkdirSync(output, { recursive: true });
for (const [name, rows] of [
  ['ux-key-manifest.json', keys],
  ['ux-shot-manifest.json', sandbox.result],
]) {
  const data = JSON.stringify(rows, null, 2) + '\n';
  const current = fs.readFileSync(path.join(root, 'docs/freeholds', name), 'utf8');
  fs.writeFileSync(path.join(output, name), data);
  console.log(
    name,
    rows.length,
    data === current ? 'BYTE_IDENTICAL' : 'DIFFERENT',
    path.join(output, name),
  );
}
