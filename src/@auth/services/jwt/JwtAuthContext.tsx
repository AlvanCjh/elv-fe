import { FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import { User } from '@auth/user';
import { createContext } from 'react';
import { JwtSignInPayload, JwtSignUpPayload } from '@auth/services/jwt/JwtAuthProvider';

export type JwtAuthContextType = FuseAuthProviderState<User> & {
    updateUser: (U: User) => Promise<Response>;
    signIn: (credentials: JwtSignInPayload) => Promise<{ user: User; access_token: string }>;
    signUp: (U: JwtSignUpPayload) => Promise<{ user: User; access_token: string }>;
    signOut: () => void;
    setUser: (U: User) => void;
    refreshToken: () => Promise<string | Response>;
};

const defaultAuthContext: JwtAuthContextType = {
    authStatus: 'configuring',
    isAuthenticated: false,
    user: null,
    updateUser: async () => ({} as Response),
    signIn: async () => ({ user: null, access_token: '' }),
    signUp: async () => ({ user: null, access_token: '' }),
    signOut: () => { },
    setUser: () => {},
    refreshToken: async () => ({} as Response)
};

const JwtAuthContext = createContext<JwtAuthContextType>(defaultAuthContext);

export default JwtAuthContext;