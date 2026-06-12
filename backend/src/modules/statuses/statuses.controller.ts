import { Request, Response, NextFunction } from 'express';
import { StatusesService } from './statuses.service';
import { CreateStatusInput, UpdateStatusInput, ReorderStatusesInput } from './statuses.dto';

export class StatusesController {
  constructor(private readonly service: StatusesService) {}

  findByProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const statuses = await this.service.findByProject(req.params.id);
      res.json({ data: statuses });
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
      const status = await this.service.create(
        req.params.id,
        req.body as CreateStatusInput
      );
      res.status(201).json(status);
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
      const status = await this.service.update(
        req.params.id,
        req.params.sid,
        req.body as UpdateStatusInput
      );
      res.json(status);
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
      await this.service.delete(req.params.id, req.params.sid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  reorder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.reorder(
        req.params.id,
        req.body as ReorderStatusesInput
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
