import { FuseSettingsConfigType } from '@fuse/core/FuseSettings/FuseSettings';
import { FuseAuthUser } from '@fuse/core/FuseAuthProvider/types/FuseAuthUser';
import { PartialDeep } from 'type-fest';

/**
 * The type definition for a user object.
 */
export type User = FuseAuthUser & {
	id: string;
	role: string[] | string | null;
	displayName: string;
	name?: string;
	photoURL?: string;
	email?: string;
	shortcuts?: string[];
	isBlocked?: boolean;
	lastSeenAt?: string;
	settings?: PartialDeep<FuseSettingsConfigType>;
	loginRedirectUrl?: string; // The URL to redirect to after login.
};
