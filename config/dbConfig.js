require('dotenv').config(); 

const dbConfig = {
  connectionString: process.env.DB_CONNECTION_STRING
};

module.exports = dbConfig;