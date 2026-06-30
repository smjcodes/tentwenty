import { cleanupExpiredRevokedTokens, extractBearerToken, hashToken } from '../utils/token';

const REVOKED_TOKEN_UID = 'api::revoked-token.revoked-token';

export default (_config: unknown, { strapi }: { strapi: any }) =>
  async (ctx: any, next: () => Promise<void>) => {
    const token = extractBearerToken(ctx.request.header?.authorization);

    if (!token) {
      await next();
      return;
    }

    await cleanupExpiredRevokedTokens(strapi);

    const revokedToken = await strapi.db.query(REVOKED_TOKEN_UID).findOne({
      where: {
        tokenHash: hashToken(token),
      },
    });

    if (revokedToken) {
      ctx.status = 401;
      ctx.body = {
        error: {
          status: 401,
          name: 'UnauthorizedError',
          message: 'This token has been logged out. Please sign in again.',
        },
      };

      return;
    }

    await next();
  };
