/**
 * The authRoles object defines the authorization roles for this application.
 */
const authRoles = {
	/**
	 * supervisor: full access to all features
	 */
	supervisor: ['supervisor'],

	/**
	 * anyStaff: both supervisor and member can access (ELV side)
	 */
	anyStaff: ['supervisor', 'member'],

	/**
	 * facilitator: both supervisor and facilitator can access (SSDC side)
	 */
	facilitator: ['supervisor', 'facilitator'],

	/**
	 * onlyGuest role grants access to unauthenticated users only.
	 */
	onlyGuest: [],

	/**
	 * business: both supervisor and business can access
	 */
	business: ['supervisor', 'business']
};

export default authRoles;
