// Minimal test: try importing server/_core/index and report errors
import { ENV } from "../server/_core/env";

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    envLoaded: !!ENV,
    isProduction: ENV.isProduction,
    hasDbUrl: !!ENV.databaseUrl,
    hasJwtSecret: !!ENV.cookieSecret,
    node: process.version,
  });
}
