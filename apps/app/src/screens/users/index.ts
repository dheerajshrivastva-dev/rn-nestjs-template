/**
 * User Screens Index
 * Export all user-related screens
 */

// List screen
export {UsersListScreen} from './UsersListScreen';

// Create screen
export {CreateUserScreen} from './CreateUserScreen';

// Edit screen
export {EditUserScreen} from './EditUserScreen';

// Core component (takes userId as prop)
export {UserDetailScreen} from './UserDetailScreen';

// Dashboard screen with tabs
export {UserDashboardScreen} from './UserDashboardScreen';

// Route wrappers (extract userId from route params)
export {UserDetailWrapper} from './UserDetailWrapper';
export {AdminDetailWrapper} from './AdminDetailWrapper';
