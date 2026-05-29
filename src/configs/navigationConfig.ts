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
		id: 'switch-workspace',
		title: 'Switch Workspace',
		type: 'item',
		icon: 'heroicons-outline:squares-plus',
		url: 'select-workspace',
	},
	{
		id: 'inventory-group',
		title: 'Inventory',
		type: 'group',
		icon: 'heroicons-outline:archive',
		auth: ['supervisor', 'member', 'facilitator', 'elv'],
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
		auth: ['supervisor', 'member', 'facilitator', 'elv'],
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
		auth: ['supervisor', 'member', 'facilitator', 'elv'],
		children: [
			{
				id: 'schedules',
				title: 'Schedules',
				type: 'item',
				icon: 'heroicons-outline:clock',
				url: 'scheduling'
			},
			{
				id: 'project-timeline',
				title: 'Project Timeline',
				type: 'item',
				icon: 'heroicons-outline:chart-bar',
				url: 'project-timeline'
			}
		]
	},
	{
		id: 'ssdc-operations-group',
		title: 'SSDC Operations',
		type: 'group',
		icon: 'heroicons-outline:command-line',
		auth: ['supervisor', 'member', 'facilitator', 'elv'],
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
					},
					{
						id: 'pdu-checklist',
						title: 'PDU Checklist',
						type: 'item',
						icon: 'heroicons-outline:clipboard-document-list',
						url: 'pdu-checklist'
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
		id: 'ict-group',
		title: 'ICT Management',
		type: 'group',
		icon: 'heroicons-outline:computer-desktop',
		auth: ['supervisor', 'ict'],
		children: [
			{
				id: 'ict-dashboard',
				title: 'ICT Dashboard',
				type: 'item',
				icon: 'heroicons-outline:squares-2x2',
				url: 'ict-dashboard'
			},
			{
				id: 'ict-create-backup',
				title: 'Create ICT Form',
				type: 'item',
				icon: 'heroicons-outline:plus-circle',
				url: 'ict-dashboard/create'
			},
			{
				id: 'ict-master-form',
				title: 'Masterform Config',
				type: 'item',
				icon: 'heroicons-outline:adjustments-horizontal',
				url: 'ict-dashboard/config'
			}
		]
	},
	{
		// ICT-only group — shown only when activeSystem === 'ict'
		id: 'ict-user-management-group',
		title: 'User Management',
		type: 'group',
		icon: 'heroicons-outline:users',
		auth: ['supervisor'],
		children: [
			{
				id: 'ict-users',
				title: 'ICT User Management',
				type: 'item',
				icon: 'heroicons-outline:user-group',
				url: 'ict-dashboard/users'
			}
		]
	},
	{
		// ELV-only group — shown only when activeSystem === 'elv'
		// 'management-group' id is in Navigation.tsx ELV_IDS set
		id: 'management-group',
		title: 'Management',
		type: 'group',
		icon: 'heroicons-outline:users',
		auth: ['supervisor'],
		children: [
			{
				id: 'elv-user-management',
				title: 'ELV User Management',
				type: 'item',
				icon: 'heroicons-outline:user-group',
				url: 'management/elv-users'
			}
		]
	},
	{
		id: 'inventory-standalone-group',
		title: 'Inventory & Docs',
		type: 'group',
		icon: 'heroicons-outline:archive-box',
		auth: ['supervisor', 'member', 'facilitator', 'elv', 'ict', 'business'],
		children: [
			{
				id: 'standalone-inventory',
				title: 'Company Inventory',
				type: 'collapse',
				icon: 'heroicons-outline:device-tablet',
				children: [
					{
						id: 'inventory-assets',
						title: 'Stock Assets',
						type: 'item',
						icon: 'heroicons-outline:cpu-chip',
						url: 'inventory/assets'
					},
					{
						id: 'inventory-assign',
						title: 'Assign Item',
						type: 'item',
						icon: 'heroicons-outline:user-plus',
						url: 'inventory/assign'
					},
					{
						id: 'inventory-stock-in',
						title: 'Stock In',
						type: 'item',
						icon: 'heroicons-outline:plus-circle',
						url: 'inventory/stock-in'
					},
					{
						id: 'inventory-my-items',
						title: 'My Items',
						type: 'item',
						icon: 'heroicons-outline:user-circle',
						url: 'inventory/my-items'
					},
					{
						id: 'inventory-inspections',
						title: 'Inspection List',
						type: 'item',
						icon: 'heroicons-outline:clipboard-document-check',
						url: 'inventory/inspections'
					}
				]
			},
			{
				id: 'standalone-documentation',
				title: 'Documentation',
				type: 'item',
				icon: 'heroicons-outline:book-open',
				url: 'documentation'
			}
		]
	},
	{
		id: 'businesses-group',
		title: 'Business Management',
		type: 'group',
		icon: 'heroicons-outline:briefcase',
		auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin'],
		children: [
			{
				id: 'business-dashboard',
				title: 'Tender Dashboard',
				type: 'item',
				icon: 'heroicons-outline:chart-bar',
				url: 'businesses/dashboard'
			},
			{
				id: 'business-tenders-group',
				title: 'Tenders',
				type: 'collapse',
				icon: 'heroicons-outline:document-text',
				auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin'],
				children: [
					{
						id: 'business-tenders-list',
						title: 'Tender List',
						type: 'item',
						icon: 'heroicons-outline:document-text',
						url: 'businesses/tenders'
					},
					{
						id: 'business-quotations',
						title: 'Quotations',
						type: 'item',
						icon: 'heroicons-outline:receipt-percent',
						url: 'businesses/quotations'
					}
				]
			},
			{
				id: 'business-master-list',
				title: 'Master List',
				type: 'item',
				icon: 'heroicons-outline:list-bullet',
				url: 'businesses/master-list'
			},
			{
				id: 'business-project-master-list',
				title: 'Project Master List',
				type: 'item',
				icon: 'heroicons-outline:clipboard-document-check',
				url: 'businesses/project-master-list'
			},
			{
				id: 'business-license-tracking',
				title: 'License Tracking',
				type: 'item',
				icon: 'heroicons-outline:shield-check',
				url: 'businesses/license-tracking'
			},
			{
				id: 'business-setup-config',
				title: 'Setup Config',
				type: 'item',
				icon: 'heroicons-outline:cog-8-tooth',
				url: 'businesses/setup-config'
			}
		]
	}
];

export default navigationConfig;
