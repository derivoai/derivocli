/**
 * App-routes layout. Provides the UserProfileProvider (and therefore Firebase)
 * ONLY to authenticated/app routes. Marketing routes never mount this, so
 * Firebase is kept entirely out of the landing critical path.
 */
import { Outlet } from 'react-router-dom';
import { UserProfileProvider } from '../hooks/useUserProfile';

export default function AppProviders() {
  return (
    <UserProfileProvider>
      <Outlet />
    </UserProfileProvider>
  );
}
