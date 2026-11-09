import * as path from 'path';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'db.sqlite'),
  downloadsPath: process.env.DOWNLOADS_PATH || path.join(__dirname, '..', '..', 'downloads'),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});
