'use client';
import FuseNavigation from '@fuse/core/FuseNavigation';
import { useLocation } from 'react-router';
import clsx from 'clsx';
import { useMemo } from 'react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { FuseNavigationProps } from '@fuse/core/FuseNavigation/FuseNavigation';
import useNavigationItems from './hooks/useNavigationItems';
import { useNavbarContext } from '../navbar/contexts/NavbarContext/useNavbarContext';
import { useProject } from '@/context/ProjectContext';
/**
 * Navigation
 */

type NavigationProps = Partial<FuseNavigationProps>;

function Navigation(props: NavigationProps) {
	const { className = '', layout = 'vertical', dense, active, navigation: customNavigation } = props;
	const { data: defaultNavigation } = useNavigationItems();
	const { closeMobileNavbar } = useNavbarContext();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
    const { pathname } = useLocation();
	const { activeSystem } = useProject();

	const navigation = useMemo(() => {
		const baseNav = customNavigation || defaultNavigation;
        
        // Use ID-based detection instead of custom 'system' property
        // (custom props can be dropped by FuseNavigationHelper processing)
        const ICT_IDS = new Set(['ict-group', 'ict-dashboard', 'ict-create-backup', 'ict-master-form', 'ict-users']);
        const ELV_IDS = new Set(['inventory-group', 'building-group', 'scheduling-group', 'ssdc-operations-group', 'management-group']);
        const BUSINESS_IDS = new Set(['business-group', 'businesses-group']);
        const INVENTORY_IDS = new Set(['inventory-standalone-group']);

        const isIct = activeSystem === 'ict';
        const isBusiness = activeSystem === 'business';
        const isInventory = activeSystem === 'inventory';
        const isElv = activeSystem === 'elv';

		return baseNav.filter((item: any) => {
			const id = item.id;
            const isIctItem = ICT_IDS.has(id) || id?.startsWith('ict-');
            const isElvItem = ELV_IDS.has(id);
            const isBusinessItem = BUSINESS_IDS.has(id) || id?.startsWith('business-');
            const isInventoryItem = INVENTORY_IDS.has(id);
            const isGlobal = !isIctItem && !isElvItem && !isBusinessItem && !isInventoryItem;

			if (isGlobal) return true;
			if (isIct) return isIctItem;
            if (isBusiness) return isBusinessItem;
            if (isInventory) return isInventoryItem;
            if (isElv) return isElvItem;
			return false;
		});
	}, [customNavigation, defaultNavigation, activeSystem, pathname]);

	return useMemo(() => {
		function handleItemClick(item) {
			if (item?.url && isMobile) {
				closeMobileNavbar();
			}
		}

		return (
			<FuseNavigation
				className={clsx('navigation flex-1', className)}
				navigation={navigation}
				layout={layout}
				dense={dense}
				active={active}
				onItemClick={handleItemClick}
				checkPermission
			/>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMobile, navigation, active, className, dense, layout]);
}

export default Navigation;
