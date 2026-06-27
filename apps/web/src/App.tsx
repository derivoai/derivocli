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
import { DashboardHome } from './pages/dashboard/Home';
import { Projects } from './pages/dashboard/Projects';
import { Devices } from './pages/dashboard/Devices';
import { ApiKeys } from './pages/dashboard/ApiKeys';
import { Activity } from './pages/dashboard/Activity';
import { Billing } from './pages/dashboard/Billing';
import { Settings } from './pages/dashboard/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Landing />} />
        <Route path="/how-it-works" element={<Landing />} />
        <Route path="/pricing" element={<Landing />} />
        <Route path="/docs" element={<Landing />} />
        <Route path="/blog" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/projects" element={<Projects />} />
        <Route path="/dashboard/devices" element={<Devices />} />
        <Route path="/dashboard/keys" element={<ApiKeys />} />
        <Route path="/dashboard/activity" element={<Activity />} />
        <Route path="/dashboard/billing" element={<Billing />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
