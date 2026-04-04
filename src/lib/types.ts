export type Env = {
  Bindings: {
    DB: D1Database;
    KV: KVNamespace;
    R2: R2Bucket;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    username: string;
  };
};
