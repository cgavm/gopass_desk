import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { CreateUserInput, UpdateUserInput } from './users.dto';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const users = await this.service.findAll();
      res.json({ data: users });
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
      const user = await this.service.create(req.body as CreateUserInput);
      res.status(201).json(user);
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
      const user = await this.service.findById(req.params.id);
      res.json(user);
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
      const user = await this.service.update(
        req.params.id,
        req.body as UpdateUserInput
      );
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.service.deactivate(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };
}
