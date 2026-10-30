
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API以外はHTMLなどの静的ファイルを配信
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    };

    if (url.pathname !== '/api/barcodes') {
      return new Response(
        JSON.stringify({ ok: false, error: 'API not found' }),
        { status: 404, headers }
      );
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'POST required' }),
        { status: 405, headers }
      );
    }

    try {
      if (!env.GAS_URL || !env.GAS_SHARED_SECRET) {
  throw new Error(
    'Missing configuration: ' +
    [
      !env.GAS_URL ? 'GAS_URL' : null,
      !env.GAS_SHARED_SECRET ? 'GAS_SHARED_SECRET' : null
    ].filter(Boolean).join(', ')
  );
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
          JSON.stringify({ ok: false, error: 'Invalid action' }),
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
};
