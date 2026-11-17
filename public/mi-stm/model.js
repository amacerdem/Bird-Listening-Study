export const clamp = (v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const tmrDb = z=>12-24*clamp(z);
export const dbText = value=>(value>=0?'+':'−')+Math.abs(value).toFixed(1);
export function routePoint(progress,route='joint',reverse=false){
  const p=clamp(reverse?1-progress:progress);
  if(route==='spectral') return {x:Math.min(1,2*p),y:Math.max(0,2*p-1)};
  if(route==='temporal') return {x:Math.max(0,2*p-1),y:Math.min(1,2*p)};
  return {x:p,y:p};
}
export const INITIAL={x:0,y:0,z:.30,masker:'other',route:'joint',reverse:false,progress:0,followingRoute:true,mapMode:'personal',f0Tolerance:3};
