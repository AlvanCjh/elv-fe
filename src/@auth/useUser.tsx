import { useMemo } from 'react';
import { User } from '@auth/user';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import _ from 'lodash';
import setIn from '@/utils/setIn';
import useJwtAuth from './services/jwt/useJwtAuth';

type useUser = {
	data: User | null;
	isGuest: boolean;
	updateUser: (updates: Partial<User>) => Promise<User | undefined>;
	updateUserSettings: (newSettings: User['settings']) => Promise<User['settings'] | undefined>;
	setUser: (U: User) => void;
	signOut: () => void;
};
function useUser(): useUser {
	const { authState, signOut, updateUser } = useAuth();
	const { setUser } = useJwtAuth();
	const user = authState?.user as User;
	const isGuest = useMemo(() => !user?.role || user?.role?.length === 0, [user]);

	/**
	 * Update user
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUser(_data: Partial<User>) {
		const response = await updateUser(_data);

		if (!response.ok) {
			throw new Error('Failed to update user');
		}

		const updatedUser = (await response.json()) as User;

		return updatedUser;
	}

	/**
	 * Update user settings
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUserSettings(newSettings: User['settings']) {
		const newUser = setIn(user, 'settings', newSettings) as User;

		if (_.isEqual(user, newUser)) {
			return undefined;
		}

		const updatedUser = await handleUpdateUser(newUser);

		return updatedUser?.settings;
	}

	/**
	 * Sign out
	 */
	async function handleSignOut() {
		return signOut();
	}

	return {
		data: user,
		isGuest,
		signOut: handleSignOut,
		updateUser: handleUpdateUser,
		updateUserSettings: handleUpdateUserSettings,
		setUser: setUser
	};
}

export default useUser;
