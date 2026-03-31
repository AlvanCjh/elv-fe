import { useNavigate } from 'react-router';
import PersonIcon from '@mui/icons-material/Person';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import EngineeringIcon from '@mui/icons-material/Engineering';

/**
 * Role Selection Page
 * Displayed at /sign-in — lets users choose whether to log in as Member, Supervisor, or Facilitator.
 */
function RoleSelectPageView() {
    const navigate = useNavigate();

    const roles = [
        {
            key: 'member',
            label: 'Member',
            description: 'Access inventory management and view building floor plans & objects.',
            icon: <PersonIcon sx={{ fontSize: 48 }} />,
            accent: '#3b82f6',
            gradient: 'from-blue-600/20 to-blue-800/10',
            border: 'border-blue-500/40 hover:border-blue-400',
            path: '/sign-in/member',
        },
        {
            key: 'supervisor',
            label: 'Supervisor',
            description: 'Full access to inventory, building progress, testing and system updates.',
            icon: <SupervisorAccountIcon sx={{ fontSize: 48 }} />,
            accent: '#a855f7',
            gradient: 'from-purple-600/20 to-purple-800/10',
            border: 'border-purple-500/40 hover:border-purple-400',
            path: '/sign-in/supervisor',
        },
        {
            key: 'facilitator',
            label: 'Facilitator',
            description: 'Access SSDC operations, attendance, maintenance, and reports.',
            icon: <EngineeringIcon sx={{ fontSize: 48 }} />,
            accent: '#f59e0b',
            gradient: 'from-amber-600/20 to-amber-800/10',
            border: 'border-amber-500/40 hover:border-amber-400',
            path: '/sign-in/facilitator',
        },
    ];

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            }}
        >
            {/* Header */}
            <div className="flex flex-col items-center mb-14">
                <div
                    className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                    <ElectricalServicesIcon sx={{ fontSize: 36, color: 'white' }} />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">ELV Project</h1>
                <p className="mt-2 text-slate-400 text-base">Select your role to continue</p>
            </div>

            {/* Role Cards */}
            <div className="flex flex-col sm:flex-row gap-6 w-full max-w-5xl">
                {roles.map((role) => (
                    <button
                        key={role.key}
                        onClick={() => navigate(role.path)}
                        className={`flex-1 flex flex-col items-center gap-5 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left group
                            bg-white/5 backdrop-blur-sm ${role.border}
                            hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99]`}
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`,
                        }}
                    >
                        <div
                            className="flex items-center justify-center w-20 h-20 rounded-2xl shadow-md transition-transform duration-300 group-hover:scale-110"
                            style={{
                                background: `linear-gradient(135deg, ${role.accent}33, ${role.accent}15)`,
                                border: `2px solid ${role.accent}55`,
                            }}
                        >
                            <span style={{ color: role.accent }}>{role.icon}</span>
                        </div>

                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">{role.label}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">{role.description}</p>
                        </div>

                        <div
                            className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                background: `${role.accent}22`,
                                color: role.accent,
                                border: `1px solid ${role.accent}44`,
                            }}
                        >
                            Login as {role.label}
                        </div>
                    </button>
                ))}
            </div>

            <p className="mt-10 text-slate-600 text-xs">
                © {new Date().getFullYear()} ELV Project Management System
            </p>
        </div>
    );
}

export default RoleSelectPageView;
