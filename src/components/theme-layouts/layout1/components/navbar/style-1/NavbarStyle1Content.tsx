import FuseScrollbars from '@fuse/core/FuseScrollbars';
import { styled } from '@mui/material/styles';
import clsx from 'clsx';
import { memo, useState, useEffect } from 'react';
import Navigation from 'src/components/theme-layouts/components/navigation/Navigation';
import UserMenu from 'src/components/theme-layouts/components/UserMenu';
import Logo from '../../../../components/Logo';
import useUser from '@auth/useUser';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import useNavigationItems from 'src/components/theme-layouts/components/navigation/hooks/useNavigationItems';

const Root = styled('div')(({ theme }) => ({
	backgroundColor: theme.vars.palette.background.default,
	color: theme.vars.palette.text.primary,
	'& ::-webkit-scrollbar-thumb': {
		boxShadow: `inset 0 0 0 20px ${'rgba(255, 255, 255, 0.24)'}`,
		...theme.applyStyles('light', {
			boxShadow: `inset 0 0 0 20px ${'rgba(0, 0, 0, 0.24)'}`
		})
	},
	'& ::-webkit-scrollbar-thumb:active': {
		boxShadow: `inset 0 0 0 20px ${'rgba(255, 255, 255, 0.37)'}`,
		...theme.applyStyles('light', {
			boxShadow: `inset 0 0 0 20px ${'rgba(0, 0, 0, 0.37)'}`
		})
	}
}));

const StyledContent = styled(FuseScrollbars)(() => ({
	overscrollBehavior: 'contain',
	overflowX: 'hidden',
	overflowY: 'auto',
	WebkitOverflowScrolling: 'touch',
	backgroundRepeat: 'no-repeat',
	backgroundSize: '100% 40px, 100% 10px',
	backgroundAttachment: 'local, scroll'
}));

type NavbarStyle1ContentProps = {
	className?: string;
};

/**
 * The navbar style 1 content.
 */
function NavbarStyle1Content(props: NavbarStyle1ContentProps) {
	const { className = '' } = props;
	const { data: user } = useUser();
	const { data: navigationData } = useNavigationItems();

	const role = Array.isArray(user?.role) ? user.role[0] : user?.role;
	const isSupervisor = role === 'supervisor';

	// Read the selected view mode from local storage (set by SelectProjectPage)
	const viewMode = localStorage.getItem('navbarViewMode') || 'construction';

	// Determine which nav items to show based on mode
	const filteredNavigation = navigationData.filter(item => {
		// Only apply filtering to supervisors (since others only see what they have access to)
		if (!isSupervisor) return true;

		if (viewMode === 'ssdc') {
			// SSDC mode shows SSDC Operations and Management
			return ['ssdc-operations-group', 'management-group'].includes(item.id);
		} else {
			// Construction mode shows everything else except SSDC Operations
			return item.id !== 'ssdc-operations-group';
		}
	});

	return (
		<Root className={clsx('flex h-full flex-auto flex-col overflow-hidden', className)}>
			<div className="flex h-12 shrink-0 flex-row items-center px-5 md:h-16">
				<Logo />
			</div>

			<StyledContent
				className="flex min-h-0 flex-1 flex-col"
				option={{ suppressScrollX: true, wheelPropagation: false }}
			>
				<Navigation layout="vertical" navigation={filteredNavigation} />
			</StyledContent>

			<div className="flex flex-col gap-3 p-3">
				{/* Role badge */}
				{user && (
					<div
						className="flex items-center gap-2 px-3 py-2 rounded-xl w-full"
						style={{
							background: isSupervisor
								? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))'
								: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))',
							border: isSupervisor ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(59,130,246,0.3)',
						}}
					>
						{isSupervisor
							? <SupervisorAccountIcon sx={{ fontSize: 18, color: '#a855f7' }} />
							: <PersonIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
						}
						<div className="flex flex-col leading-tight">
							<span
								className="text-xs font-bold capitalize tracking-wide"
								style={{ color: isSupervisor ? '#a855f7' : '#3b82f6' }}
							>
								{role ?? 'member'}
							</span>
							<span className="text-[10px] opacity-60" style={{ color: isSupervisor ? '#a855f7' : '#3b82f6' }}>
								{isSupervisor ? 'Full access' : 'View only (building)'}
							</span>
						</div>
					</div>
				)}

				<UserMenu className="w-full" />
			</div>
		</Root>
	);
}

export default memo(NavbarStyle1Content);

