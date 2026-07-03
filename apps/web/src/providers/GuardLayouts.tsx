/**
 * Layout-route adapters that apply the existing auth guards to a group of
 * nested routes via <Outlet/>. Guard logic is unchanged — this only converts
 * the children-based API into router layout routes so the routing tree stays
 * flat and the guards live inside the lazy app chunk (not the landing bundle).
 */
import { Outlet } from 'react-router-dom';
import { ProtectedRoute, PublicAuthGuard, VerifyEmailRouteGuard } from '../components/auth/Guards';

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

export function PublicAuthLayout() {
  return (
    <PublicAuthGuard>
      <Outlet />
    </PublicAuthGuard>
  );
}

export function VerifyEmailLayout() {
  return (
    <VerifyEmailRouteGuard>
      <Outlet />
    </VerifyEmailRouteGuard>
  );
}
