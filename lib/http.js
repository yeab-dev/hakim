// One error shape for every endpoint, so a caller has one error path:
//   { "error": "Validation failed", "fieldErrors": { "phone": ["Use 09… or +2519…"] } }
// fieldErrors use arrays of messages, as zod's flatten() does.
export function problem(status, error, fieldErrors) {
  const body = { error };
  if (fieldErrors) {
    body.fieldErrors = Object.fromEntries(
      Object.entries(fieldErrors).map(([field, message]) => [field, [].concat(message)]),
    );
  }
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export const NOT_SIGNED_IN = () => problem(401, "Sign in first: this needs a session cookie.");
