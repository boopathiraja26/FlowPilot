export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface User {
  id: string;
  name: string;
  email: string;
}
