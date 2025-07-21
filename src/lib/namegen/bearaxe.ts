import { getRandom, ucwords } from '../utils/utils'

export function name_bearaxe() {
  const fn1 = ['','','','br','d','dr','g','gr','kh','kr','m','n','r','s','sr','str','th','tr','thr','v','z', 'b','bh','c','d','dr','g','gh','h','m','n','s','sk','sc','t','th','v','z','zh']
  const fn2 = ['a','e','i','o','u','a','e','i','o','u','a','e','i','o','u','a','e','i','o','u','au','ai','oa','ao', 'e','i','u','e','i','u','e','i','u','e','i','u','a','a','o','o']
  const fn3 = ['d','g','k','l','r','th','d','g','k','l','r','th','br','d','dh','dr','g','gr','gh','gn','gm','gz','gd','k','kr','l','lb','ld','lg','lgr','ldr','nd','ng','nr','ndr','ngr','r','rd','rdr','rg','rt','rbr','rb','rgr','th','tr','thr', 'br','dr','dg','dw','dd','ff','fr','gr','gw','gn','gm','gf','gv','kk','kh','kr','kv','lg','lgr','lv','ng','ngr','ngw','nd','ndw','ndr','rg','rgr','rgw','rw','rz','sg','sgr','sv','th','tr','tv','thr','vr']
  const fn4 = ['c','d','g','gg','k','m','mm','n','r','rd','t', '','','','','','d','h','m','n','t']

  //const ln1 = ['amber','autumn','battle','bear','bitter','black','blunt','boulder','brane','bright','brittle','broad','broken','bronze','brown','cask','cinder','cliff','coal','cold','common','copper','crag','deep','distant','ember','far','fiery','fire','flame','flat','flint','forge','full','fuse','gold','golden','grand','granite','gray','great','grim','grudge','grumble','hammer','hill','ingot','iron','keen','keg','krag','lead','light','magma','merry','metal','mild','mirth','mithril','mountain','noble','onyx','plain','proud','regal','rich','rock','rough','rumble','shatter','silver','slender','solid','steel','stone','storm','stout','strong','thunder','true']
  //const ln2 = ['arm','armor','armour','axe','back','basher','beam','beard','bearer','belly','belt','bender','bluff','bone','bough','brace','branch','brand','breaker','brew','brewer','bringer','brow','buckle','buster','chaser','chest','chin','cloak','crag','crest','digger','dreamer','feet','finger','fire','fist','fists','flame','foot','force','forge','forged','fury','grip','grog','guard','gut','hammer','hand','hank','head','heart','helm','keeper','maker','mantle','mark','master','might','more','punch','rage','seeker','shaper','shield','shoulder','shout','strength','strider','striker','surge','sworn','thane','walker','ward']
  
  const firstname = getRandom(fn1) + getRandom(fn2) + getRandom(fn3) + getRandom(fn2) + getRandom(fn4)
  //const lastname = getRandom(ln1) + getRandom(ln2)

  return ucwords(`${firstname}`) // ${lastname}`)
}
