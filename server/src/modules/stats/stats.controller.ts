import type { Request, Response } from "express";
import * as statsService from "@/modules/stats/stats.service";

export async function getPublicStatsHandler(_req: Request, res: Response) {
  res.json(await statsService.getPublicStats());
}
