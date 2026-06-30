import { createHttpError } from '../../../../utils/http';

const assertContestWindow = (data: Record<string, any>, existingContest?: Record<string, any>) => {
  const startTime = data.startTime ?? existingContest?.startTime;
  const endTime = data.endTime ?? existingContest?.endTime;

  if (!startTime || !endTime) {
    return;
  }

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw createHttpError(400, 'Contest startTime and endTime must be valid datetimes.');
  }

  if (startMs >= endMs) {
    throw createHttpError(400, 'Contest endTime must be later than startTime.');
  }
};

export default {
  async beforeCreate(event: any) {
    assertContestWindow(event.params.data);
  },

  async beforeUpdate(event: any) {
    const existingContest = await strapi.db.query('api::contest.contest').findOne({
      where: event.params.where,
      select: ['startTime', 'endTime'],
    });

    assertContestWindow(event.params.data, existingContest);
  },
};
