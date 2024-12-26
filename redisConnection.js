const { createClient } = require('redis');

const redisClient = createClient();

async function redisConnect() {
  try {
    await redisClient.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
};

process.on("exit", function(){
    redisClient.quit();
});

module.exports = { redisConnect, redisClient };