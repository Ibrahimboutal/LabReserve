import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Alert,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const departments = [
  'Chemistry',
  'Physics',
  'Biology',
  'Engineering',
  'Computer Science',
  'Other',
];

export default function Register() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.department) {
      setError('All fields are required');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address'); 
      return;
    }
    if (departments.indexOf(formData.department) === -1) {
      setError('Invalid department');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    


    try {
      await signUp(formData.email, formData.password, formData.department);
      setSuccess('Registration successful! Please check your email to confirm your account.');
      // Don't navigate immediately, let user see the success message
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
          Sign up
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }} data-testid="register-error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, width: '100%' }} data-testid="register-success">
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            data-testid="register-email"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            data-testid="register-password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            data-testid="register-confirm-password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            select
            name="department"
            label="Department"
            id="department"
            value={formData.department}
            onChange={handleChange}
            data-testid="register-department"
          >
            {departments.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              {"Already have an account? Sign in"}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}