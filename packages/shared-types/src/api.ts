/** Standard envelope returned by successful API operations. */
export interface ApiSuccess<T> {
  data: T;
}

/** Stable API error envelope consumed by browser requests. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    fields?: string[];
  };
}
