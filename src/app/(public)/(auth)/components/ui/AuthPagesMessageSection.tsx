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
					<div>TP Projects</div>
					<div>Management System</div>
				</div>
				<div className="mt-6 text-lg leading-6 tracking-tight text-gray-400">
					Efficiently manage all your operations with precision.
					Streamline your workflow and keep track of every detail in real-time with our versatile system.
				</div>

			</div>
		</Box>
	);
}

export default AuthPagesMessageSection;
