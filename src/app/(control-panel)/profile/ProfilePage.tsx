'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { zodResolver } from '@hookform/resolvers/zod';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import useUser from '@auth/useUser';
import { authUpdateProfile, authUploadPhoto } from '@auth/authApi';
import { enqueueSnackbar } from 'notistack';
import CircularProgress from '@mui/material/CircularProgress';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getCroppedImg } from './utils/cropImage';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	password: z.string().optional().or(z.literal('')),
	confirmPassword: z.string().optional().or(z.literal(''))
}).refine((data) => {
    if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
}).refine((data) => {
    if (data.password && data.password.length > 0) {
        return data.password.length >= 8;
    }
    return true;
}, {
    message: "Must be at least 8 characters",
    path: ["password"]
});

type FormValues = z.infer<typeof schema>;

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
	return centerCrop(
		makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
		mediaWidth,
		mediaHeight
	);
}

function ProfilePage() {
	const { data: user, updateUser, setUser } = useUser();
	const [uploading, setUploading] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // Cropping state
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

	const { control, handleSubmit, reset, formState } = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { name: '', password: '', confirmPassword: '' }
	});
	const { errors } = formState;

	useEffect(() => {
		if (user) reset({ name: user.displayName || '', password: '', confirmPassword: '' });
	}, [user, reset]);

	if (!user) return <FuseLoading />;

	const onSubmit = async (data: FormValues) => {
		try {
			const { user: updated } = await authUpdateProfile({ name: data.name, password: data.password || undefined });
			setUser(updated);
			enqueueSnackbar('Profile updated', { variant: 'success' });
			reset({ ...data, password: '', confirmPassword: '' });
		} catch {
			enqueueSnackbar('Failed to update profile', { variant: 'error' });
		}
	};

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result as string);
                setShowCropper(true);
                setCrop(undefined);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setCrop(centerAspectCrop(naturalWidth, naturalHeight));
    };

    const handleConfirmCrop = async () => {
        if (!imageSrc || !completedCrop || !imgRef.current) return;

        // Scale pixel crop from displayed image size to natural image size
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

        const scaledCrop = {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
        };

        setShowCropper(false);
        setUploading(true);
        try {
            const blob = await getCroppedImg(imageSrc, scaledCrop);
            if (blob) {
                const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                const { photoURL } = await authUploadPhoto(file);
                await updateUser({ ...user, photoURL });
                enqueueSnackbar('Photo updated', { variant: 'success' });
            }
        } catch (e) {
            console.error(e);
            enqueueSnackbar('Failed to upload photo', { variant: 'error' });
        } finally {
            setUploading(false);
            setImageSrc(null);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

	return (
		<div className="h-full w-full overflow-y-auto bg-[#f5f5f7] dark:bg-[#111]">
			<div className="mx-auto max-w-2xl px-16 py-40">

				<Typography variant="h5" className="font-black tracking-tighter mb-24 text-gray-900 dark:text-white">
					Profile Settings
				</Typography>

				{/* Identity Card */}
				<div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/80 dark:border-white/10 mb-16 overflow-hidden shadow-sm">
					<div className="h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90" />

					<div className="px-24 pt-0 pb-24">
						<div className="flex items-end justify-between -mt-24 mb-16">
							<div className="relative group">
								<Avatar src={user.photoURL} sx={{ width: 90, height: 90 }} className="ring-4 ring-white dark:ring-[#1c1c1e] shadow-2xl transition-transform hover:scale-105">
									{user.displayName?.[0]}
								</Avatar>
								<button
									type="button"
									onClick={() => fileRef.current?.click()}
									className="absolute -bottom-4 -right-2 h-[32px] w-[32px] rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all border-2 border-white dark:border-[#1c1c1e] z-10"
									disabled={uploading}
								>
									{uploading
										? <CircularProgress size={12} color="inherit" />
										: <FuseSvgIcon size={14}>lucide:camera</FuseSvgIcon>
									}
								</button>
								<input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} />
							</div>
							<div className="text-right">
								<span className="inline-block px-16 py-6 rounded-full bg-white text-indigo-600 text-[11px] font-black uppercase tracking-widest shadow-xl ring-4 ring-white/20">
									{Array.isArray(user.role) ? user.role[0] : user.role}
								</span>
							</div>
						</div>

						<Typography className="font-black text-xl tracking-tight leading-tight">{user.displayName}</Typography>
						<Typography variant="body2" className="text-gray-400 font-medium mt-1">{user.email}</Typography>
					</div>
				</div>

				{/* Edit Card */}
				<div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden">
					<div className="px-24 py-16 border-b border-gray-100 dark:border-white/10 bg-gray-50/30 dark:bg-white/5">
						<Typography className="font-bold text-xs uppercase tracking-widest text-gray-400">Personal Information</Typography>
					</div>

					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="px-24 py-24 flex flex-col gap-24">
							<div>
								<Typography variant="caption" className="font-bold text-gray-500 dark:text-gray-400 mb-8 block uppercase tracking-tighter">
									Display Name
								</Typography>
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<TextField
											{...field}
											variant="outlined"
											fullWidth
											size="small"
											placeholder="Your name"
											error={!!errors.name}
											helperText={errors.name?.message}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem', backgroundColor: 'rgba(0,0,0,0.01)' } }}
										/>
									)}
								/>
							</div>

							<div>
								<Typography variant="caption" className="font-bold text-gray-500 dark:text-gray-400 mb-8 block uppercase tracking-tighter">
									Email Address
								</Typography>
								<TextField
									value={user.email || ''}
									variant="outlined"
									fullWidth
									size="small"
									disabled
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem', opacity: 0.6 } }}
								/>
							</div>
						</div>

						<div className="px-24 pb-24 border-t border-gray-100 dark:border-white/10 pt-24 flex flex-col gap-24">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-20 gap-y-16 items-start">
								<div>
									<Typography variant="caption" className="font-bold text-gray-500 dark:text-gray-400 mb-8 block uppercase tracking-tighter" style={{ height: '1rem', lineHeight: 1, display: 'block' }}>
										New Password
									</Typography>
									<Controller
										name="password"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												type="password"
												variant="outlined"
												fullWidth
												size="small"
												placeholder="••••••••"
												error={!!errors.password}
												helperText={errors.password?.message}
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem', backgroundColor: 'rgba(0,0,0,0.01)' } }}
											/>
										)}
									/>
								</div>

								<div>
									<Typography variant="caption" className="font-bold text-gray-500 dark:text-gray-400 mb-8 block uppercase tracking-tighter" style={{ height: '1rem', lineHeight: 1, display: 'block' }}>
										Confirm Password
									</Typography>
									<Controller
										name="confirmPassword"
										control={control}
										render={({ field }) => (
											<TextField
												{...field}
												type="password"
												variant="outlined"
												fullWidth
												size="small"
												placeholder="••••••••"
												error={!!errors.confirmPassword}
												helperText={errors.confirmPassword?.message}
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '0.875rem', backgroundColor: 'rgba(0,0,0,0.01)' } }}
											/>
										)}
									/>
								</div>
							</div>
						</div>

						<div className="px-24 py-12 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-end gap-8">
							<Button
								type="button"
								variant="outlined"
								size="small"
								className="normal-case font-bold"
								onClick={() => reset()}
								sx={{ borderRadius: '8px', px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 700, borderColor: 'divider', color: 'text.primary' }}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="contained"
								size="small"
								className="normal-case font-bold"
								sx={{ borderRadius: '8px', px: 2, py: 0.75, fontSize: '0.75rem', fontWeight: 700, background: '#4f46e5', boxShadow: 'none', '&:hover': { background: '#4338ca', boxShadow: 'none' } }}
							>
								Save changes
							</Button>
						</div>
					</form>
				</div>
			</div>

			{/* Free-crop Dialog (phone gallery style) */}
			<Dialog
				open={showCropper}
				onClose={() => setShowCropper(false)}
				maxWidth="sm"
				fullWidth
				PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', m: 2 } }}
			>
				<DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
					Crop Photo
				</DialogTitle>
				<DialogContent sx={{ px: 2, pb: 0, display: 'flex', justifyContent: 'center', background: '#0a0a0a' }}>
					{imageSrc && (
						<ReactCrop
							crop={crop}
							onChange={(c) => setCrop(c)}
							onComplete={(c) => setCompletedCrop(c)}
							ruleOfThirds
							style={{ maxHeight: '70vh', maxWidth: '100%' }}
						>
							<img
								ref={imgRef}
								src={imageSrc}
								alt="Crop preview"
								onLoad={onImageLoad}
								style={{ maxHeight: '70vh', maxWidth: '100%', display: 'block' }}
							/>
						</ReactCrop>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1, background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
					<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', flexGrow: 1, fontSize: '0.7rem' }}>
						Drag corners to resize · Drag inside to move
					</Typography>
					<Button
						onClick={() => { setShowCropper(false); setImageSrc(null); }}
						size="small"
						variant="outlined"
						className="normal-case font-bold rounded-lg"
						sx={{ px: 3, py: 0.75, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmCrop}
						variant="contained"
						size="small"
						disabled={!completedCrop?.width || !completedCrop?.height}
						className="normal-case font-black rounded-lg"
						sx={{ px: 3, py: 0.75, fontSize: '0.75rem', background: '#4f46e5', boxShadow: 'none', '&:hover': { background: '#4338ca', boxShadow: 'none' } }}
					>
						Apply
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default ProfilePage;
