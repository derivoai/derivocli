/**
 * Standalone entry for the Firebase email-action handler page.
 *
 * This builds a minimal app containing ONLY the /action experience so it can be
 * deployed to Firebase Hosting (auth.derivo.in/action) without shipping the
 * rest of the dashboard/landing codebase. Any path renders the Action page,
 * which reads Firebase's query params (mode, oobCode, …) to decide what to do.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Action } from './pages/auth/Action';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Action />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
