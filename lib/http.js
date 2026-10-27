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
