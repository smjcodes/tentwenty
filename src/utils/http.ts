export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const createHttpError = (status: number, message: string, details?: unknown) =>
  new HttpError(status, message, details);

export const handleControllerError = (ctx: any, error: unknown) => {
  if (error instanceof HttpError) {
    ctx.status = error.status;
    ctx.body = {
      error: {
        status: error.status,
        name: error.name,
        message: error.message,
        details: error.details,
      },
    };

    return;
  }

  const fallbackMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred.';

  ctx.status = 500;
  ctx.body = {
    error: {
      status: 500,
      name: 'InternalServerError',
      message: fallbackMessage,
    },
  };
};
