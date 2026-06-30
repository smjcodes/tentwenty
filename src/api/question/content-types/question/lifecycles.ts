import { createHttpError } from '../../../../utils/http';

const QUESTION_UID = 'api::question.question';

const resolveContestId = async (data: Record<string, any>, existingQuestion?: Record<string, any>) => {
  if (data.contest) {
    return data.contest;
  }

  if (existingQuestion?.contest?.id) {
    return existingQuestion.contest.id;
  }

  if (typeof existingQuestion?.contest === 'number') {
    return existingQuestion.contest;
  }

  return null;
};

const assertUniqueQuestionText = async (
  data: Record<string, any>,
  existingQuestion?: Record<string, any>,
  currentQuestionId?: number
) => {
  const text = String(data.text ?? existingQuestion?.text ?? '').trim();
  const contestId = await resolveContestId(data, existingQuestion);

  if (!text || !contestId) {
    return;
  }

  const duplicateQuestion = await strapi.db.query(QUESTION_UID).findOne({
    where: {
      contest: contestId,
      text,
    },
    select: ['id'],
  });

  if (duplicateQuestion && duplicateQuestion.id !== currentQuestionId) {
    throw createHttpError(400, 'Question text must be unique within the same contest.');
  }
};

export default {
  async beforeCreate(event: any) {
    await assertUniqueQuestionText(event.params.data);
  },

  async beforeUpdate(event: any) {
    const existingQuestion = await strapi.db.query(QUESTION_UID).findOne({
      where: event.params.where,
      populate: {
        contest: {
          select: ['id'],
        },
      },
      select: ['id', 'text'],
    });

    await assertUniqueQuestionText(event.params.data, existingQuestion, existingQuestion?.id);
  },
};
