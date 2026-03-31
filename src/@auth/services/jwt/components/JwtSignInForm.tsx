import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import _ from 'lodash';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@fuse/core/Link';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import useJwtAuth from '../useJwtAuth';
import { useNavigate } from 'react-router';

/**
 * Form Validation Schema
 */
const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
	password: z
		.string()
		.min(4, 'Password is too short - must be at least 4 chars.')
		.nonempty('Please enter your password.'),
	remember: z.boolean().optional()
});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
	email: '',
	password: '',
	remember: true
};

type JwtSignInFormProps = {
    restrictedRole?: 'member' | 'supervisor' | 'facilitator';
};

function JwtSignInForm({ restrictedRole }: JwtSignInFormProps) {
	const { signIn, signOut, isAuthenticated } = useJwtAuth();
	const navigate = useNavigate();
    const [globalError, setGlobalError] = useState<string | null>(null);

	const { control, formState, handleSubmit, setValue, setError } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	useEffect(() => {
		if (isAuthenticated) {
			navigate('/select-project');
		}
	}, [isAuthenticated, navigate]);

	function onSubmit(formData: FormType) {
		const { email, password } = formData;
        setGlobalError(null);

		signIn({
			email,
			password
		})
			.then((session) => {
                if (restrictedRole && session?.user) {
                    const userRoles = Array.isArray(session.user.role) 
                        ? session.user.role 
                        : [session.user.role?.toString().toLowerCase()];
                    
                    const hasRequiredRole = userRoles.some(r => r?.toLowerCase() === restrictedRole.toLowerCase() || r?.toLowerCase() === 'admin');

                    if (!hasRequiredRole) {
                        signOut();
                        setGlobalError(`Access Denied: You do not have the ${restrictedRole} privileges required to sign in here.`);
                        return;
                    }
                }
				navigate('/select-project');
			})
			.catch((error) => {
                console.error("Login catch error:", error);
				const errorData = error?.response?.data;

				if (errorData?.message === 'Invalid Credentials' || error?.response?.status === 401) {
					setGlobalError('Invalid email or password. Please try again.');
				} else {
                    setGlobalError(errorData?.message || 'An unexpected error occurred. Please try again later.');
                }
			});
	}

	return (
		<form
			name="loginForm"
			noValidate
			className="flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
            {globalError && (
                <Alert severity="error" className="mb-6 font-medium">
                    {globalError}
                </Alert>
            )}

			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						autoFocus
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Password"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>

			<div className="flex flex-col items-center justify-center sm:flex-row sm:justify-between">
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControl>
							<FormControlLabel
								label="Remember me"
								control={
									<Checkbox
										size="small"
										{...field}
									/>
								}
							/>
						</FormControl>
					)}
				/>

				<Link
					className="text-md font-medium"
					to="/#"
				>
					Forgot password?
				</Link>
			</div>

			<Button
				variant="contained"
				color="secondary"
				className="mt-4 w-full h-12 rounded-lg font-bold uppercase transition-all shadow-md active:scale-95"
				aria-label="Sign in"
				disabled={_.isEmpty(dirtyFields) || !isValid}
				type="submit"
				size="large"
			>
				Sign in
			</Button>
		</form>
	);
}

export default JwtSignInForm;
