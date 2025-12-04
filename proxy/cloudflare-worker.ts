export interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Cloudflare Worker, который проксирует запросы к DeepSeek API
 * и добавляет корректные CORS-заголовки.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Allow': 'POST, OPTIONS',
        },
      });
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response('Missing DEEPSEEK_API_KEY', { status: 500 });
    }

    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (error) {
      return corsResponse(env, request, new Response('Invalid JSON body', { status: 400 }));
    }

    try {
      const apiResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody = await apiResponse.text();
      const responseHeaders = {
        'Content-Type': apiResponse.headers.get('Content-Type') || 'application/json',
      };

      return corsResponse(
        env,
        request,
        new Response(responseBody, {
          status: apiResponse.status,
          headers: responseHeaders,
        }),
      );
    } catch (error) {
      console.error('DeepSeek proxy error:', error);
      return corsResponse(
        env,
        request,
        new Response('Proxy request failed', { status: 502 }),
      );
    }
  },
} satisfies ExportedHandler<Env>;

/**
 * Обработка preflight (OPTIONS) запросов
 */
function handleOptions(request: Request, env: Env): Response {
  // Make sure the required headers are present
  const accessControlRequestHeaders = request.headers.get('Access-Control-Request-Headers');
  const accessControlRequestMethod = request.headers.get('Access-Control-Request-Method');

  if (accessControlRequestHeaders && accessControlRequestMethod) {
    return corsResponse(
      env,
      request,
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Headers': accessControlRequestHeaders,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      }),
    );
  }

  return corsResponse(env, request, new Response(null, { status: 204 }));
}

/**
 * Добавляет CORS заголовки к ответу
 */
function corsResponse(env: Env, request: Request, response: Response): Response {
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  const origin = request.headers.get('Origin');
  const headers = new Headers(response.headers);

  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Credentials', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

