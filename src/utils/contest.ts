import { createHttpError } from './http';

export const USER_TYPES = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
} as const;

export const CONTEST_ACCESS_LEVELS = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
} as const;

export const QUESTION_TYPES = {
  SINGLE_SELECT: 'SINGLE_SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  TRUE_FALSE: 'TRUE_FALSE',
} as const;

export const PARTICIPATION_STATUSES = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
} as const;

export const normalizeIdentifier = (value: unknown) => String(value ?? '').trim();

export const toPublicId = (entity: any) =>
  normalizeIdentifier(entity?.documentId || entity?.id || '');

export const buildIdentifierWhere = (identifier: unknown) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    throw createHttpError(400, 'A valid resource identifier is required.');
  }

  const numericId = Number(normalizedIdentifier);
  const clauses: Array<Record<string, string | number>> = [{ documentId: normalizedIdentifier }];

  if (Number.isInteger(numericId) && numericId > 0) {
    clauses.push({ id: numericId });
  }

  return clauses.length === 1 ? clauses[0] : { $or: clauses };
};

export const findEntityByIdentifier = (entities: any[] = [], identifier: unknown) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  return entities.find((entity) => {
    const publicId = toPublicId(entity);
    return (
      publicId === normalizedIdentifier || normalizeIdentifier(entity?.id) === normalizedIdentifier
    );
  });
};

export const getUserType = (user: any) =>
  user?.userType === USER_TYPES.VIP ? USER_TYPES.VIP : USER_TYPES.NORMAL;

export const assertContestJoinability = (contest: any, userType: string, now = new Date()) => {
  if (!contest) {
    throw createHttpError(404, 'Contest not found.');
  }

  if (!contest.isActive) {
    throw createHttpError(400, 'This contest is inactive.');
  }

  const nowMs = now.getTime();
  const startMs = new Date(contest.startTime).getTime();
  const endMs = new Date(contest.endTime).getTime();

  if (nowMs < startMs) {
    throw createHttpError(400, 'This contest has not started yet.');
  }

  if (nowMs > endMs) {
    throw createHttpError(400, 'This contest has already ended.');
  }

  if (contest.accessLevel === CONTEST_ACCESS_LEVELS.VIP && userType !== USER_TYPES.VIP) {
    throw createHttpError(403, 'Only VIP users can participate in this contest.');
  }
};

export const assertContestSubmittable = (
  contest: any,
  userType: string,
  now = new Date()
) => {
  if (!contest) {
    throw createHttpError(404, 'Contest not found.');
  }

  if (!contest.isActive) {
    throw createHttpError(400, 'This contest is inactive.');
  }

  const nowMs = now.getTime();
  const startMs = new Date(contest.startTime).getTime();
  const endMs = new Date(contest.endTime).getTime();

  if (nowMs < startMs) {
    throw createHttpError(400, 'This contest has not started yet.');
  }

  if (nowMs > endMs) {
    throw createHttpError(400, 'You cannot submit after the contest end time.');
  }

  if (contest.accessLevel === CONTEST_ACCESS_LEVELS.VIP && userType !== USER_TYPES.VIP) {
    throw createHttpError(403, 'Only VIP users can submit this contest.');
  }
};

export const normalizeAnswerPayload = (answers: unknown) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    throw createHttpError(400, 'At least one answer is required.');
  }

  return answers.map((answer, index) => {
    if (!answer || typeof answer !== 'object') {
      throw createHttpError(400, `Answer at index ${index} is invalid.`);
    }

    const questionIdentifier = normalizeIdentifier((answer as any).questionId);
    const rawSelectedOptionIds = Array.isArray((answer as any).selectedOptionIds)
      ? (answer as any).selectedOptionIds
      : [];
    const selectedOptionIdentifiers = [...new Set(rawSelectedOptionIds.map(normalizeIdentifier))]
      .filter(Boolean);

    if (!questionIdentifier) {
      throw createHttpError(400, `Answer at index ${index} is missing questionId.`);
    }

    if (!selectedOptionIdentifiers.length) {
      throw createHttpError(400, `Answer at index ${index} is missing selectedOptionIds.`);
    }

    return {
      questionIdentifier,
      selectedOptionIdentifiers,
    };
  });
};

export const validateSelectionCount = (questionType: string, selectedCount: number) => {
  if (
    (questionType === QUESTION_TYPES.SINGLE_SELECT || questionType === QUESTION_TYPES.TRUE_FALSE) &&
    selectedCount !== 1
  ) {
    throw createHttpError(
      400,
      `Question type ${questionType} requires exactly one selected option.`
    );
  }
};

export const isExactMatch = (expectedValues: string[], actualValues: string[]) => {
  if (expectedValues.length !== actualValues.length) {
    return false;
  }

  const expected = [...expectedValues].sort();
  const actual = [...actualValues].sort();

  return expected.every((value, index) => value === actual[index]);
};

export const serializeContestSummary = (contest: any) => ({
  id: toPublicId(contest),
  documentId: contest.documentId,
  title: contest.title,
  description: contest.description,
  startTime: contest.startTime,
  endTime: contest.endTime,
  accessLevel: contest.accessLevel,
  prizeInfo: contest.prizeInfo,
  isActive: contest.isActive,
  questionCount: contest.questions?.length ?? 0,
  hasPrizeWinner: Boolean(contest.prizeWinner),
  createdAt: contest.createdAt,
  updatedAt: contest.updatedAt,
});

export const serializeContestDetail = (contest: any) => ({
  ...serializeContestSummary(contest),
  questions: (contest.questions ?? []).map((question: any) => ({
    id: toPublicId(question),
    documentId: question.documentId,
    text: question.text,
    questionType: question.questionType,
    points: question.points,
    options: (question.options ?? []).map((option: any) => ({
      id: toPublicId(option),
      documentId: option.documentId,
      text: option.text,
    })),
  })),
});

export const serializeParticipation = (participation: any) => ({
  id: toPublicId(participation),
  documentId: participation.documentId,
  status: participation.status,
  score: participation.score,
  startedAt: participation.startedAt,
  submittedAt: participation.submittedAt,
});

export const serializeLeaderboardEntry = (participation: any, rank: number) => ({
  rank,
  user: {
    id: toPublicId(participation.user),
    username: participation.user?.username,
    userType: getUserType(participation.user),
  },
  score: participation.score,
  submittedAt: participation.submittedAt,
});

export const serializeHistoryEntry = (participation: any) => ({
  ...serializeParticipation(participation),
  contest: participation.contest ? serializeContestSummary(participation.contest) : null,
  prizeAwarded: Boolean(participation.prizeWinner),
});

export const serializePrizeWinner = (prizeWinner: any) => ({
  id: toPublicId(prizeWinner),
  documentId: prizeWinner.documentId,
  awardedAt: prizeWinner.awardedAt,
  prizeInfo: prizeWinner.prizeInfoSnapshot,
  contest: prizeWinner.contest ? serializeContestSummary(prizeWinner.contest) : null,
  participation: prizeWinner.participation
    ? serializeParticipation(prizeWinner.participation)
    : null,
});
