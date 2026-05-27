#!/usr/bin/env node
"use strict";

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const portFromArg = process.argv[2];
const startPort = Number(portFromArg || process.env.PORT || 3000);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(port) {
  for (let candidate = port; candidate < port + 20; candidate += 1) {
    if (await isPortAvailable(candidate)) return candidate;
  }

  throw new Error(`No available port found between ${port} and ${port + 19}`);
}

async function main() {
  const port = await findAvailablePort(startPort);
  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

  if (port !== startPort) {
    console.log(`Port ${startPort} is busy. Starting Next.js on port ${port} instead.`);
  }

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(port)], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: false,
  });

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
