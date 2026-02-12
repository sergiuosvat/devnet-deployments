module.exports = {
  apps: [
    {
      name: "mx-relayer",
      script: "./dist/index.js",
      cwd: "/home/ubuntu/devnet-deployments/multiversx-openclaw-relayer",
      watch: false,
      node_args: "--env-file=.env",
      env: {
        PORT: 3001,
      },
    },
    {
      name: "mx-mcp-server",
      script: "./dist/index.js",
      args: "http",
      cwd: "/home/ubuntu/devnet-deployments/multiversx-mcp-server",
      watch: false,
      node_args: "--env-file=.env",
      env: {
        HTTP_PORT: 3000,
      },
    },
    {
      name: "x402-facilitator",
      script: "./dist/index.js",
      cwd: "/home/ubuntu/devnet-deployments/x402-facilitator",
      watch: false,
      node_args: "--env-file=.env",
      env: {
        PORT: 4000,
      },
    },
    {
      name: "moltbot",
      script: "./build/src/index.js",
      cwd: "/home/ubuntu/devnet-deployments/moltbot/moltbot-starter-kit",
      watch: false,
      node_args: "--env-file=.env",
      env: {
        PORT: 5000,
      },
    }
  ],
};
