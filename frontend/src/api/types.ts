export interface FieldErrors {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}

export type ApiErrorBody = string | FieldErrors;

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(typeof body === "string" ? body : "Validation failed");
    this.status = status;
    this.body = body;
  }

  fieldError(field: string): string | undefined {
    if (typeof this.body === "string") return undefined;
    return this.body.fieldErrors?.[field]?.[0];
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}
