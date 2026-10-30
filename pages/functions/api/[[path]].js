export async function onRequestPost({request, env}) {
  try {
    if (!env.GAS_URL || !env.GAS_SHARED_SECRET) throw new Error('Server not configured');
    const input = await request.json();
    if (!['list','lookup','register'].includes(input.action)) return Response.json({ok:false,error:'Invalid action'},{status:400});
    const payload = {action:input.action,barcode:input.barcode,flavorId:input.flavorId,secret:env.GAS_SHARED_SECRET};
    // Apps Script ContentService redirects to googleusercontent.com; fetch follows it.
    const upstream = await fetch(env.GAS_URL, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'});
    if (!upstream.ok) throw new Error('GAS HTTP '+upstream.status);
    const result = await upstream.json();
    return Response.json(result,{status:result.ok?200:400,headers:{'Cache-Control':'no-store'}});
  } catch (e) {
    return Response.json({ok:false,error:String(e?.message||e)},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}
