export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

// Extend Express Request typings (populated once auth is implemented)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
