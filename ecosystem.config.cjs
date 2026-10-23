module.exports = {
  apps: [
    {
      name: "harit",
      script: "dist/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
