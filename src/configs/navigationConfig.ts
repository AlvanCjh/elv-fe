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
