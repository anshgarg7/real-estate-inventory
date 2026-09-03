import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as projectService from "../services/project.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await projectService.listProjects());
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  res.json(await projectService.getProject(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await projectService.createProject(req.body));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await projectService.updateProject(req.params.id, req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
});
