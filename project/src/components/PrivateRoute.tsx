import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional prop for role-based access
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  // Show loader while auth state is being resolved
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect unauthenticated users to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users
    return <Navigate to="/" replace />;
  }

  // Render children only after full auth check
  return <>{children}</>;
}