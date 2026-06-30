import type { Core } from '@strapi/strapi';
import { CONTEST_ACCESS_LEVELS, QUESTION_TYPES, USER_TYPES } from '../utils/contest';

const ROLE_UID = 'plugin::users-permissions.role';
const PERMISSION_UID = 'plugin::users-permissions.permission';
const USER_UID = 'plugin::users-permissions.user';
const CONTEST_UID = 'api::contest.contest';
const QUESTION_UID = 'api::question.question';
const OPTION_UID = 'api::option.option';

const ensureRole = async (
  strapi: Core.Strapi,
  type: string,
  name: string,
  description: string
) => {
  const existingRole = await strapi.db.query(ROLE_UID).findOne({ where: { type } });

  if (existingRole) {
    return existingRole;
  }

  return strapi.db.query(ROLE_UID).create({
    data: {
      type,
      name,
      description,
    },
  });
};

const ensurePermission = async (strapi: Core.Strapi, roleId: number, action: string) => {
  const existingPermission = await strapi.db.query(PERMISSION_UID).findOne({
    where: {
      action,
      role: roleId,
    },
  });

  if (existingPermission) {
    return existingPermission;
  }

  return strapi.db.query(PERMISSION_UID).create({
    data: {
      action,
      role: roleId,
    },
  });
};

const ensureRolePermissions = async (
  strapi: Core.Strapi,
  roleType: string,
  actions: string[]
) => {
  const role = await strapi.db.query(ROLE_UID).findOne({ where: { type: roleType } });

  if (!role) {
    return;
  }

  for (const action of actions) {
    await ensurePermission(strapi, role.id, action);
  }
};

const ensureApiUser = async (
  strapi: Core.Strapi,
  {
    email,
    password,
    username,
    roleId,
    userType,
  }: {
    email: string;
    password: string;
    username: string;
    roleId: number;
    userType: string;
  }
) => {
  const normalizedEmail = email.toLowerCase();
  const userService = strapi.plugin('users-permissions').service('user');
  const existingUser = await strapi.db.query(USER_UID).findOne({
    where: { email: normalizedEmail },
    populate: ['role'],
  });

  if (!existingUser) {
    return userService.add({
      email: normalizedEmail,
      password,
      username,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: roleId,
      userType,
    });
  }

  const patch: Record<string, unknown> = {
    username,
    confirmed: true,
    blocked: false,
    role: roleId,
    userType,
  };

  return userService.edit(existingUser.id, patch);
};

const createContestWithQuestions = async (
  strapi: Core.Strapi,
  {
    title,
    description,
    accessLevel,
    prizeInfo,
    startTime,
    endTime,
    questions,
  }: any
) => {
  const existingContest = await strapi.db.query(CONTEST_UID).findOne({
    where: { title },
  });

  if (existingContest) {
    return existingContest;
  }

  const contest = await strapi.db.query(CONTEST_UID).create({
    data: {
      title,
      description,
      accessLevel,
      prizeInfo,
      isActive: true,
      startTime,
      endTime,
    },
  });

  for (const questionInput of questions) {
    const question = await strapi.db.query(QUESTION_UID).create({
      data: {
        contest: contest.id,
        text: questionInput.text,
        questionType: questionInput.questionType,
        points: questionInput.points ?? 1,
      },
    });

    for (const optionInput of questionInput.options) {
      await strapi.db.query(OPTION_UID).create({
        data: {
          question: question.id,
          text: optionInput.text,
          isCorrect: optionInput.isCorrect,
        },
      });
    }
  }

  strapi.log.info(`Seeded contest: ${title}`);

  return contest;
};

