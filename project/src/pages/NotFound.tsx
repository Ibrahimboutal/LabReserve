import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 10 }}>
      <Box>
        <Typography variant="h1" sx={{ fontSize: '8rem', fontWeight: 'bold', color: '#ff5722' }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Oops! Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ textTransform: 'none' }}
        >
          Go Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;