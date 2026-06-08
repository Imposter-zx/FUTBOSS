#!/usr/bin/env node

const http = require("http");
const https = require("https");

const BASE_URL = process.env.HEALTHCHECK_URL || "http://localhost:3000";
const HEALTHCHECK_TIMEOUT = parseInt(process.env.HEALTHCHECK_TIMEOUT || "10000", 10);
const CHECK_WEB_SOCKET = process.env.CHECK_WS === "true";
const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);

let exitCode = 0;

function httpGet(url, timeout) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

async function checkNextJs() {
  try {
    const endpoints = [
      { path: "/", name: "Main page" },
      { path: "/api/health", name: "Health API", optional: true },
    ];

    for (const endpoint of endpoints) {
      const url = `${BASE_URL}${endpoint.path}`;
      const response = await httpGet(url, HEALTHCHECK_TIMEOUT);

      if (response.statusCode >= 200 && response.statusCode < 500) {
        console.log(`OK: ${endpoint.name} (${url}) returned ${response.statusCode}`);
      } else {
        console.error(`ERROR: ${endpoint.name} (${url}) returned ${response.statusCode}`);
        exitCode = 1;
      }
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error(`ERROR: Connection refused to ${BASE_URL} - Next.js server may not be running`);
    } else {
      console.error(`ERROR: ${error.message}`);
    }
    exitCode = 1;
  }
}

async function checkDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log("SKIP: DATABASE_URL not set, skipping database check");
    return;
  }

  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as check`;
    await prisma.$disconnect();
    console.log(`OK: Database connection successful`);
  } catch (error) {
    console.error(`ERROR: Database check failed - ${error.message}`);
    exitCode = 1;
  }
}

async function checkRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("SKIP: REDIS_URL not set, skipping Redis check");
    return;
  }

  try {
    const Redis = require("ioredis");
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    const pong = await redis.ping();
    if (pong === "PONG") {
      console.log("OK: Redis connection successful");
    }
    await redis.quit();
  } catch (error) {
    console.error(`ERROR: Redis check failed - ${error.message}`);
    exitCode = 1;
  }
}

async function checkWebSocket() {
  if (!CHECK_WEB_SOCKET) {
    console.log("SKIP: WebSocket check disabled");
    return;
  }

  try {
    const WebSocket = require("ws");
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`, {
      timeout: HEALTHCHECK_TIMEOUT,
    });

    await new Promise((resolve, reject) => {
      ws.on("open", () => {
        console.log(`OK: WebSocket connection to port ${WS_PORT} successful`);
        ws.close();
        resolve();
      });
      ws.on("error", (err) => {
        reject(err);
      });
      ws.on("close", resolve);
    });
  } catch (error) {
    console.error(`ERROR: WebSocket check failed - ${error.message}`);
    exitCode = 1;
  }
}

async function checkDisk() {
  const fs = require("fs");
  const path = require("path");

  try {
    const stats = fs.statfsSync("/");
    const availableGB = (stats.bfree * stats.bsize) / (1024 * 1024 * 1024);
    console.log(`OK: Disk space available: ${availableGB.toFixed(2)} GB`);

    if (availableGB < 0.5) {
      console.error(`ERROR: Low disk space (${availableGB.toFixed(2)} GB available)`);
      exitCode = 1;
    }
  } catch (error) {
    console.log(`SKIP: Disk check not available on this platform`);
  }
}

async function main() {
  console.log("========================================");
  console.log("  FUTBOSS Health Check");
  console.log("========================================");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timeout: ${HEALTHCHECK_TIMEOUT}ms`);
  console.log("");

  await checkNextJs();
  await checkDatabase();
  await checkRedis();
  await checkWebSocket();
  await checkDisk();

  console.log("");
  console.log("========================================");
  if (exitCode === 0) {
    console.log("  RESULT: All checks passed");
  } else {
    console.log("  RESULT: Some checks failed");
  }
  console.log("========================================");

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(`FATAL: ${error.message}`);
  process.exit(1);
});
