import crypto from 'crypto';
import type { Core } from '@strapi/strapi';

const REVOKED_TOKEN_UID = 'api::revoked-token.revoked-token';

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  return Buffer.from(padded, 'base64').toString('utf8');
};

export const extractBearerToken = (authorizationHeader?: string | null) => {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
};

export const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const getTokenExpiryDate = (token: string) => {
  try {
    const [, payloadPart] = token.split('.');

    if (!payloadPart) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as { exp?: number };

    if (!payload.exp) {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
};

export const cleanupExpiredRevokedTokens = async (strapi: Core.Strapi) => {
  const now = new Date().toISOString();

  await strapi.db.query(REVOKED_TOKEN_UID).deleteMany({
    where: {
      expiresAt: {
        $notNull: true,
        $lt: now,
      },
    },
  });
};
