import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3000',     // Next.js local
        'http://localhost:3001',
        'https://frontend-umber-mu-36.vercel.app', // Add your deployed frontend URL later
        '*'                            // Temporary: Allow all (for testing)
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: true,             
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'global::api-rate-limit',
  'global::reject-revoked-token',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;