export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}