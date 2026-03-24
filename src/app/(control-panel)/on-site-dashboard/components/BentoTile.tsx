import { Typography, Paper } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import clsx from 'clsx';

export interface BentoTileProps {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBgColor: string;
    statusText?: string;
    statusColorClass?: string;
    onClick: () => void;
    className?: string;
}

export default function BentoTile({
    id,
    title,
    description,
    icon,
    iconColor,
    iconBgColor,
    statusText,
    statusColorClass = 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
    onClick,
    className
}: BentoTileProps) {
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            className={clsx(
                "relative group cursor-pointer overflow-hidden p-6 sm:p-8 rounded-[2rem]",
                "border border-gray-100 dark:border-gray-800",
                "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl",
                "transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-700",
                className
            )}
        >
            <div className="flex flex-col h-full justify-between gap-8">
                {/* Header Row */}
                <div className="flex justify-between items-start w-full">
                    <div className={clsx("p-3 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", iconBgColor)}>
                        <FuseSvgIcon className={iconColor} size={28}>
                            {icon}
                        </FuseSvgIcon>
                    </div>

                    {statusText && (
                        <div className={clsx("px-3 py-1 rounded-full text-[0.7rem] font-bold tracking-wide uppercase transition-colors", statusColorClass)}>
                            {statusText}
                        </div>
                    )}
                </div>

                {/* Content Row */}
                <div className="flex flex-col gap-1.5 mt-auto">
                    <Typography variant="h6" className="font-extrabold text-gray-800 dark:text-gray-100 leading-tight">
                        {title}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                        {description}
                    </Typography>
                </div>

                {/* Footer / Interaction Hint */}
                <div className="flex items-center justify-between w-full mt-2 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                    <Typography variant="overline" className="font-bold tracking-widest text-[#98A2B3] group-hover:text-blue-500 transition-colors">
                        TAP TO OPEN
                    </Typography>
                    <FuseSvgIcon size={16} className="text-[#98A2B3] group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                        heroicons-outline:arrow-right
                    </FuseSvgIcon>
                </div>
            </div>

            {/* Subtle Gradient Glow Effect */}
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-tl from-white/40 to-transparent dark:from-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </Paper>
    );
}
