import type { Core } from '@strapi/strapi';

type Bucket = {
  count: number;
  resetAt: number;
};

type Rule = {
  keyPrefix: string;
  max: number;
  method: string;
  pathPattern: RegExp;
  windowMs: number;
};

const buckets = new Map<string, Bucket>();

const rules: Rule[] = [
  {
    keyPrefix: 'auth-login',
    method: 'POST',
    pathPattern: /^\/api\/auth\/local$/,
    max: 5,
    windowMs: 60_000,
  },
  {
    keyPrefix: 'auth-register',
    method: 'POST',
    pathPattern: /^\/api\/auth\/local\/register$/,
    max: 3,
    windowMs: 60_000,
  },
  {
    keyPrefix: 'contest-join',
    method: 'POST',
    pathPattern: /^\/api\/contests\/[^/]+\/join$/,
    max: 10,
    windowMs: 60_000,
  },
  {
    keyPrefix: 'contest-submit',
    method: 'POST',
    pathPattern: /^\/api\/contests\/[^/]+\/submit$/,
    max: 10,
    windowMs: 60_000,
  },
  {
    keyPrefix: 'contest-leaderboard',
    method: 'GET',
    pathPattern: /^\/api\/contests\/[^/]+\/leaderboard$/,
    max: 30,
    windowMs: 60_000,
  },
];

const buildBucketKey = (ctx: any, rule: Rule) =>
  `${rule.keyPrefix}:${ctx.state.user?.id ?? ctx.ip ?? 'anonymous'}`;

const getRule = (ctx: any) =>
  rules.find(
    (rule) => rule.method === ctx.method.toUpperCase() && rule.pathPattern.test(ctx.request.path)
  );

const middleware: Core.MiddlewareFactory = () => {
  return async (ctx, next) => {
    const rule = getRule(ctx);

    if (!rule) {
      await next();
      return;
    }

    const now = Date.now();
    const bucketKey = buildBucketKey(ctx, rule);
    const existingBucket = buckets.get(bucketKey);

    if (!existingBucket || existingBucket.resetAt <= now) {
      buckets.set(bucketKey, {
        count: 1,
        resetAt: now + rule.windowMs,
      });

      await next();
      return;
    }

    if (existingBucket.count >= rule.max) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          name: 'TooManyRequestsError',
          message: 'Too many requests. Please try again later.',
        },
      };
      return;
    }

    existingBucket.count += 1;
    buckets.set(bucketKey, existingBucket);

    await next();
  };
};

export default middleware;
