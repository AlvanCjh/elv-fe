import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import JwtSignInForm from '@auth/services/jwt/components/JwtSignInForm';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router';
import AuthPagesMessageSection from '../ui/AuthPagesMessageSection';

function MemberSignInPageView() {
    const navigate = useNavigate();
    return (
        <div className="flex min-w-0 flex-auto flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
            <Paper className="h-full w-full px-4 py-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none ltr:border-r-1 rtl:border-l-1">
                <div className="mx-auto flex w-full max-w-80 flex-col gap-6 sm:mx-0 sm:w-80">
                    {/* Back button */}
                    <div className="flex items-center gap-2">
                        <IconButton size="small" onClick={() => navigate('/sign-in')} className="text-gray-400">
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <span className="text-sm text-gray-400">Back to role selection</span>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30">
                                <PersonIcon className="text-blue-500" fontSize="small" />
                            </div>
                            <div>
                                <Typography variant="h5" className="font-bold">Member Login</Typography>
                                <Typography variant="caption" className="text-gray-400">Sign in to your member account</Typography>
                            </div>
                        </div>
                    </div>

                    <JwtSignInForm />
                </div>
            </Paper>
            <AuthPagesMessageSection />
        </div>
    );
}

export default MemberSignInPageView;
