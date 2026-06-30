import { createHttpError } from '../../../../utils/http';

const PARTICIPATION_UID = 'api::participation.participation';

const resolveRelationId = (value: any, fallbackValue?: any) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value?.id === 'number') {
    return value.id;
  }

  if (typeof fallbackValue === 'number') {
    return fallbackValue;
  }

  if (typeof fallbackValue?.id === 'number') {
    return fallbackValue.id;
  }

  return null;
};

const assertUniqueParticipation = async (
  data: Record<string, any>,
  existingParticipation?: Record<string, any>,
  currentParticipationId?: number
) => {
  const userId = resolveRelationId(data.user, existingParticipation?.user);
  const contestId = resolveRelationId(data.contest, existingParticipation?.contest);

  if (!userId || !contestId) {
    return;
  }

  const duplicateParticipation = await strapi.db.query(PARTICIPATION_UID).findOne({
    where: {
      user: userId,
      contest: contestId,
    },
    select: ['id'],
  });

  if (duplicateParticipation && duplicateParticipation.id !== currentParticipationId) {
    throw createHttpError(409, 'A user can only have one participation per contest.');
  }
};

export default {
  async beforeCreate(event: any) {
    await assertUniqueParticipation(event.params.data);
  },

  async beforeUpdate(event: any) {
    const existingParticipation = await strapi.db.query(PARTICIPATION_UID).findOne({
      where: event.params.where,
      populate: {
        user: {
          select: ['id'],
        },
        contest: {
          select: ['id'],
        },
      },
      select: ['id'],
    });

    await assertUniqueParticipation(
      event.params.data,
      existingParticipation,
      existingParticipation?.id
    );
  },
};
