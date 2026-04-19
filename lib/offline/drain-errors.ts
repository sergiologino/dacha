/** Остановка drain при потере сессии (401/403). */
export class DrainAuthError extends Error {
  constructor() {
    super("DRAIN_AUTH_REQUIRED");
    this.name = "DrainAuthError";
  }
}

export function isDrainAuthError(e: unknown): e is DrainAuthError {
  return e instanceof DrainAuthError;
}
