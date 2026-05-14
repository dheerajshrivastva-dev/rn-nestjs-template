import { selectUser, useAuthStore } from '../store/authStore';
import { useUnreadCount } from './queries/useNotifications';

export const useAppBarProps = () => {
  const currentUser = useAuthStore(selectUser);
  const { data } = useUnreadCount();

  const profileInitials = currentUser?.name
    ? `${currentUser.name[0]}${currentUser.name.split(' ')[1]?.[0] ?? ''}`
    : '';

  return {
    profileInitials,
    profileImageUrl: currentUser?.profilePicture?.url,
    notificationCount: data || 0,
  };
};
