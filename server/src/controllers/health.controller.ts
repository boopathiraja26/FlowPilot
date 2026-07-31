import { Request, Response } from "express";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "FlowPilot API is healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
  });
}
