import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import JwtSignInForm from '@auth/services/jwt/components/JwtSignInForm';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import AuthPagesMessageSection from '../ui/AuthPagesMessageSection';

function MemberSignInPageView() {
    return (
        <div className="flex min-w-0 flex-auto flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
            <Paper className="h-full w-full px-4 py-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none ltr:border-r-1 rtl:border-l-1 border-slate-200">
                <div className="mx-auto flex w-full max-w-80 flex-col gap-6 sm:mx-0 sm:w-80">
                    
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <LockPersonIcon className="text-indigo-600" fontSize="medium" />
                            </div>
                            <div>
                                <Typography variant="h5" className="font-black tracking-tight text-slate-800">Welcome Back</Typography>
                                <Typography variant="caption" className="text-slate-500 font-medium">Log in to access your dashboard</Typography>
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
