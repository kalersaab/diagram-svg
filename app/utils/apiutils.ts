/**
 * Utility methods for invoking API endpoints.
 *
 * Authentication is handled via HttpOnly cookie (set by the backend on /login).
 * `credentials: 'include'` is passed on every request so the browser attaches
 * the cookie automatically — no manual token management needed.
 */

export interface UriEndPoint {
  uri: string;
  method: string;
  version: string;
  headerProps?: Record<string, string>;
}

interface PathParams {
  [key: string]: string;
}

interface BodyParams {
  [key: string]: unknown;
}

interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

// ─── URL construction ─────────────────────────────────────────────────────────

const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const makeUrl = ({
  uri,
  pathParams,
  query,
  version,
}: {
  uri: string;
  method: string;
  version: string;
  pathParams?: PathParams;
  query?: QueryParams;
}): string => {
  const base = getBaseUrl();

  const resolvedUri = uri
    .split('/')
    .map(segment =>
      segment.startsWith(':')
        ? encodeURIComponent(pathParams?.[segment.slice(1)] ?? '')
        : segment,
    )
    .join('/');

  const queryString =
    query && Object.keys(query).length > 0
      ? `?${new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : '';

  return `${base}${version}${resolvedUri}${queryString}`;
};

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

interface CallFetchInput {
  uriEndPoint: UriEndPoint;
  pathParams?: PathParams;
  query?: QueryParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>;
  fetchProps?: RequestInit;
}

const callFetch = async <T>({
  uriEndPoint,
  pathParams,
  query,
  body,
  fetchProps = {},
}: CallFetchInput): Promise<{ data: T; status: number }> => {
  const url = makeUrl({ ...uriEndPoint, pathParams, query });

  const isReadMethod = ['GET', 'HEAD'].includes(uriEndPoint.method.toUpperCase());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(uriEndPoint.headerProps ?? {}),
  };

  const { headers: _ignored, ...restFetchProps } = fetchProps as RequestInit & {
    headers?: unknown;
  };

  const response = await fetch(url, {
    method: uriEndPoint.method,
    headers,
    body: isReadMethod ? undefined : JSON.stringify(body ?? {}),
    credentials: 'include', // sends the HttpOnly Authorization cookie
    ...restFetchProps,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ?? response.statusText;
    const error = Object.assign(new Error(message), {
      response: { status: response.status, data },
    });
    throw error;
  }

  return { data: data as T, status: response.status };
};

// ─── Public callApi ───────────────────────────────────────────────────────────

interface CallApiProps {
  uriEndPoint: UriEndPoint;
  pathParams?: PathParams;
  query?: QueryParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>;
  fetchProps?: RequestInit;
}

/**
 * Generic utility for invoking any REST endpoint.
 *
 * - Automatically attaches the HttpOnly session cookie.
 * - On 401, dispatches a custom `unauthorized` window event so the app can
 *   show the auth modal without coupling this utility to any React state.
 * - On 403, redirects to `/`.
 */
export function callApi<ResponseType>({
  uriEndPoint,
  pathParams,
  query,
  body,
  fetchProps,
}: CallApiProps): Promise<ResponseType> {
  return new Promise((resolve, reject) => {
    callFetch<ResponseType>({
      uriEndPoint,
      pathParams,
      query,
      body,
      fetchProps,
    })
      .then(({ data }) => resolve(data))
      .catch(err => {
        const status: number | undefined = (
          err as { response?: { status?: number } }
        )?.response?.status;

        if (status === 401) {
          // Let the UI layer react (e.g. show the AuthModal) without a hard coupling
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('diagram:unauthorized'));
          }
        }

        if (status === 403 && typeof window !== 'undefined') {
          window.location.href = '/';
        }

        reject(
          (err as { response?: { data?: unknown } })?.response?.data ?? err,
        );
      });
  });
}
