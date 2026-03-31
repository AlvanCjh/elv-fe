'use client';
import FuseNavigation from '@fuse/core/FuseNavigation';
import clsx from 'clsx';
import { useMemo } from 'react';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { FuseNavigationProps } from '@fuse/core/FuseNavigation/FuseNavigation';
import useNavigationItems from './hooks/useNavigationItems';
import { useNavbarContext } from '../navbar/contexts/NavbarContext/useNavbarContext';
/**
 * Navigation
 */

type NavigationProps = Partial<FuseNavigationProps>;

function Navigation(props: NavigationProps) {
	const { className = '', layout = 'vertical', dense, active, navigation: customNavigation } = props;
	const { data: defaultNavigation } = useNavigationItems();
	const { closeMobileNavbar } = useNavbarContext();
	const navigation = customNavigation || defaultNavigation;

	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

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
