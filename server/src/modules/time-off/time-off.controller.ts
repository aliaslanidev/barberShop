import type { Request, Response } from "express";
import * as timeOffService from "@/modules/time-off/time-off.service";
import {
  createTimeOffSchema,
  leaveRequestStatusQuerySchema,
} from "@/modules/time-off/time-off.schema";

export async function listOwnTimeOffHandler(req: Request, res: Response) {
  const result = await timeOffService.listOwnTimeOff(req.user!.userId);
  res.json(result);
}

export async function createOwnTimeOffHandler(req: Request, res: Response) {
  const input = createTimeOffSchema.parse(req.body);
  const result = await timeOffService.createOwnTimeOff(req.user!.userId, input);
  res.status(201).json(result);
}

export async function deleteOwnTimeOffHandler(req: Request, res: Response) {
  await timeOffService.deleteOwnTimeOff(req.user!.userId, req.params.id);
  res.status(204).send();
}

export async function cancelOwnLeaveRequestHandler(req: Request, res: Response) {
  await timeOffService.cancelOwnLeaveRequest(req.user!.userId, req.params.id);
  res.status(204).send();
}

export async function listAllTimeOffHandler(_req: Request, res: Response) {
  const entries = await timeOffService.listAllTimeOff();
  res.json(entries);
}

export async function listLeaveRequestsHandler(req: Request, res: Response) {
  const query = leaveRequestStatusQuerySchema.parse(req.query);
  const requests = await timeOffService.listLeaveRequests(query);
  res.json(requests);
}

export async function approveLeaveRequestHandler(req: Request, res: Response) {
  const updated = await timeOffService.approveLeaveRequest(req.params.id, req.user!.userId);
  res.json(updated);
}

export async function rejectLeaveRequestHandler(req: Request, res: Response) {
  const updated = await timeOffService.rejectLeaveRequest(req.params.id, req.user!.userId);
  res.json(updated);
}