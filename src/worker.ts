interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttp = forwardedProto ? forwardedProto === 'http' : url.protocol === 'http:';
    if (isHttp) {
      const destination = `https://${url.host}${url.pathname}${url.search}${url.hash}`;
      return new Response(null, { status: 301, headers: { location: destination } });
    }

    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    const contentType = headers.get('content-type');
    if (contentType && /^text\/(?:html|plain)(?:;|$)/i.test(contentType) && !/charset=/i.test(contentType)) {
      headers.set('content-type', `${contentType.split(';')[0]}; charset=UTF-8`);
    }
    if (contentType && /^(?:application|text)\/xml(?:;|$)/i.test(contentType) && !/charset=/i.test(contentType)) {
      headers.set('content-type', `${contentType.split(';')[0]}; charset=UTF-8`);
    }

    return new Response(asset.body, {
      status: asset.status,
      statusText: asset.statusText,
      headers,
    });
  },
};
