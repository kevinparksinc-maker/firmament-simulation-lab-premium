import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function listenOnPort(server: ReturnType<typeof createServer>, port: number, maxRetries = 5, retryDelay = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const tryListen = () => {
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE" && retries < maxRetries) {
          retries++;
          console.warn(`Port ${port} in use, retrying (${retries}/${maxRetries}) in ${retryDelay}ms...`);
          setTimeout(tryListen, retryDelay);
        } else {
          reject(err);
        }
      });
      server.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${port}/`);
        resolve();
      });
    };
    tryListen();
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  await listenOnPort(server, port);
}

startServer().catch(console.error);
