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
    validationErrors?: ApiValidationError[];
    /** Legacy validation payload emitted by API instances running the previous contract. */
    fields?: string[];
  };
}

/** Stable field and constraint identifiers returned for request validation failures. */
export interface ApiValidationError {
  field: string;
  rule: string;
}
