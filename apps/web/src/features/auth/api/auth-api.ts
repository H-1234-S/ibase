import type {
  ApiErrorResponse,
  ApiSuccess,
  ApiValidationError,
  PublicUser,
} from '@ibase/shared-types';

/** A stable API error used by authentication forms and request retry logic. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly validationErrors?: ApiValidationError[],
    readonly fields?: string[],
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<boolean> | undefined;

/** Calls the cookie-authenticated API and refreshes only expired Access Tokens. */
export async function authRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, requestOptions(init));

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.ok) {
    const body = (await response.json()) as ApiSuccess<T>;
    return body.data;
  }

  const error = await readApiError(response);
  if (error.code !== 'ACCESS_TOKEN_EXPIRED' || path === '/api/auth/refresh') {
    throw error;
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    throw new ApiRequestError('UNAUTHENTICATED', 'Please sign in again', 401);
  }

  const retried = await fetch(path, requestOptions(init));
  if (retried.status === 204) {
    return undefined as T;
  }
  if (!retried.ok) {
    throw await readApiError(retried);
  }

  return ((await retried.json()) as ApiSuccess<T>).data;
}

/** Loads the caller's public profile using the server's authentication state. */
export async function fetchCurrentUser() {
  const result = await authRequest<{ user: PublicUser }>('/api/auth/me');
  return result.user;
}

/** Creates JSON and CSRF headers for browser-originated API requests. */
export function requestOptions(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  headers.set('X-Ibase-Request', '1');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return { ...init, headers, credentials: 'include' };
}

async function refreshSession() {
  if (!refreshInFlight) {
    const refresh = async () => {
      const performRefresh = async () => {
        const response = await fetch(
          '/api/auth/refresh',
          requestOptions({ method: 'POST' }),
        );
        if (response.ok) {
          return true;
        }
        return false;
      };

      if ('locks' in navigator && navigator.locks) {
        return navigator.locks.request('ibase-auth-refresh', performRefresh);
      }

      return performRefresh();
    };

    refreshInFlight = refresh().finally(() => {
      refreshInFlight = undefined;
    });
  }

  return refreshInFlight;
}

async function readApiError(response: Response) {
  let body: ApiErrorResponse | undefined;
  try {
    body = (await response.json()) as ApiErrorResponse;
  } catch {
    body = undefined;
  }

  return new ApiRequestError(
    body?.error.code ?? 'INTERNAL_SERVER_ERROR',
    body?.error.message ?? 'Request failed',
    response.status,
    body?.error.validationErrors,
    body?.error.fields,
  );
}
