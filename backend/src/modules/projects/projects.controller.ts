import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectInput, UpdateProjectInput, AddMemberInput } from './projects.dto';

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const projects = await this.service.findAll(
        req.user!.id,
        req.user!.role
      );
      res.json({ data: projects });
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
      const project = await this.service.create(
        req.user!.id,
        req.body as CreateProjectInput
      );
      res.status(201).json(project);
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
      const project = await this.service.findById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.json(project);
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
      const project = await this.service.update(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as UpdateProjectInput
      );
      res.json(project);
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
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  addMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.addMember(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body as AddMemberInput
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.service.removeMember(
        req.params.id,
        req.params.userId,
        req.user!.id,
        req.user!.role
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.service.getStats(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };
}
