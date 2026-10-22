/**
 * Infrastructure error carrying only the endpoint and status: never response bodies,
 * tokens or credentials (AGENTS.md §5, §8).
 */
export class MobiliaHttpError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(endpoint: string, status: number) {
    super(`Mobilia ${endpoint} responded with HTTP ${status}`);
    this.name = "MobiliaHttpError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

/** The API answered 2xx but the payload did not match the expected shape. */
export class MobiliaResponseError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string) {
    super(`Mobilia ${endpoint} returned an unexpected payload`);
    this.name = "MobiliaResponseError";
    this.endpoint = endpoint;
  }
}
