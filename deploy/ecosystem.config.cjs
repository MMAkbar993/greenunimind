// PM2 config — isolated process, does not affect other PM2 apps
// Usage: pm2 start /var/www/greenunimind/deploy/ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'greenunimind-api',
      cwd: '/var/www/greenunimind/backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      error_file: '/var/log/pm2/greenunimind-api-error.log',
      out_file: '/var/log/pm2/greenunimind-api-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
