import { useNavigate } from 'react-router';
import useUser from '@auth/useUser';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import LockIcon from '@mui/icons-material/Lock';
import { useProject, SystemMode } from '@/context/ProjectContext';

/**
 * Workspace Selection Page (Replaced SelectWorkspacePage)
 * Redesigned to match the original Role Selection aesthetics.
 */
function SelectWorkspacePage() {
    const navigate = useNavigate();
    const { data: user } = useUser();
    const { setActiveSystem } = useProject();

    // Re-calculating role safety logic from previous fix
    const roles = Array.isArray(user?.role) 
        ? user.role.map(r => r?.toString().toLowerCase()) 
        : [user?.role?.toString().toLowerCase()];

    const isSupervisor = roles.some(r => r === 'supervisor' || r === 'admin');
    const isICT = roles.some(r => r === 'ict') || isSupervisor;
    const isELV = roles.some(r => r === 'elv' || r === 'member' || r === 'facilitator') || isSupervisor;
    const isBusiness = roles.some(r => r === 'business') || isSupervisor; // Restricted to business role and supervisor
    const isInventory = true; // Standalone inventory system

    const systems = [
        {
            id: 'elv' as SystemMode,
            label: 'ELV System',
            description: 'Manage Construction progress and SSDC operations.',
            icon: <ElectricalServicesIcon sx={{ fontSize: 48 }} />,
            accent: '#3b82f6',
            path: '/select-project',
            enabled: isELV
        },
        {
            id: 'ict' as SystemMode,
            label: 'ICT System',
            description: 'Integrated Information and Communication Technology management.',
            icon: <LaptopMacIcon sx={{ fontSize: 48 }} />,
            accent: '#a855f7',
            path: '/ict-dashboard',
            enabled: isICT
        },
        {
            id: 'business' as SystemMode,
            label: 'Business System',
            description: 'Corporate services and general business administration.',
            icon: <BusinessIcon sx={{ fontSize: 48 }} />,
            accent: '#f59e0b',
            path: '/businesses/dashboard',
            enabled: isBusiness
        },
        {
            id: 'inventory' as SystemMode,
            label: 'Inventory System',
            description: 'Standalone hardware inventory and documentation management.',
            icon: <InventoryIcon sx={{ fontSize: 48 }} />,
            accent: '#10b981',
            path: '/inventory/assets',
            enabled: isInventory
        },
    ];

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            }}
        >
            {/* Header */}
            <div className="flex flex-col items-center mb-14 text-center">
                <div
                    className="flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                    <ElectricalServicesIcon sx={{ fontSize: 42, color: 'white' }} />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tight uppercase">TP Project Management</h1>
                <p className="mt-3 text-slate-400 text-lg font-medium">
                    Welcome back, <span className="text-indigo-400 font-bold">{user?.name || user?.displayName}</span>. Select a system to continue.
                </p>
            </div>

            {/* System Cards */}
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl justify-center">
                {systems.map((system) => (
                    <button
                        key={system.id}
                        disabled={!system.enabled}
                        onClick={() => {
                            setActiveSystem(system.id);
                            navigate(system.path);
                        }}
                        className={`relative flex-1 flex flex-col items-center gap-6 p-10 rounded-3xl border-2 transition-all duration-500 text-center group
                            ${system.enabled 
                                ? `bg-white/5 backdrop-blur-md border-white/10 cursor-pointer hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/30 active:scale-[0.98]` 
                                : `bg-black/40 border-slate-800 cursor-not-allowed opacity-60 grayscale scale-[0.95]`
                            }`}
                        style={{
                            background: system.enabled 
                                ? `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`
                                : `rgba(15, 23, 42, 0.8)`,
                        }}
                    >
                        {!system.enabled && (
                            <div className="absolute top-4 right-4 text-slate-600">
                                <LockIcon fontSize="small" />
                            </div>
                        )}

                        <div
                            className={`flex items-center justify-center w-24 h-24 rounded-2xl shadow-lg transition-all duration-500 
                                ${system.enabled ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}
                            style={{
                                background: `linear-gradient(135deg, ${system.accent}${system.enabled ? '44' : '11'}, ${system.accent}${system.enabled ? '22' : '05'})`,
                                border: `2px solid ${system.accent}${system.enabled ? '66' : '22'}`,
                            }}
                        >
                            <span style={{ color: system.enabled ? system.accent : '#475569' }}>{system.icon}</span>
                        </div>

                        <div>
                            <h2 className={`text-3xl font-black mb-3 uppercase tracking-wider ${system.enabled ? 'text-white' : 'text-slate-600'}`}>
                                {system.label}
                            </h2>
                            <p className={`text-sm leading-relaxed font-medium ${system.enabled ? 'text-slate-400' : 'text-slate-700'}`}>
                                {system.description}
                            </p>
                        </div>

                        <div
                            className={`mt-4 px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300
                                ${system.enabled 
                                    ? 'shadow-lg hover:brightness-110 active:scale-95' 
                                    : 'text-slate-700 border border-slate-800'}`}
                            style={system.enabled ? {
                                background: `linear-gradient(135deg, ${system.accent}, ${system.accent}dd)`,
                                color: 'white',
                                boxShadow: `0 10px 20px ${system.accent}33`
                            } : {}}
                        >
                            {system.enabled ? 'Enter System' : 'Access Restricted'}
                        </div>
                    </button>
                ))}
            </div>

            <p className="mt-16 text-slate-600 text-xs font-bold uppercase tracking-[0.3em] opacity-50">
                © {new Date().getFullYear()} Unified Enterprise Management System
            </p>
        </div>
    );
}

export default SelectWorkspacePage;
