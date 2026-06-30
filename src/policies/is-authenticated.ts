const policy = (policyContext: any) => {
  return Boolean(policyContext.state.user);
};

export default policy;
