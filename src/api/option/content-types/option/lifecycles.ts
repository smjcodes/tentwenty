import { QUESTION_TYPES } from '../../../../utils/contest';
import { createHttpError } from '../../../../utils/http';

const OPTION_UID = 'api::option.option';
const QUESTION_UID = 'api::question.question';

const resolveQuestionId = (data: Record<string, any>, existingOption?: Record<string, any>) => {
  if (typeof data.question === 'number') {
    return data.question;
  }

  if (typeof data.question?.id === 'number') {
    return data.question.id;
  }

  if (typeof existingOption?.question?.id === 'number') {
    return existingOption.question.id;
  }

  if (typeof existingOption?.question === 'number') {
    return existingOption.question;
  }

  return null;
};

const assertOptionRules = async (
  data: Record<string, any>,
  existingOption?: Record<string, any>,
  currentOptionId?: number
) => {
  const questionId = resolveQuestionId(data, existingOption);

  if (!questionId) {
    return;
  }

  const question = await strapi.db.query(QUESTION_UID).findOne({
    where: { id: questionId },
    select: ['id', 'questionType'],
  });

  if (!question) {
    throw createHttpError(400, 'Option must belong to a valid question.');
  }

  const existingOptions = await strapi.db.query(OPTION_UID).findMany({
    where: {
      question: question.id,
    },
    select: ['id', 'isCorrect'],
  });

  const isCorrect = typeof data.isCorrect === 'boolean' ? data.isCorrect : existingOption?.isCorrect;
  const remainingOptions = existingOptions.filter((option: any) => option.id !== currentOptionId);
  const correctOptionCount =
    remainingOptions.filter((option: any) => option.isCorrect).length + (isCorrect ? 1 : 0);
  const optionCount = remainingOptions.length + 1;

  if (
    (question.questionType === QUESTION_TYPES.SINGLE_SELECT ||
      question.questionType === QUESTION_TYPES.TRUE_FALSE) &&
    correctOptionCount > 1
  ) {
    throw createHttpError(
      400,
      `${question.questionType} questions can only have one correct option.`
    );
  }

  if (question.questionType === QUESTION_TYPES.TRUE_FALSE && optionCount > 2) {
    throw createHttpError(400, 'TRUE_FALSE questions can only have two options.');
  }
};

export default {
  async beforeCreate(event: any) {
    await assertOptionRules(event.params.data);
  },

  async beforeUpdate(event: any) {
    const existingOption = await strapi.db.query(OPTION_UID).findOne({
      where: event.params.where,
      populate: {
        question: {
          select: ['id'],
        },
      },
      select: ['id', 'isCorrect'],
    });

    await assertOptionRules(event.params.data, existingOption, existingOption?.id);
  },
};
