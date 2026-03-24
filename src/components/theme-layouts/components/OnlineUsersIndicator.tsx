import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarGroup, Tooltip, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import { authGetOnlineUsers } from '@auth/authApi';
import { User } from '@auth/user';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const OnlineUsersIndicator = () => {
    const { data: onlineUsers = [] } = useQuery({
        queryKey: ['online-users'],
        queryFn: authGetOnlineUsers,
        refetchInterval: 30000, // Poll every 30 seconds
    });

    if (onlineUsers.length === 0) return null;

    return (
        <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' } }}>
            {onlineUsers.map((user: User) => (
                <Tooltip key={user.id} title={`${(user as any).displayName || (user as any).name} (Online)`}>
                    <StyledBadge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                    >
                        <Avatar 
                            alt={(user as any).name} 
                            src={(user as any).photoURL}
                            sx={{ bgcolor: stringToColor((user as any).name || 'Unknown') }}
                        >
                            {((user as any).name || 'U').charAt(0)}
                        </Avatar>
                    </StyledBadge>
                </Tooltip>
            ))}
        </AvatarGroup>
    );
};

// Simple helper to generate colors for avatars without photos
function stringToColor(string: string) {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

export default OnlineUsersIndicator;
