interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: number | null;
}

function parseRedisUrl(url: string | undefined): Pick<RedisConnectionOptions, 'host' | 'port' | 'password'> {
  if (!url) {
    return { host: 'localhost', port: 6379 };
  }
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
}

export const redisConnection: RedisConnectionOptions = {
  ...parseRedisUrl(process.env.REDIS_URL),
  maxRetriesPerRequest: null,
};
