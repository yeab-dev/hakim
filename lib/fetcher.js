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
