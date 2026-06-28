/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { CliLogin } from './pages/auth/CliLogin';
import { DashboardHome } from './pages/dashboard/Home';
import { Projects } from './pages/dashboard/Projects';
import { Devices } from './pages/dashboard/Devices';
import { ApiKeys } from './pages/dashboard/ApiKeys';
import { Activity } from './pages/dashboard/Activity';
import { Billing } from './pages/dashboard/Billing';
import { Settings } from './pages/dashboard/Settings';
import { UserProfileProvider } from './hooks/useUserProfile';

import { ProtectedRoute, VerifyEmailRouteGuard, PublicAuthGuard } from './components/auth/Guards';

export default function App() {
  return (
    <UserProfileProvider>
      <Router>
        <Routes>
          {/* Root Landing Route */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Landing />} />
          <Route path="/how-it-works" element={<Landing />} />
          <Route path="/pricing" element={<Landing />} />
          <Route path="/docs" element={<Landing />} />
          <Route path="/blog" element={<Landing />} />

          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicAuthGuard>
                <Login />
              </PublicAuthGuard>
            }
          />
          <Route
            path="/register"
            element={
              <PublicAuthGuard>
                <Register />
              </PublicAuthGuard>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicAuthGuard>
                <ForgotPassword />
              </PublicAuthGuard>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicAuthGuard>
                <ResetPassword />
              </PublicAuthGuard>
            }
          />
          <Route path="/cli-login" element={<CliLogin />} />

          {/* Dedicated Email Verification Guarded Route */}
          <Route
            path="/verify-email"
            element={
              <VerifyEmailRouteGuard>
                <VerifyEmail />
              </VerifyEmailRouteGuard>
            }
          />

          {/* Dashboard & Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/devices"
            element={
              <ProtectedRoute>
                <Devices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/keys"
            element={
              <ProtectedRoute>
                <ApiKeys />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/activity"
            element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Route Aliases */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProfileProvider>
  );
}
