export class WordPressConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordPressConfigError";
  }
}

type WordPressRequestErrorParams = {
  status?: number;
  endpoint: string;
  cause?: unknown;
};

export class WordPressRequestError extends Error {
  readonly status?: number;
  readonly endpoint: string;

  constructor(message: string, params: WordPressRequestErrorParams) {
    super(message);
    this.name = "WordPressRequestError";
    this.status = params.status;
    this.endpoint = params.endpoint;
    if (params.cause !== undefined) {
      this.cause = params.cause;
    }
  }
}
