import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'inventory-group',
		title: 'Inventory',
		type: 'group',
		icon: 'heroicons-outline:archive',
		auth: ['supervisor', 'member', 'facilitator'],
		children: [
			{
				id: 'material-inventory',
				title: 'Material Inventory',
				type: 'item',
				icon: 'heroicons-outline:cube',
				url: 'inventory/material'
			},
			{
				id: 'tools-inventory',
				title: 'Tools Inventory',
				type: 'item',
				icon: 'heroicons-outline:wrench-screwdriver',
				url: 'inventory/tool'
			}
		]
	},
	{
		id: 'building-group',
		title: 'Building Management',
		type: 'group',
		icon: 'heroicons-outline:building-office',
		auth: ['supervisor', 'member', 'facilitator'],
		children: [
			{
				id: 'on-site-dashboard',
				title: 'On-Site Dashboard',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-list',
				url: 'on-site-dashboard'
			},
			{
				id: 'building-progress',
				title: 'Project Progress',
				type: 'item',
				icon: 'heroicons-outline:map',
				url: 'building-progress'
			},
			{
				id: 'listing-object',
				title: 'Listing Object',
				type: 'item',
				icon: 'heroicons-outline:list-bullet',
				url: 'listing-object'
			},
			{
				id: 'wiring-topology',
				title: 'Wiring Topology',
				type: 'item',
				icon: 'heroicons-outline:share',
				url: 'wiring-topology'
			},
			{
				id: 'bill-of-quantity',
				title: 'Bill of Quantity (BoQ)',
				type: 'item',
				icon: 'heroicons-outline:calculator',
				url: 'bill-of-quantity'
			}
		]
	},
	{
		id: 'scheduling-group',
		title: 'Scheduling',
		type: 'group',
		icon: 'heroicons-outline:calendar',
		auth: ['supervisor', 'member', 'facilitator'],
		children: [
			{
				id: 'schedules',
				title: 'Schedules',
				type: 'item',
				icon: 'heroicons-outline:clock',
				url: 'scheduling'
			}
		]
	},
	{
		id: 'ssdc-operations-group',
		title: 'SSDC Operations',
		type: 'group',
		icon: 'heroicons-outline:command-line',
		auth: ['supervisor', 'member', 'facilitator'],
		children: [
			{
				id: 'facilitator-dashboard',
				title: 'Facilitator Hub',
				type: 'item',
				icon: 'heroicons-outline:squares-2x2',
				url: 'facilitator'
			},
			{
				id: 'reports-management',
				title: 'Reports & Inspection',
				type: 'collapse',
				icon: 'heroicons-outline:shield-exclamation',
				children: [
					{
						id: 'inspection-report',
						title: 'Inspection Report',
						type: 'item',
						icon: 'heroicons-outline:clipboard-document-check',
						url: 'inspection-report'
					},
					{
						id: 'incidence-report',
						title: 'Incident Report',
						type: 'item',
						icon: 'heroicons-outline:exclamation-triangle',
						url: 'incidence-report'
					},
					{
						id: 'service-report',
						title: 'Service Report',
						type: 'item',
						icon: 'heroicons-outline:wrench-screwdriver',
						url: 'service-report'
					},
					{
						id: 'attendance-report',
						title: 'Attendance Report',
						type: 'item',
						icon: 'material-outline:fact_check',
						url: 'attendance-report'
					}
				]
			},
			{
				id: 'maintenance-management',
				title: 'Maintenance',
				type: 'collapse',
				icon: 'heroicons-outline:wrench',
				children: [
					{
						id: 'external-maintenance',
						title: 'External Maintenance',
						type: 'item',
						icon: 'heroicons-outline:wrench-screwdriver',
						url: 'maintenance/external'
					},
					{
						id: 'internal-maintenance',
						title: 'Internal Maintenance',
						type: 'item',
						icon: 'heroicons-outline:cog-8-tooth',
						url: 'maintenance/internal'
					},
					{
						id: 'daily-facility-checklist',
						title: 'Facility Daily Checklist',
						type: 'item',
						icon: 'heroicons-outline:clipboard-document-check',
						url: 'daily-checklist'
					}
				]
			},
			{
				id: 'inventory-management',
				title: 'Inventory & BoQ',
				type: 'collapse',
				icon: 'heroicons-outline:archive-box',
				children: [
					{
						id: 'material-inventory-ssdc',
						title: 'Material Inventory',
						type: 'item',
						icon: 'heroicons-outline:cube',
						url: 'inventory/material'
					},
					{
						id: 'tools-inventory-ssdc',
						title: 'Tools Inventory',
						type: 'item',
						icon: 'heroicons-outline:wrench',
						url: 'inventory/tool'
					},
					{
						id: 'live-boq',
						title: 'Live BoQ',
						type: 'item',
						icon: 'heroicons-outline:presentation-chart-line',
						url: 'bill-of-quantity'
					}
				]
			},
			{
				id: 'ssdc-passwords',
				title: 'SSDC Passwords',
				type: 'item',
				icon: 'heroicons-outline:key',
				url: 'ssdc-passwords'
			},
			{
				id: 'audit-log',
				title: 'Audit Log',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-list',
				url: 'pending-history'
			},
			{
				id: 'safety-dashboard',
				title: 'Safety Dashboard',
				type: 'item',
				icon: 'heroicons-outline:shield-check',
				url: 'safety'
			}
		]
	},
	{
		id: 'management-group',
		title: 'Management',
		type: 'group',
		icon: 'heroicons-outline:cog',
		auth: ['supervisor'],
		children: [
			{
				id: 'user-management',
				title: 'User Management',
				type: 'item',
				icon: 'heroicons-outline:users',
				url: 'management/users'
			}
		]
	}
];

export default navigationConfig;
