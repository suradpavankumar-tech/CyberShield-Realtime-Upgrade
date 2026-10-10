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

/**
 * Update authenticated user profile.
 *
 * Backend:
 * PUT /api/v1/auth/profile
 */
export async function updateProfile(payload: {
  full_name: string;
}): Promise<User> {
  const response = await api.put<User>(
    "/auth/profile",
    payload,
  );

  return response.data;
}

/**
 * Change authenticated user password.
 *
 * Backend:
 * PUT /api/v1/auth/change-password
 */
export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  const response = await api.put<{ message: string }>(
    "/auth/change-password",
    payload,
  );

  return response.data;
}