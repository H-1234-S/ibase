import { API_PORT } from '@ibase/constants';

/** Validates environment variables and applies the API's local port default. */
export function validateEnvironment(environment: Record<string, unknown>) {
  const port = Number(environment.API_PORT ?? API_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }

  return { ...environment, API_PORT: port };
}
