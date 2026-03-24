import jwtDecode, { JwtPayload } from 'jwt-decode';

export const isTokenValid = (accessToken: string | null) => {
    if (!accessToken) {
        return false;
    }

    return accessToken.length > 0;
	
};
