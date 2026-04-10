import Typography from '@mui/material/Typography';

function SignOutPageTitle() {
	return (
		<div className="w-full">
			<img
				className="mx-auto w-12"
				src={`${import.meta.env.BASE_URL}assets/images/logo/logo.svg`}
				alt="logo"
			/>

			<Typography className="mt-8 text-center text-4xl leading-[1.25] font-extrabold tracking-tight">
				You have signed out!
			</Typography>
		</div>
	);
}

export default SignOutPageTitle;
