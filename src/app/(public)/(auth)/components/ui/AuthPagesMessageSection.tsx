import AvatarGroup from '@mui/material/AvatarGroup';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

function AuthPagesMessageSection() {
	return (
		<Box
			className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
			sx={{
				backgroundColor: 'primary.dark',
				color: 'primary.contrastText',
				backgroundImage: 'url("assets/auth-bg.jpg")',
				backgroundSize: 'cover',
				backgroundPosition: 'center'
			}}
		>
			<Box
				className="absolute inset-0 z-0 opacity-70"
				sx={{ backgroundColor: 'primary.main' }}
			/>

			<div className="relative z-10 w-full max-w-4xl">
				<div className="text-7xl leading-none font-bold text-gray-100">
					<div>Agate Tower</div>
					<div>Construction & Inventory Tracking</div>
				</div>
				<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
					Manage your construction projects and material inventory with precision.
					Streamline your workflow and keep track of every site detail in real-time.
				</div>
				<div className="mt-8 flex items-center">
					<AvatarGroup
						sx={{
							'& .MuiAvatar-root': {
								borderColor: 'primary.main'
							}
						}}
					>
						<Avatar src="/assets/images/avatars/female-18.jpg" />
						<Avatar src="/assets/images/avatars/female-11.jpg" />
						<Avatar src="/assets/images/avatars/male-09.jpg" />
						<Avatar src="/assets/images/avatars/male-16.jpg" />
					</AvatarGroup>

					<div className="ml-4 font-medium tracking-tight text-gray-400">
						Trusted by top project managers
					</div>
				</div>
			</div>
		</Box>
	);
}

export default AuthPagesMessageSection;
