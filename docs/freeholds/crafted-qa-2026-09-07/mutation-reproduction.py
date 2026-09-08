from pathlib import Path
import tempfile,shutil,subprocess,re,json,hashlib
repo=Path('/Users/fernando/orca/workspaces/world-of-claudecraft/wocc-freeholds')
scratch=Path(tempfile.mkdtemp(prefix='freeholds-crafted-mutants-'))
for name in ['src','tests','scripts','data']:
 shutil.copytree(repo/name,scratch/name)
for name in ['node_modules','public']:
 (scratch/name).symlink_to(repo/name,target_is_directory=True)
for p in repo.iterdir():
 if p.is_file() and (p.suffix in ['.json','.ts','.mjs','.yaml'] or p.name == '.browserslistrc'):
  shutil.copy2(p,scratch/p.name)
results=[]
def check(label,suite,title,rel,old,new):
 p=scratch/rel;live=repo/rel;before=p.read_bytes();live_before=live.read_bytes()
 assert before.count(old.encode())==1,(label,'mutation must match once')
 args=['npx','vitest','run',suite,'--maxWorkers=2','-t',title]
 for variant in ['baseline','mutant','restored']:
  if variant=='mutant':
   p.write_bytes(before.replace(old.encode(),new.encode()))
   assert p.read_bytes()!=before
  else:p.write_bytes(before)
  log=Path(f'/tmp/freeholds-crafted-qa-{label}-{variant}.log')
  with log.open('w') as out:
   out.write('COMMAND: '+' '.join(args)+'\n');out.flush()
   r=subprocess.run(args,cwd=scratch,stdout=out,stderr=subprocess.STDOUT)
  text=log.read_text(); expected=1 if variant=='mutant' else 0
  assert r.returncode==expected,(label,variant,r.returncode,log)
  assert re.search(r'Tests\s+\d+ '+('failed' if variant=='mutant' else 'passed'),text),(label,'no tests ran',log)
  if variant=='mutant':assert 'AssertionError' in text,(label,'not assertion failure')
  results.append({'label':label,'variant':variant,'exitCode':r.returncode,'command':args,'log':str(log)})
  print(label,variant,'exit',r.returncode,flush=True)
 p.write_bytes(before)
 assert p.read_bytes()==before and live.read_bytes()==live_before
check('quartermaster','tests/apex_pattern_channels.test.ts','every recipe teaching pattern appears in EXACTLY','src/sim/content/heroic_vendor.ts',"  { itemId: 'pattern_freehold_clockwork_lamp', marks: 16 },\n",'')
check('produce','tests/provisioner_firewall.test.ts','covers every bill and admits produce only in cooking and alchemy decor','src/sim/content/freehold/furnishing_recipes.ts',"    id: 'recipe_freehold_weapon_rack',\n    professionId: 'weaponcrafting',\n    resultItemId: 'freehold_weapon_rack',\n    resultCount: 1,\n    reagents: [\n      {\n        itemId: 'elderwood_log',\n        count: 1,","    id: 'recipe_freehold_weapon_rack',\n    professionId: 'weaponcrafting',\n    resultItemId: 'freehold_weapon_rack',\n    resultCount: 1,\n    reagents: [\n      {\n        itemId: 'vale_wheat',\n        count: 1,")
Path('/tmp/freeholds-crafted-qa-mutations.json').write_text(json.dumps({'scratch':str(scratch),'runs':results,'liveSourcesUnchanged':True},indent=2)+'\n')
