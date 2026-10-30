
export async function onRequestPost({ request, env }) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };

  try {
    if (!env.GAS_URL || !env.GAS_SHARED_SECRET) {
      throw new Error('Server not configured');
    }

    const input = await request.json();

    const actionMap = {
      list: 'getFlavors',
      lookup: 'findBarcode',
      register: 'registerBarcode',
      systemCheck: 'systemCheck'
    };

    const action = actionMap[input.action];

    if (!action) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Invalid action'
        }),
        { status: 400, headers }
      );
    }

    const payload = {
      action,
      barcode: input.barcode,
      flavorId: input.flavorId,
      secret: env.GAS_SHARED_SECRET
    };

    const upstream = await fetch(env.GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!upstream.ok) {
      throw new Error('GAS HTTP ' + upstream.status);
    }

    const result = await upstream.json();

    return new Response(
      JSON.stringify(result),
      {
        status: result.ok ? 200 : 400,
        headers
      }
    );

  } catch (error) {
    console.error('API error:', error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: String(error?.message || error)
      }),
      { status: 500, headers }
    );
  }
}
