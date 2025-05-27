import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


export default function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const navigate = useNavigate();




  return (
    <Box
      component="footer"
      sx={{
        bgcolor: (theme) => theme.palette.primary.main,
        color: (theme) => theme.palette.primary.contrastText,
        py: 6,
        mt: 'auto',
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} direction={isMobile ? 'column' : 'row'}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              LabReserve
            </Typography>
            <Typography variant="body2">
              Streamlining laboratory equipment management and reservations for research institutions worldwide.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Facebook">
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link 
                component="button"
                onClick={() => navigate('/about')}
                color="inherit"
                underline="hover"
                sx={{ mb: 1 }}
                >
                  About Us
                </Link>
              </Box>
              {user ? (
                <>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Link 
                      component="button"
                      onClick={() => navigate('/dashboard')}
                      color="inherit"
                      underline="hover"
                      sx={{ mb: 1 }}
                    >
                      Dashboard
                    </Link>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Link 
                      component="button"
                      onClick={() => navigate('/labs')}
                      color="inherit"
                      underline="hover"
                      sx={{ mb: 1 }}
                    >
                      Labs
                    </Link>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Link 
                      component="button"
                      onClick={() => navigate('/equipment')}
                      color="inherit"
                      underline="hover"
                      sx={{ mb: 1 }}
                    >
                      Equipment
                    </Link>
                  </Box>
                </>
              ) : (
                <>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Link 
                      component="button"
                      onClick={() => navigate('/login')}
                      color="inherit"
                      underline="hover"
                      sx={{ mb: 1 }}
                    >
                      Login
                    </Link>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Link 
                      component="button"
                      onClick={() => navigate('/register')}
                      color="inherit"
                      underline="hover"
                      sx={{ mb: 1 }}
                    >
                      Register
                    </Link>
                  </Box>
                </>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" paragraph>
              123 Innovation Way
              <br />
              Dalian, CH 02142
            </Typography>
            <Typography variant="body2" paragraph>
              Email: info@labreserve.com
              <br />
              Phone: (800) 555-LABS
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} LabReserve. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
