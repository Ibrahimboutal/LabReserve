import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/login');
        } else if (session?.user) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography>Completing authentication...</Typography>
        </Box>
      </Container>
    );
  }

  return null;
}