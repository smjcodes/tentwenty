export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/logout',
      handler: 'session.logout',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
