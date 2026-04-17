module.exports = {
  apps: [
    {
      name: 'weather-api',
      script: './backend/dist/index.js',
      cwd: '/var/www/weather-command-center',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '/var/www/weather-command-center/backend/.env',
      error_file: '/var/log/pm2/weather-api-error.log',
      out_file: '/var/log/pm2/weather-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
