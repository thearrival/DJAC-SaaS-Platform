import { Router, type Request, type Response } from "express";
import { ENV } from "./env";
import { logger } from "./logger";
import {
  getUnifiedUsers,
  getUserStats,
  getUserDetail,
  toggleUserSuspension,
  updateUserRole,
  deleteUser,
  getRecentActivity,
  getMonthlyRegistrations,
} from "./admin-dashboard-store";

function requireAdminSession(req: Request, res: Response): boolean {
  const sessionCookie = req.cookies?.yalla_admin_session;
  if (!sessionCookie) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function corsHeaders(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", ENV.appUrl || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function createAdminDashboardRouter(): Router {
  const router = Router();

  router.use((req, res, next) => {
    corsHeaders(res);
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  router.use((req, res, next) => {
    if (!requireAdminSession(req, res)) return;
    next();
  });

  router.get("/users", async (req, res) => {
    try {
      const { search, status, role, source, limit, offset } = req.query;
      const result = await getUnifiedUsers({
        search: search as string | undefined,
        status: status as string | undefined,
        role: role as string | undefined,
        source: source as "local" | "oauth" | undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });
      res.json(result);
    } catch (error) {
      logger.error({ error }, "Failed to list users");
      res.status(500).json({ error: "Failed to list users" });
    }
  });

  router.get("/users/stats", async (_req, res) => {
    try {
      const stats = await getUserStats();
      res.json(stats);
    } catch (error) {
      logger.error({ error }, "Failed to get user stats");
      res.status(500).json({ error: "Failed to get user stats" });
    }
  });

  router.get("/users/registrations", async (req, res) => {
    try {
      const months = req.query.months ? Number(req.query.months) : 12;
      const data = await getMonthlyRegistrations(months);
      res.json(data);
    } catch (error) {
      logger.error({ error }, "Failed to get registration data");
      res.status(500).json({ error: "Failed to get registration data" });
    }
  });

  router.get("/users/:id", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (Number.isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const user = await getUserDetail(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      logger.error({ error }, "Failed to get user detail");
      res.status(500).json({ error: "Failed to get user detail" });
    }
  });

  router.post("/users/:id/suspend", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (Number.isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const { suspend } = req.body;
      const success = await toggleUserSuspension(userId, suspend === true);
      if (!success) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ success: true, status: suspend ? "suspended" : "active" });
    } catch (error) {
      logger.error({ error }, "Failed to toggle user suspension");
      res.status(500).json({ error: "Failed to toggle user suspension" });
    }
  });

  router.post("/users/:id/role", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (Number.isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const { role } = req.body;
      if (!role || typeof role !== "string") {
        res.status(400).json({ error: "Role is required" });
        return;
      }
      const success = await updateUserRole(userId, role);
      if (!success) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ success: true, role });
    } catch (error) {
      logger.error({ error }, "Failed to update user role");
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  router.delete("/users/:id", async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (Number.isNaN(userId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      const success = await deleteUser(userId);
      if (!success) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      logger.error({ error }, "Failed to delete user");
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  router.get("/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const events = await getRecentActivity(limit);
      res.json(events);
    } catch (error) {
      logger.error({ error }, "Failed to get recent activity");
      res.status(500).json({ error: "Failed to get recent activity" });
    }
  });

  return router;
}
