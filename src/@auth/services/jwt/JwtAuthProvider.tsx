import { useState, useEffect, useCallback, useMemo, useImperativeHandle, useRef } from 'react';
import { FuseAuthProviderComponentProps, FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import useLocalStorage from '@fuse/hooks/useLocalStorage';
import { User } from '../../user';
import _ from 'lodash';
import { removeGlobalHeaders, setGlobalHeaders } from '@/utils/api';
import { isTokenValid } from './utils/jwtUtils';
import JwtAuthContext from '@auth/services/jwt/JwtAuthContext';
import { JwtAuthContextType } from '@auth/services/jwt/JwtAuthContext';
import { HTTPError } from 'ky';
import {
	authRefreshToken,
	authSignIn,
	authSignInWithToken,
	authSignUp,
	authUpdateDbUser
} from '@auth/authApi';

export type JwtSignInPayload = {
	email: string;
	password: string;
};

export type JwtSignUpPayload = {
	name: string;
	email: string;
	password: string;
	password_confirmation: string;
};

function JwtAuthProvider(props: FuseAuthProviderComponentProps) {
	const { ref, children, onAuthStateChanged } = props;

	const {
		value: tokenStorageValue,
		setValue: setTokenStorageValue,
		removeValue: removeTokenStorageValue
	} = useLocalStorage<string>('jwt_access_token');

	/**
	 * Fuse Auth Provider State
	 */
	const [authState, setAuthState] = useState<FuseAuthProviderState<User>>({
		authStatus: 'configuring',
		isAuthenticated: false,
		user: null
	});

	useEffect(() => {
		console.log('JwtAuthProvider: authState changed', authState);
	}, [authState]);


	/**
	 * Watch for changes in the auth state
	 * and pass them to the FuseAuthProvider
	 */
	const onAuthStateChangedRef = useRef(onAuthStateChanged);

	useEffect(() => {
		onAuthStateChangedRef.current = onAuthStateChanged;
	}, [onAuthStateChanged]);

	useEffect(() => {
		console.log('JwtAuthProvider: calling onAuthStateChanged');
		if (onAuthStateChangedRef.current) {
			onAuthStateChangedRef.current(authState);
		}
	}, [authState]);


	/**
	 * Attempt to auto login with the stored token
	 */
	useEffect(() => {
		const attemptAutoLogin = async () => {
			const accessToken = tokenStorageValue;

			// If no token exists, immediately set to unauthenticated to remove loader
			if (!accessToken || !isTokenValid(accessToken)) {
				setAuthState((current) => {
					const newState: FuseAuthProviderState<User> = {
						authStatus: 'unauthenticated',
						isAuthenticated: false,
						user: null
					};
					if (_.isEqual(current, newState)) return current;
					return newState;
				});
				return;
			}

			try {
				setGlobalHeaders({ Authorization: `Bearer ${accessToken}` });
				const response = await authSignInWithToken(accessToken);
				const userData = (await response.json()) as User;

				setAuthState((current) => {
					const newState: FuseAuthProviderState<User> = {
						authStatus: 'authenticated',
						isAuthenticated: true,
						user: { ...userData, role: userData.role || ['user'] }
					};
					if (_.isEqual(current, newState)) {
						console.log('JwtAuthProvider: State already up to date, skipping update');
						return current;
					}
					console.log('JwtAuthProvider: Updating state to authenticated');
					return newState;
				});
			} catch (error) {
				console.error('Auto login failed:', error);
				removeTokenStorageValue();
				removeGlobalHeaders(['Authorization']);
				setAuthState((current) => {
					const newState: FuseAuthProviderState<User> = {
						authStatus: 'unauthenticated',
						isAuthenticated: false,
						user: null
					};
					if (_.isEqual(current, newState)) return current;
					return newState;
				});
			}
		};

		if (!authState.isAuthenticated) {
			console.log('JwtAuthProvider: attempting auto login');
			attemptAutoLogin();
		} else {
			console.log('JwtAuthProvider: already authenticated, skipping auto login');
		}
	}, [authState.isAuthenticated, tokenStorageValue, removeTokenStorageValue, setTokenStorageValue]);


	/**
	 * Sign in
	 */
	const signIn: JwtAuthContextType['signIn'] = useCallback(
		async (credentials) => {
			try {
				const data = await authSignIn(credentials);

				const session = {
					user: data.user,
					access_token: data.token
				};

				if (session.access_token) {
					setAuthState({
						authStatus: 'authenticated',
						isAuthenticated: true,
						user: { ...session.user, role: session.user.role || ['user'] }
					});

					setTokenStorageValue(session.access_token);
					setGlobalHeaders({ Authorization: `Bearer ${session.access_token}` });

					return session;
				}

				return null;
			} catch (error) {
				console.error('Sign in failed:', error);
				throw error;
			}
		},
		[setTokenStorageValue]
	);

	/**
	 * Sign up
	 */
	const signUp = useCallback(async (data) => {
		try {
			const responseData = await authSignUp(data);

			// CRITICAL: Map Laravel 'token' to Fuse 'access_token'
			const session = {
				user: responseData.user,
				access_token: responseData.token
			};

			if (!session.access_token) {
				console.error("No token received from Laravel! Check authApi return structure.");
				return;
			}

			setAuthState({
				authStatus: 'authenticated',
				isAuthenticated: true,
				user: { ...session.user, role: session.user.role || ['user'] }
			});

			setTokenStorageValue(session.access_token);
			setGlobalHeaders({ Authorization: `Bearer ${session.access_token}` });

			return session;
		} catch (error) {
			throw error;
		}
	}, [setTokenStorageValue]);

	/**
	 * Sign out
	 */
	const signOut: JwtAuthContextType['signOut'] = useCallback(() => {
		removeTokenStorageValue();      // Deletes the token
		removeGlobalHeaders(['Authorization']); // Clears headers

		setAuthState({
			authStatus: 'unauthenticated',
			isAuthenticated: false,
			user: null
		});

		window.location.href = import.meta.env.BASE_URL + 'sign-in';
	}, [removeTokenStorageValue]);

	/**
	 * Update user
	 */
	const updateUser: JwtAuthContextType['updateUser'] = useCallback(async (_user) => {
		try {
			const response = await authUpdateDbUser(_user);

			if (response.ok) {
				const updatedUser = (await response.clone().json()) as User;
				setAuthState((current) => ({
					...current,
					user: { ...updatedUser, role: updatedUser.role || ['user'] }
				}));
			}

			return response;
		} catch (error) {
			if (error instanceof HTTPError) {
				console.error('Update user failed:', error.response.status);
			}

			throw error;
		}
	}, []);
	
	const setUser = useCallback((_user: User) => {
		setAuthState((current) => ({
			...current,
			user: { ..._user, role: _user.role || ['user'] }
		}));
	}, []);

	/**
	 * Refresh access token
	 */
	const refreshToken: JwtAuthContextType['refreshToken'] = useCallback(async () => {
		try {
			const response = await authRefreshToken();
			return response;
		} catch (error) {
			if (error instanceof HTTPError) {
				console.error('Token refresh failed:', error.response.status);
			}

			throw error;
		}
	}, []);

	/**
	 * Auth Context Value
	 */
	const authContextValue = useMemo(
		() =>
			({
				...authState,
				signIn,
				signUp,
				signOut,
				updateUser,
				setUser,
				refreshToken
			}) as JwtAuthContextType,
		[authState, signIn, signUp, signOut, updateUser, setUser, refreshToken]
	);

	/**
	 * Expose methods to the FuseAuthProvider
	 */
	useImperativeHandle(ref, () => ({
		signOut,
		updateUser
	}));

	/**
	 * Intercept fetch requests to refresh the access token
	 */
	const interceptFetch = useCallback(() => {
		const { fetch: originalFetch } = window;

		window.fetch = async (...args) => {
			const [resource, config] = args;
			try {
				const response = await originalFetch(resource, config);
				const newAccessToken = response.headers.get('New-Access-Token');

				if (newAccessToken) {
					setGlobalHeaders({ Authorization: `Bearer ${newAccessToken}` });
					setTokenStorageValue(newAccessToken);
				}

				if (response.status === 401) {
					signOut();
					console.error('Unauthorized request. User was signed out.');
				}

				return response;
			} catch (error) {
				if (error instanceof HTTPError && error.response.status === 401) {
					signOut();
					console.error('Unauthorized request. User was signed out.');
				}

				throw error;
			}
		};
	}, [setTokenStorageValue, signOut]);

	useEffect(() => {
		if (authState.isAuthenticated) {
			interceptFetch();
		}
	}, [authState.isAuthenticated, interceptFetch]);

	return <JwtAuthContext value={authContextValue}>{children}</JwtAuthContext>;
}

export default JwtAuthProvider;
