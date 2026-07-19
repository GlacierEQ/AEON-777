export class BridgeError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = "BridgeError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function fail(status, code, message, details) {
  throw new BridgeError(status, code, message, details);
}

export function problem(error, traceId) {
  if (error instanceof BridgeError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details })
        },
        trace_id: traceId
      }
    };
  }
  return {
    status: 500,
    body: {
      ok: false,
      error: { code: "internal_error", message: "The bridge failed without completing the requested action." },
      trace_id: traceId
    }
  };
}
