import { createHttpError, handleControllerError } from '../../../utils/http';
import { cleanupExpiredRevokedTokens, extractBearerToken, getTokenExpiryDate, hashToken } from '../../../utils/token';

const REVOKED_TOKEN_UID = 'api::revoked-token.revoked-token';

export default {
  async logout(ctx: any) {
    try {
      if (!ctx.state.user?.id) {
        throw createHttpError(401, 'Authentication is required.');
      }

      const token = extractBearerToken(ctx.request.header?.authorization);

      if (!token) {
        throw createHttpError(401, 'Bearer token is required.');
      }

      const tokenHash = hashToken(token);
      const existingRevocation = await strapi.db.query(REVOKED_TOKEN_UID).findOne({
        where: { tokenHash },
      });

      if (!existingRevocation) {
        const revokedAt = new Date().toISOString();
        const expiresAt = getTokenExpiryDate(token)?.toISOString() ?? null;

        await strapi.db.query(REVOKED_TOKEN_UID).create({
          data: {
            tokenHash,
            revokedAt,
            expiresAt,
            user: ctx.state.user.id,
          },
        });

        await cleanupExpiredRevokedTokens(strapi);

        ctx.body = {
          data: {
            loggedOut: true,
            revokedAt,
            expiresAt,
          },
        };

        return;
      }

      ctx.body = {
        data: {
          loggedOut: true,
          revokedAt: existingRevocation.revokedAt,
          expiresAt: existingRevocation.expiresAt ?? null,
        },
      };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },
};
