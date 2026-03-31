import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    TextField,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Badge,
    Tooltip,
    Tabs,
    Tab,
    Fade,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useUser from '@auth/useUser';
import { useChatMessages, useSendMessage, useChatUsers, ChatMessage, ChatUser } from './chatApi';
import { formatDistanceToNow } from 'date-fns';

const ChatWidget = () => {
    const { data: user } = useUser();
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState(0); // 0: Global, 1: Contacts, 2: Active Chat
    const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: globalMessages = [], isLoading: loadingGlobal } = useChatMessages(null);
    const { data: privateMessages = [], isLoading: loadingPrivate } = useChatMessages(selectedUser?.id);
    const { data: users = [] } = useChatUsers();
    const sendMessage = useSendMessage();

    const activeMessages = tab === 0 ? globalMessages : privateMessages;
    const isLoading = tab === 0 ? loadingGlobal : loadingPrivate;

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeMessages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim()) return;

        const currentMsg = message;
        setMessage('');
        
        await sendMessage.mutateAsync({
            content: currentMsg,
            receiver_id: tab === 0 ? null : selectedUser?.id
        });
    };

    const handleSelectUser = (u: ChatUser) => {
        setSelectedUser(u);
        setTab(2);
    };

    if (!user) return null;

    return (
        <Box className="fixed bottom-6 right-6 z-999 flex flex-col items-end gap-3">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-2"
                    >
                        <Paper 
                            elevation={12} 
                            className="w-[340px] h-[500px] flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
                            sx={{ 
                                boxShadow: theme.palette.mode === 'dark' ? '0 10px 40px -10px rgba(0,0,0,0.5)' : '0 10px 40px -10px rgba(0,0,0,0.15)'
                            }}
                        >
                            {/* Header */}
                            <Box className="bg-indigo-600 dark:bg-indigo-700 p-4 text-white flex items-center justify-between shadow-md">
                                <div className="flex items-center gap-3">
                                    <Avatar src={user?.photoURL || ''} sx={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.2)' }}>
                                        {user?.displayName?.[0] || user?.name?.[0]}
                                    </Avatar>
                                    <div>
                                        <Typography className="text-sm font-bold leading-none">{tab === 2 ? selectedUser?.name : 'Engineer Chat'}</Typography>
                                        <Typography className="text-[10px] opacity-70 mt-0.5 uppercase tracking-wider font-extrabold">
                                            {tab === 0 ? 'General Channel' : tab === 1 ? 'Contacts' : 'Private Message'}
                                        </Typography>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {tab === 2 && (
                                        <IconButton size="small" onClick={() => setTab(1)} sx={{ color: 'white', mr: 0.5 }}>
                                            <FuseSvgIcon size={18}>heroicons-outline:chevron-left</FuseSvgIcon>
                                        </IconButton>
                                    )}
                                    <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                                        <FuseSvgIcon size={18}>heroicons-outline:x-mark</FuseSvgIcon>
                                    </IconButton>
                                </div>
                            </Box>

                            {/* Tabs */}
                            <Box className="border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <Tabs 
                                    value={tab > 1 ? 1 : tab} 
                                    onChange={(_, v) => { setTab(v); if(v === 1) setSelectedUser(null); }} 
                                    variant="fullWidth" 
                                    sx={{ 
                                        minHeight: 40, 
                                        '& .MuiTab-root': { py: 1, minHeight: 40, fontSize: 11, fontWeight: 'black', color: theme.palette.text.secondary },
                                        '& .Mui-selected': { color: theme.palette.primary.main }
                                    }}
                                >
                                    <Tab label="Global" />
                                    <Tab label="Engineers" />
                                </Tabs>
                            </Box>

                            {/* Content */}
                            <Box className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
                                {tab === 1 ? (
                                    /* User List */
                                    <List className="overflow-y-auto flex-1 p-0">
                                        {users.map((u) => (
                                            <ListItem key={u.id} component="div" className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => handleSelectUser(u)}>
                                                <ListItemAvatar>
                                                    <Badge 
                                                        overlap="circular" 
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                                                        variant="dot" 
                                                        color={u.is_online ? 'success' : 'error'}
                                                        sx={{
                                                            '& .MuiBadge-badge': {
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: '50%',
                                                                border: `2px solid ${theme.palette.background.paper}`
                                                            }
                                                        }}
                                                    >
                                                        <Avatar src={u.photoURL || ''}>{u.name[0]}</Avatar>
                                                    </Badge>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={<div className="flex items-center gap-2"><Typography className="text-sm font-black text-slate-700 dark:text-slate-200">{u.name}</Typography> {u.is_online && <Typography className="text-[8px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-1 rounded font-black tracking-tighter shadow-sm">LIVE</Typography>}</div>}
                                                    secondary={<Typography className="text-[10px] text-slate-400">{u.is_online ? 'Online now' : 'Offline'}</Typography>}
                                                />
                                                <FuseSvgIcon size={16} className="text-slate-300 dark:text-slate-600">heroicons-outline:chevron-right</FuseSvgIcon>
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    /* Message List */
                                    <>
                                        <Box ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
                                            {activeMessages.map((msg) => (
                                                <div key={msg.id} className={`flex flex-col ${String(msg.sender_id) === String(user.id) ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        {String(msg.sender_id) !== String(user.id) && (
                                                            <Typography className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{msg.sender.name}</Typography>
                                                        )}
                                                        <Typography className="text-[8px] text-slate-400 dark:text-slate-500">
                                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                                        </Typography>
                                                    </div>
                                                    <div 
                                                        className={`max-w-[85%] p-2.5 rounded-2xl text-xs shadow-sm ${
                                                            String(msg.sender_id) === String(user.id) 
                                                                ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none' 
                                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none font-medium'
                                                        }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                            {isLoading && activeMessages.length === 0 && (
                                                <div className="flex justify-center py-10 opacity-30">
                                                    <CircularProgress size={24} color="inherit" />
                                                </div>
                                            )}
                                        </Box>
                                        
                                        {/* Input Area */}
                                        <Box component="form" onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex items-center gap-2">
                                            <input 
                                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-full px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                                placeholder="Type a message..."
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                            />
                                            <IconButton 
                                                size="small" 
                                                disabled={!message.trim() || sendMessage.isPending}
                                                type="submit"
                                                sx={{ 
                                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                                                    color: 'white',
                                                    '&:hover': { background: '#4338ca' },
                                                    '&.Mui-disabled': { background: theme.palette.mode === 'dark' ? '#1e293b' : '#e2e8f0' }
                                                }}
                                            >
                                                {sendMessage.isPending ? <CircularProgress size={16} color="inherit" /> : <FuseSvgIcon size={18}>heroicons-outline:paper-airplane</FuseSvgIcon>}
                                            </IconButton>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <IconButton 
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        width: 56,
                        height: 56,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                        color: 'white',
                        boxShadow: theme.palette.mode === 'dark' ? '0 8px 16px -4px rgba(0, 0, 0, 0.6)' : '0 8px 16px -4px rgba(79, 70, 229, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
                        },
                    }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <FuseSvgIcon size={24}>heroicons-outline:x-mark</FuseSvgIcon>
                            </motion.div>
                        ) : (
                            <motion.div key="chat" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                <FuseSvgIcon size={24}>heroicons-outline:chat-bubble-left-right</FuseSvgIcon>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </IconButton>
            </motion.div>
        </Box>
    );
};

export default ChatWidget;
