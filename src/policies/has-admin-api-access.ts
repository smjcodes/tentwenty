const policy = async (policyContext: any, _config: any, { strapi }: any) => {
  if (!policyContext.state.user?.id) {
    return false;
  }

  const user = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: policyContext.state.user.id },
    populate: ['role'],
  });

  return user?.role?.type === 'contest-admin';
};

export default policy as any;
