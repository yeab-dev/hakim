// The one fetcher every SWR query in Hakim uses.
//
// fetch() only rejects when the network fails; a 401, 404 or 500 resolves
// like a success. SWR treats a *thrown* error as the error state, so this
// throws for any non-OK response, with the status and the body's message
// attached, and returns the parsed JSON otherwise. `no-store` keeps the
// browser's HTTP cache out of the way — SWR is the cache.
export class FetchError extends Error {
  constructor(status, message, info) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

export async function fetcher(url) {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) {
    const info = await response.json().catch(() => null);
    throw new FetchError(response.status, info?.error ?? `Request failed with ${response.status}`, info);
  }
  return response.json();
}
