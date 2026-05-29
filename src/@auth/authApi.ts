import { User } from '@auth/user';
import UserModel from '@auth/user/models/UserModel';
import { PartialDeep } from 'type-fest';
import api from '@/utils/api';

const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://127.0.0.1:8000/api';

/**
 * Update user in DB (Legacy/Generic)
 */
export async function authUpdateDbUser(user: PartialDeep<User>): Promise<Response> {
    return api.put(`users/${user.id}`, { json: UserModel(user) });
}

type AuthResponse = {
    user: User;
    token: string;
};

/**
 * Sign in (POST to Laravel)
 */
export async function authSignIn(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return api.post(`login`, { json: credentials }).json();
}

/**
 * Sign up (POST to Laravel)
 */
export async function authSignUp(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}): Promise<AuthResponse> {
    return api.post(`register`, { json: data }).json();
}

/**
 * Sign in with token (GET /api/user via Sanctum)
 */
export async function authSignInWithToken(accessToken: string): Promise<Response> {
    return api.get(`user`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
}

/**
 * Get online users (active in last 5 mins)
 */
export async function authGetOnlineUsers(): Promise<User[]> {
    return api.get(`online-users`).json();
}

/**
 * Update user profile (name/password)
 */
export async function authUpdateProfile(data: { name: string; password?: string }): Promise<{ user: User }> {
    return api.put(`profile/update`, { json: data }).json();
}

/**
 * Upload profile photo
 */
export async function authUploadPhoto(file: File): Promise<{ photoURL: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`profile/upload-photo`, { body: formData }).json();
}

/**
 * User Management APIs (Supervisor only)
 */

export async function authFetchUsers(): Promise<User[]> {
    return api.get(`users`).json();
}

export async function authAddUser(data: { name: string; email: string; password?: string; role: string }): Promise<{ user: User }> {
    return api.post(`users`, { json: data }).json();
}

export async function authUpdateUserStatus(id: string, data: { isBlocked?: boolean; role?: string }): Promise<{ user: User }> {
    return api.put(`users/${id}`, { json: data }).json();
}

export async function authRefreshToken(): Promise<Response> {
    return api.post(`refresh`);
}

// Note: If you already have authSignInWithToken defined for Laravel, 
// make sure you aren't duplicating it.