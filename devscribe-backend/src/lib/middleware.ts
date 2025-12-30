import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  token: string;
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const userId = req.headers['x-user-id'] as string;

  if (!auth?.startsWith('Bearer ') || !userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  (req as AuthRequest).token = auth.slice(7);
  (req as AuthRequest).userId = userId;
  next();
}

export function asyncHandler(fn: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    fn(req as AuthRequest, res).catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
  };
}
