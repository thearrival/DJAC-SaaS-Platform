import { createApp } from "../server/_core/index";
import type { Express } from "express";

let cachedApp: Express | null = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  cachedApp(req, res);
}
