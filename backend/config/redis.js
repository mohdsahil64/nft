const connectRedis = () => {
  console.log('⚠️  Redis disabled - Using MongoDB for all storage');
  return null;
};

const getRedis = () => null;

module.exports = { connectRedis, getRedis };
