import { factories } from '@strapi/strapi';
import {
  assertContestJoinability,
  assertContestSubmittable,
  buildIdentifierWhere,
  findEntityByIdentifier,
  getUserType,
  isExactMatch,
  normalizeAnswerPayload,
  PARTICIPATION_STATUSES,
  serializeContestDetail,
  serializeContestSummary,
  serializeHistoryEntry,
  serializeLeaderboardEntry,
  serializeParticipation,
  serializePrizeWinner,
  toPublicId,
  validateSelectionCount,
} from '../../../utils/contest';
import { createHttpError } from '../../../utils/http';

const CONTEST_UID = 'api::contest.contest';
const PARTICIPATION_UID = 'api::participation.participation';
const PRIZE_WINNER_UID = 'api::prize-winner.prize-winner';
const USER_ANSWER_UID = 'api::user-answer.user-answer';
const USER_UID = 'plugin::users-permissions.user';

export default factories.createCoreService(CONTEST_UID, ({ strapi }) => ({
  async findContestOrThrow(identifier: unknown, populate: Record<string, unknown> = {}) {
    const contest = await strapi.db.query(CONTEST_UID).findOne({
      where: buildIdentifierWhere(identifier),
      populate,
    });

    if (!contest) {
      throw createHttpError(404, 'Contest not found.');
    }

    return contest;
  },

  async findActorOrThrow(userId: number) {
    const actor = await strapi.db.query(USER_UID).findOne({
      where: { id: userId },
      populate: ['role'],
    });

    if (!actor) {
      throw createHttpError(401, 'Authenticated user not found.');
    }

    return actor;
  },

  async listContests() {
    const contests = await strapi.db.query(CONTEST_UID).findMany({
      populate: {
        questions: {
          select: ['id'],
        },
        prizeWinner: {
          select: ['id'],
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return contests.map(serializeContestSummary);
  },

  async getContestDetail(identifier: unknown) {
    const contest = await this.findContestOrThrow(identifier, {
      questions: {
        populate: {
          options: true,
        },
      },
      prizeWinner: {
        select: ['id'],
      },
    });

    return serializeContestDetail(contest);
  },

  async joinContest({
    contestIdentifier,
    userId,
  }: {
    contestIdentifier: unknown;
    userId: number;
  }) {
    const actor = await this.findActorOrThrow(userId);
    const contest = await this.findContestOrThrow(contestIdentifier);

    assertContestJoinability(contest, getUserType(actor));

    const existingParticipation = await strapi.db.query(PARTICIPATION_UID).findOne({
      where: {
        user: actor.id,
        contest: contest.id,
      },
    });

    if (existingParticipation) {
      throw createHttpError(409, 'You have already joined this contest.');
    }

    const participation = await strapi.db.query(PARTICIPATION_UID).create({
      data: {
        user: actor.id,
        contest: contest.id,
        status: PARTICIPATION_STATUSES.IN_PROGRESS,
        score: 0,
        startedAt: new Date().toISOString(),
      },
    });

    return {
      contest: serializeContestSummary(contest),
      participation: serializeParticipation(participation),
    };
  },

  async submitContest({
    contestIdentifier,
    userId,
    answers,
  }: {
    contestIdentifier: unknown;
    userId: number;
    answers: unknown;
  }) {
    const actor = await this.findActorOrThrow(userId);
    const contest = await this.findContestOrThrow(contestIdentifier, {
      questions: {
        populate: {
          options: true,
        },
      },
    });

    assertContestSubmittable(contest, getUserType(actor));

    const participation = await strapi.db.query(PARTICIPATION_UID).findOne({
      where: {
        user: userId,
        contest: contest.id,
      },
    });

    if (!participation) {
      throw createHttpError(404, 'You must join the contest before submitting.');
    }

    if (participation.status !== PARTICIPATION_STATUSES.IN_PROGRESS) {
      throw createHttpError(409, 'This contest participation has already been submitted.');
    }

    const normalizedAnswers = normalizeAnswerPayload(answers);
    const handledQuestions = new Set<string>();
    const answerRecords: any[] = [];
    let totalScore = 0;

    for (const answer of normalizedAnswers) {
      const question = findEntityByIdentifier(contest.questions, answer.questionIdentifier);

      if (!question) {
        throw createHttpError(400, 'Submitted question does not belong to this contest.');
      }

      const questionPublicId = toPublicId(question);

      if (handledQuestions.has(questionPublicId)) {
        throw createHttpError(400, 'Each question can only be submitted once.');
      }

      handledQuestions.add(questionPublicId);
      validateSelectionCount(question.questionType, answer.selectedOptionIdentifiers.length);

      const selectedOptions = answer.selectedOptionIdentifiers.map((selectedOptionIdentifier) => {
        const option = findEntityByIdentifier(question.options, selectedOptionIdentifier);

        if (!option) {
          throw createHttpError(400, 'Submitted option does not belong to the related question.');
        }

        return option;
      });

      const correctOptionIds = (question.options ?? [])
        .filter((option: any) => option.isCorrect)
        .map(toPublicId);
      const selectedOptionIds = selectedOptions.map(toPublicId);
      const isCorrect = isExactMatch(correctOptionIds, selectedOptionIds);
      const pointsAwarded = isCorrect ? question.points : 0;

      totalScore += pointsAwarded;
      answerRecords.push({
        participation: participation.id,
        question: question.id,
        selectedOptionIds,
        isCorrect,
        pointsAwarded,
      });
    }

    await strapi.db.query(USER_ANSWER_UID).deleteMany({
      where: {
        participation: participation.id,
      },
    });

    for (const answerRecord of answerRecords) {
      await strapi.db.query(USER_ANSWER_UID).create({
        data: answerRecord,
      });
    }

    const submittedAt = new Date().toISOString();

    const updatedParticipation = await strapi.db.query(PARTICIPATION_UID).update({
      where: { id: participation.id },
      data: {
        status: PARTICIPATION_STATUSES.SUBMITTED,
        score: totalScore,
        submittedAt,
      },
    });

    return {
      contest: serializeContestSummary(contest),
      participation: serializeParticipation(updatedParticipation),
      score: totalScore,
    };
  },

  async getLeaderboard(identifier: unknown) {
    const contest = await this.findContestOrThrow(identifier);
    const participations = await strapi.db.query(PARTICIPATION_UID).findMany({
      where: {
        contest: contest.id,
        status: PARTICIPATION_STATUSES.SUBMITTED,
      },
      populate: ['user'],
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
    });

    return {
      contest: serializeContestSummary(contest),
      entries: participations.map((participation: any, index: number) =>
        serializeLeaderboardEntry(participation, index + 1)
      ),
    };
  },

  async getUserHistory(userId: number) {
    const participations = await strapi.db.query(PARTICIPATION_UID).findMany({
      where: {
        user: userId,
      },
      populate: {
        contest: {
          populate: {
            questions: {
              select: ['id'],
            },
            prizeWinner: {
              select: ['id'],
            },
          },
        },
        prizeWinner: true,
      },
      orderBy: [{ startedAt: 'desc' }],
    });

    return participations.map(serializeHistoryEntry);
  },

  async getUserInProgress(userId: number) {
    const participations = await strapi.db.query(PARTICIPATION_UID).findMany({
      where: {
        user: userId,
        status: PARTICIPATION_STATUSES.IN_PROGRESS,
      },
      populate: {
        contest: {
          populate: {
            questions: {
              select: ['id'],
            },
            prizeWinner: {
              select: ['id'],
            },
          },
        },
      },
      orderBy: [{ startedAt: 'desc' }],
    });

    return participations.map(serializeHistoryEntry);
  },

  async getUserPrizes(userId: number) {
    const prizeWinners = await strapi.db.query(PRIZE_WINNER_UID).findMany({
      where: {
        user: userId,
      },
      populate: {
        contest: {
          populate: {
            questions: {
              select: ['id'],
            },
            prizeWinner: {
              select: ['id'],
            },
          },
        },
        participation: true,
      },
      orderBy: [{ awardedAt: 'desc' }],
    });

    return prizeWinners.map(serializePrizeWinner);
  },

  async awardPrize(identifier: unknown) {
    const contest = await this.findContestOrThrow(identifier, {
      prizeWinner: true,
    });

    if (contest.prizeWinner) {
      throw createHttpError(409, 'A prize has already been awarded for this contest.');
    }

    const winningParticipation = await strapi.db.query(PARTICIPATION_UID).findOne({
      where: {
        contest: contest.id,
        status: PARTICIPATION_STATUSES.SUBMITTED,
      },
      populate: ['user'],
      orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }],
    });

    if (!winningParticipation) {
      throw createHttpError(404, 'No submitted participations are available to award.');
    }

    const prizeWinner = await strapi.db.query(PRIZE_WINNER_UID).create({
      data: {
        contest: contest.id,
        participation: winningParticipation.id,
        user: winningParticipation.user.id,
        prizeInfoSnapshot: contest.prizeInfo || 'Prize awarded',
        awardedAt: new Date().toISOString(),
      },
      populate: {
        contest: {
          populate: {
            questions: {
              select: ['id'],
            },
          },
        },
        participation: true,
      },
    });

    return serializePrizeWinner(prizeWinner);
  },
}));
