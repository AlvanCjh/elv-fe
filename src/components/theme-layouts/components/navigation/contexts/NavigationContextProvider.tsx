import { ReactNode, useCallback, useState, useEffect, useMemo } from 'react';
import { FuseFlatNavItemType, FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import navigationConfig from '@/configs/navigationConfig';
import FuseNavItemModel from '@fuse/core/FuseNavigation/models/FuseNavItemModel';
import { PartialDeep } from 'type-fest';
import { NavigationContext } from '@/components/theme-layouts/components/navigation/contexts/NavigationContext';
import { useProject } from '@/context/ProjectContext';

export function NavigationContextProvider({ children }: { children: ReactNode }) {
	const { viewMode, activeSystem } = useProject();

	const filteredNavigationConfig = useMemo(() => {
		// ICT System: show switch-workspace + ICT group + User Management (supervisor only)
		if (activeSystem === 'ict') {
			return navigationConfig.filter(item =>
				['switch-workspace', 'ict-group', 'ict-user-management-group'].includes(item.id)
			);
		}

		// Business System: show switch-workspace + Business group
		if (activeSystem === 'business') {
			return navigationConfig.filter(item =>
				['switch-workspace', 'businesses-group', 'business-user-management-group'].includes(item.id)
			);
		}

		// Inventory System: show switch-workspace + Inventory standalone group
		if (activeSystem === 'inventory') {
			return navigationConfig.filter(item =>
				['switch-workspace', 'inventory-standalone-group'].includes(item.id)
			);
		}

		// ELV System (default): filter by viewMode (construction vs ssdc)
		const elvItems = viewMode === 'ssdc'
			? ['switch-workspace', 'ssdc-operations-group', 'management-group']
			: ['switch-workspace', 'inventory-group', 'building-group', 'scheduling-group', 'management-group'];

		return navigationConfig.filter(item => elvItems.includes(item.id));
	}, [viewMode, activeSystem]);

	const [navigationItems, setNavigationItems] = useState<FuseFlatNavItemType[]>(
		FuseNavigationHelper.flattenNavigation(filteredNavigationConfig)
	);

	useEffect(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(filteredNavigationConfig));
	}, [filteredNavigationConfig]);

	const setNavigation = useCallback((items: FuseNavItemType[]) => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(items));
	}, []);

	const appendNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.appendNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const prependNavigationItem = useCallback(
		(item: FuseNavItemType, parentId?: string | null) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.prependNavItem(navigation, FuseNavItemModel(item), parentId));
		},
		[navigationItems, setNavigation]
	);

	const updateNavigationItem = useCallback(
		(id: string, item: PartialDeep<FuseNavItemType>) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.updateNavItem(navigation, id, item));
		},
		[navigationItems, setNavigation]
	);

	const removeNavigationItem = useCallback(
		(id: string) => {
			const navigation = FuseNavigationHelper.unflattenNavigation(navigationItems);
			setNavigation(FuseNavigationHelper.removeNavItem(navigation, id));
		},
		[navigationItems, setNavigation]
	);

	const resetNavigation = useCallback(() => {
		setNavigationItems(FuseNavigationHelper.flattenNavigation(filteredNavigationConfig));
	}, [filteredNavigationConfig]);

	const getNavigationItemById = useCallback(
		(id: string) => navigationItems.find((item) => item.id === id),
		[navigationItems]
	);

	const value = {
		setNavigation,
		navigationItems,
		appendNavigationItem,
		prependNavigationItem,
		updateNavigationItem,
		removeNavigationItem,
		resetNavigation,
		getNavigationItemById
	};

	return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
