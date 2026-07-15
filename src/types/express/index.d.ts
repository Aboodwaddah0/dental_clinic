export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        full_name: string;
      };
    }
  }
}
