export type Env = {
  Bindings: {
    DB: D1Database;
    KV: KVNamespace;
    R2: R2Bucket;
    JWT_SECRET: string;
    ALLOWED_EMAILS?: string; // comma-separated, empty = no restriction
  };
  Variables: {
    userId: string;
    username: string;
  };
};
