import { factories } from '@strapi/strapi';
import { handleControllerError } from '../../../utils/http';

const contestServiceUid = 'api::contest.contest';

export default factories.createCoreController(contestServiceUid, ({ strapi }) => ({
  async find(ctx) {
    try {
      const contests = await strapi.service(contestServiceUid).listContests();

      return {
        data: contests,
        meta: {
          count: contests.length,
        },
      };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async findOne(ctx) {
    try {
      const contest = await strapi.service(contestServiceUid).getContestDetail(ctx.params.id);

      return {
        data: contest,
      };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async join(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).joinContest({
        contestIdentifier: ctx.params.id,
        userId: ctx.state.user.id,
      });

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async submit(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).submitContest({
        contestIdentifier: ctx.params.id,
        userId: ctx.state.user.id,
        answers: ctx.request.body?.answers,
      });

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async leaderboard(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).getLeaderboard(ctx.params.id);

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async myHistory(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).getUserHistory(ctx.state.user.id);

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async myInProgress(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).getUserInProgress(ctx.state.user.id);

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async myPrizes(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).getUserPrizes(ctx.state.user.id);

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },

  async awardPrize(ctx) {
    try {
      const data = await strapi.service(contestServiceUid).awardPrize(ctx.params.id);

      ctx.body = { data };
    } catch (error) {
      handleControllerError(ctx, error);
    }
  },
}));
