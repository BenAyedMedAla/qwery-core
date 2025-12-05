import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';

const API_HOST = process.env.VITE_POSTHOG_URL || 'https://us.i.posthog.com';
const ASSET_HOST =
  process.env.VITE_POSTHOG_ASSETS_URL || 'https://us-assets.i.posthog.com';

const posthogProxy = async (request: Request, splat?: string) => {
  const url = new URL(request.url);
  const targetHost = url.pathname.startsWith('/qwery/static/')
    ? ASSET_HOST
    : API_HOST;

  const newUrl = new URL(url);
  newUrl.protocol = 'https';
  newUrl.hostname = new URL(targetHost).hostname;
  newUrl.port = '443';

  // Use splat parameter if available, otherwise extract from pathname
  if (splat) {
    newUrl.pathname = `/${splat}`;
  } else {
    newUrl.pathname = newUrl.pathname.replace(/^\/qwery/, '');
  }

  const headers = new Headers(request.headers);
  headers.set('host', new URL(targetHost).hostname);

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
    body: request.body,
  };

  // This is required when passing a streaming body (like request.body) to fetch.
  if (request.body) {
    (fetchOptions as { duplex?: string }).duplex = 'half';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s

    fetchOptions.signal = controller.signal;

    const response = await fetch(newUrl, fetchOptions);
    clearTimeout(timeoutId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    // Handle timeout and network errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog Proxy] Request timeout:', newUrl.toString());
      }
      return new Response('Request timeout', { status: 504 });
    }
    // Only log in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      console.error('[PostHog Proxy] Fetch error:', error);
    }
    return new Response('Proxy error', { status: 502 });
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) =>
  posthogProxy(request, params['*']);

export const action = async ({ request, params }: ActionFunctionArgs) =>
  posthogProxy(request, params['*']);
