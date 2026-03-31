import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number | null;
    content: string;
    is_read: boolean;
    created_at: string;
    sender: {
        id: number;
        name: string;
        photoURL?: string | null;
    };
}

export interface ChatUser {
    id: number;
    name: string;
    photoURL?: string | null;
    last_seen_at: string | null;
    is_online: boolean;
}

export const useChatMessages = (receiverId?: number | null) => {
    return useQuery<ChatMessage[]>({
        queryKey: ['chat-messages', receiverId],
        queryFn: async () => {
            const params: Record<string, any> = {};
            if (receiverId) params.receiver_id = receiverId;
            return api.get('messages', { searchParams: params }).json();
        },
        refetchInterval: 3000, // Near real-time polling every 3 seconds
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { content: string; receiver_id?: number | null }) => {
            return api.post('messages', { json: payload }).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.receiver_id] });
        }
    });
};

export const useChatUsers = () => {
    return useQuery<ChatUser[]>({
        queryKey: ['chat-users'],
        queryFn: async () => {
            return api.get('chat/users').json();
        },
        refetchInterval: 10000, // Refresh user list/status every 10 seconds
    });
};