const seedSampleData = async (strapi: Core.Strapi) => {
  if (process.env.SEED_SAMPLE_DATA === 'false') {
    return;
  }

  const publicRole = await ensureRole(strapi, 'public', 'Public', 'Default public role');
  const authenticatedRole = await ensureRole(
    strapi,
    'authenticated',
    'Authenticated',
    'Default authenticated role'
  );
  const contestAdminRole = await ensureRole(
    strapi,
    'contest-admin',
    'Contest Admin',
    'Can manage contest-specific API actions'
  );

  await ensureApiUser(strapi, {
    email: process.env.SEED_NORMAL_USER_EMAIL || 'normal@example.com',
    password: process.env.SEED_NORMAL_USER_PASSWORD || 'Password123!',
    username: 'normal-user',
    roleId: authenticatedRole.id,
    userType: USER_TYPES.NORMAL,
  });

  await ensureApiUser(strapi, {
    email: process.env.SEED_VIP_USER_EMAIL || 'vip@example.com',
    password: process.env.SEED_VIP_USER_PASSWORD || 'Password123!',
    username: 'vip-user',
    roleId: authenticatedRole.id,
    userType: USER_TYPES.VIP,
  });

  await ensureApiUser(strapi, {
    email: process.env.SEED_CONTEST_ADMIN_EMAIL || 'contestadmin@example.com',
    password: process.env.SEED_CONTEST_ADMIN_PASSWORD || 'Password123!',
    username: 'contest-admin',
    roleId: contestAdminRole.id,
    userType: USER_TYPES.VIP,
  });

  const now = new Date();
  const startTime = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await createContestWithQuestions(strapi, {
    title: 'Normal Knowledge Challenge',
    description: 'A starter contest available to every authenticated normal user.',
    accessLevel: CONTEST_ACCESS_LEVELS.NORMAL,
    prizeInfo: '$100 gift card',
    startTime,
    endTime,
    questions: [
      {
        text: 'Which runtime does Strapi use on the backend?',
        questionType: QUESTION_TYPES.SINGLE_SELECT,
        points: 2,
        options: [
          { text: 'Node.js', isCorrect: true },
          { text: 'Deno', isCorrect: false },
          { text: 'Bun', isCorrect: false },
        ],
      },
      {
        text: 'Select every HTTP verb that is commonly used for REST writes.',
        questionType: QUESTION_TYPES.MULTI_SELECT,
        points: 3,
        options: [
          { text: 'POST', isCorrect: true },
          { text: 'PUT', isCorrect: true },
          { text: 'PATCH', isCorrect: true },
          { text: 'GET', isCorrect: false },
        ],
      },
      {
        text: 'PostgreSQL is a relational database.',
        questionType: QUESTION_TYPES.TRUE_FALSE,
        points: 1,
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
      },
    ],
  });

  await createContestWithQuestions(strapi, {
    title: 'VIP Architecture Challenge',
    description: 'A deeper contest reserved for VIP participants.',
    accessLevel: CONTEST_ACCESS_LEVELS.VIP,
    prizeInfo: 'Premium mentorship session',
    startTime,
    endTime,
    questions: [
      {
        text: 'Which two qualities matter most in horizontally scalable rate limiting?',
        questionType: QUESTION_TYPES.MULTI_SELECT,
        points: 3,
        options: [
          { text: 'Shared state across instances', isCorrect: true },
          { text: 'Stateless enforcement nodes', isCorrect: true },
          { text: 'Large image optimization', isCorrect: false },
          { text: 'Inline CSS compilation', isCorrect: false },
        ],
      },
      {
        text: 'A one-to-many relation can link one contest to multiple questions.',
        questionType: QUESTION_TYPES.TRUE_FALSE,
        points: 1,
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
      },
    ],
  });

  await ensureRolePermissions(strapi, publicRole.type, [
    'api::contest.contest.find',
    'api::contest.contest.findOne',
    'api::contest.contest.leaderboard',
  ]);

  await ensureRolePermissions(strapi, authenticatedRole.type, [
    'api::session.session.logout',
    'api::contest.contest.find',
    'api::contest.contest.findOne',
    'api::contest.contest.leaderboard',
    'api::contest.contest.join',
    'api::contest.contest.submit',
    'api::contest.contest.myHistory',
    'api::contest.contest.myInProgress',
    'api::contest.contest.myPrizes',
  ]);

  await ensureRolePermissions(strapi, contestAdminRole.type, [
    'api::session.session.logout',
    'api::contest.contest.find',
    'api::contest.contest.findOne',
    'api::contest.contest.leaderboard',
    'api::contest.contest.join',
    'api::contest.contest.submit',
    'api::contest.contest.myHistory',
    'api::contest.contest.myInProgress',
    'api::contest.contest.myPrizes',
    'api::contest.contest.awardPrize',
  ]);
};

export const initializeContestSystem = async (strapi: Core.Strapi) => {
  await seedSampleData(strapi);
};
