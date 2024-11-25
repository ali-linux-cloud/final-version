import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider, SignIn, SignUp, useUser, RedirectToSignIn } from '@clerk/clerk-react';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { getUserData, isAdmin } from './lib/clerk';
import { updateSupabaseSession } from './middleware/supabase-clerk';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  // Update Supabase session when Clerk session changes
  React.useEffect(() => {
    if (isSignedIn) {
      updateSupabaseSession();
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  // Update Supabase session when Clerk session changes
  React.useEffect(() => {
    if (isSignedIn) {
      updateSupabaseSession();
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (!isAdmin(user)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      navigate={(to) => window.location.href = to}
    >
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/sign-in/*"
            element={<SignIn routing="path" path="/sign-in" redirectUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL} />}
          />
          <Route
            path="/sign-up/*"
            element={<SignUp routing="path" path="/sign-up" redirectUrl={import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}