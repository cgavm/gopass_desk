import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service';
import {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateCommentInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from './tasks.dto';

export class TasksController {
  constructor(private readonly service: TasksService) {}

  findByProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tasks = await this.service.findByProject(
        req.params.id,
        req.user!.id,
        req.user!.role,
        {
          statusId: req.query.status as string | undefined,
          assigneeId: req.query.assignee as string | undefined,
          priority: req.query.priority as string | undefined,
          tag: req.query.tag as string | undefined,
          dueBefore: req.query.dueBefore as string | undefined,
        }
      );
      res.json({ data: tasks });
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const task = await this.service.create(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as CreateTaskInput
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const task = await this.service.findById(
        req.params.taskId,
        req.user!.id,
        req.user!.role
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const task = await this.service.update(
        req.params.taskId,
        req.user!.id,
        req.user!.role,
        req.body as UpdateTaskInput
      );
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  move = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.move(
        req.params.taskId,
        req.user!.id,
        req.user!.role,
        req.body as MoveTaskInput
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.taskId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // Comments
  addComment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const comment = await this.service.addComment(
        req.params.taskId,
        req.user!.id,
        req.body as CreateCommentInput
      );
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  };

  getComments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const comments = await this.service.getComments(req.params.taskId);
      res.json({ data: comments });
    } catch (error) {
      next(error);
    }
  };

  // Subtasks
  addSubtask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subtask = await this.service.addSubtask(
        req.params.taskId,
        req.user!.id,
        req.body as CreateSubtaskInput
      );
      res.status(201).json(subtask);
    } catch (error) {
      next(error);
    }
  };

  updateSubtask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const subtask = await this.service.updateSubtask(
        req.params.taskId,
        req.params.sid,
        req.body as UpdateSubtaskInput
      );
      res.json(subtask);
    } catch (error) {
      next(error);
    }
  };

  deleteSubtask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.deleteSubtask(req.params.taskId, req.params.sid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
