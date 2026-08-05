import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    // Run a fast raw query to check connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "FlowPilot API is healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      database: "CONNECTED",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "FlowPilot API is unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      database: "DISCONNECTED",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
