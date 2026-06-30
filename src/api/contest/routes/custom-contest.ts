export default {
  routes: [
    {
      method: 'POST',
      path: '/contests/:id/join',
      handler: 'contest.join',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/contests/:id/submit',
      handler: 'contest.submit',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/contests/:id/leaderboard',
      handler: 'contest.leaderboard',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/me/history',
      handler: 'contest.myHistory',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/me/in-progress',
      handler: 'contest.myInProgress',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/me/prizes',
      handler: 'contest.myPrizes',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/contests/:id/award-prize',
      handler: 'contest.awardPrize',
      config: {
        policies: ['global::has-admin-api-access'],
      },
    }
  ],
};
