import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user } = useAuth(); // Get user from context
  const navigate = useNavigate();
  const { signIn, resetPassword, resendConfirmation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  
  useEffect(() => {
    if (user) {
      navigate('/dashboard'); // Redirect when user state updates <button class="citation-flag" data-index="2">
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword(resetEmail);
      setResetDialogOpen(false);
      setSuccess('Password reset instructions have been sent to your email');
      setResetEmail('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      await resendConfirmation(resendEmail);
      setResendDialogOpen(false);
      setSuccess('Confirmation email has been resent');
      setResendEmail('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => setResetDialogOpen(true)}
            >
              Forgot password?
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => setResendDialogOpen(true)}
            >
              Resend confirmation
            </Link>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register')}
              sx={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            data-testid="reset-password-email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetPassword}>Send Reset Instructions</Button>
        </DialogActions>
      </Dialog>

      {/* Resend Confirmation Dialog */}
      <Dialog open={resendDialogOpen} onClose={() => setResendDialogOpen(false)}>
        <DialogTitle>Resend Confirmation Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            data-testid="resend-confirmation-email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResendConfirmation}>Resend Confirmation</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
