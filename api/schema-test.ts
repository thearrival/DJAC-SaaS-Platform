// Direct import of config-schema to test without env.ts
import { parsedEnv } from "../server/services/config-schema";

export default async function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    configLoaded: !!parsedEnv,
    nodeEnv: parsedEnv.NODE_ENV,
    hasDbUrl: !!parsedEnv.DATABASE_URL,
    node: process.version,
  });
}
