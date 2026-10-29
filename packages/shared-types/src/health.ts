/** Response body returned by the API liveness endpoint. */
export interface ApiLivenessResponse {
  service: string;
  status: 'ok';
}

/** Response body returned when the API and its required database are ready. */
export interface ApiHealthResponse extends ApiLivenessResponse {
  dependencies: {
    postgresql: 'ok';
  };
}
