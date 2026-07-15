// PostgREST/Postgres error codes used across services to map raw DB errors
// to the right domain error (see lib/errors.ts).

// Returned by PostgREST's .single() when a query matches zero (or more
// than one) rows.
export const NOT_FOUND_CODE = "PGRST116";

// Postgres codes for check-constraint, foreign-key, and unique violations.
const CONSTRAINT_VIOLATION_CODES = new Set(["23514", "23503", "23505"]);

export function isConstraintViolation(code: string | undefined) {
  return !!code && CONSTRAINT_VIOLATION_CODES.has(code);
}
