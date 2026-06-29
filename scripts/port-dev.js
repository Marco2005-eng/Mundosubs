#!/usr/bin/env node
"use strict";

const { spawn, execSync } = require('child_process');
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

function killPortProcess(port) {
  try {
    if (process.platform === 'win32') {
      // Obtener el PID que usa el puerto
      const result = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      const lines = result.trim().split('\n');
      const pids = new Set();
      for (const line of lines) {
        // Solo líneas LISTENING
        if (!line.includes('LISTENING')) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`✓ Proceso liberado en puerto ${port} (PID ${pid})`);
      }
    } else {
      // macOS / Linux
      execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`✓ Proceso liberado en puerto ${port}`);
    }
  } catch {
    // Si falla, ignorar — el puerto ya puede estar libre
  }
}

async function main() {
  const available = await isPortAvailable(startPort);

  if (!available) {
    console.log(`⚠ Puerto ${startPort} ocupado. Liberando...`);
    killPortProcess(startPort);

    // Esperar un momento para que el SO libere el puerto
    await new Promise((r) => setTimeout(r, 1000));

    const nowAvailable = await isPortAvailable(startPort);
    if (!nowAvailable) {
      console.error(`✗ No se pudo liberar el puerto ${startPort}. Abortando.`);
      process.exit(1);
    }
  }

  console.log(`▲ Iniciando Next.js en http://localhost:${startPort}`);

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

  const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(startPort)], {
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
