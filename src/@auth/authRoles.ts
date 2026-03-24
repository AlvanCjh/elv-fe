/**
 * The authRoles object defines the authorization roles for this application.
 */
const authRoles = {
	/**
	 * supervisor: full access to all features
	 */
	supervisor: ['supervisor'],

	/**
	 * anyStaff: both supervisor and member can access
	 */
	anyStaff: ['supervisor', 'member'],

	/**
	 * onlyGuest role grants access to unauthenticated users only.
	 */
	onlyGuest: []
};

export default authRoles;
