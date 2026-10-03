import api from "./api";

import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/auth";

/**
 * Authenticate an existing CyberShield user.
 *
 * Backend:
 * POST /api/v1/auth/login
 */
export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    },
  );

  return response.data;
}

/**
 * Create a new CyberShield user account.
 *
 * Backend:
 * POST /api/v1/auth/register
 */
export async function register(
  payload: RegisterRequest,
): Promise<User> {
  const response = await api.post<User>(
    "/auth/register",
    {
      full_name: payload.full_name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    },
  );

  return response.data;
}

/**
 * Retrieve the currently authenticated user.
 *
 * Backend:
 * GET /api/v1/auth/me
 *
 * The Axios interceptor automatically attaches:
 * Authorization: Bearer <JWT>
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>(
    "/auth/me",
  );

  return response.data;
}