export default (plugin: any) => {
  const userSchema = plugin.contentTypes.user?.schema;

  if (!userSchema?.attributes) {
    return plugin;
  }

  userSchema.attributes.userType = {
    type: 'enumeration',
    enum: ['NORMAL', 'VIP'],
    default: 'NORMAL',
    required: true,
  };

  userSchema.attributes.participations = {
    type: 'relation',
    relation: 'oneToMany',
    target: 'api::participation.participation',
    mappedBy: 'user',
  };

  userSchema.attributes.prizeWinnings = {
    type: 'relation',
    relation: 'oneToMany',
    target: 'api::prize-winner.prize-winner',
    mappedBy: 'user',
  };

  return plugin;
};
