import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ScienceIcon from '@mui/icons-material/Science';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import SupportIcon from '@mui/icons-material/Support';
import SchoolIcon from '@mui/icons-material/School';
import {
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Box,
  Container,
  Grid
} from '@mui/material';


export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <ScienceIcon sx={{ fontSize: 40 }} />,
      title: 'Advanced Equipment',
      description: 'Access state-of-the-art laboratory equipment for your research needs'
    },
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 40 }} />,
      title: 'Easy Scheduling',
      description: 'Book equipment seamlessly with our intuitive reservation system'
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      title: 'Collaboration',
      description: 'Connect with other researchers and lab managers'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Resource Management',
      description: 'Efficiently manage and track equipment usage'
    }
  ];

  const benefits = [
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Secure Access',
      description: 'Role-based access control ensures equipment safety and proper usage tracking.'
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: 'Real-time Availability',
      description: 'Check equipment availability instantly and make reservations on the go.'
    },
    {
      icon: <SupportIcon fontSize="large" />,
      title: '24/7 Support',
      description: 'Our dedicated support team is always ready to assist you.'
    },
    {
      icon: <SchoolIcon fontSize="large" />,
      title: 'Training Resources',
      description: 'Access comprehensive training materials and documentation.'
    }
  ];

  const testimonials = [
    {
      quote: "LabReserve has transformed how we manage our research equipment. It's intuitive and efficient.",
      author: "Dr. Sarah Chen",
      role: "Research Director",
      institution: "Stanford University"
    },
    {
      quote: "The automated scheduling system has saved us countless hours of manual coordination.",
      author: "Prof. James Wilson",
      role: "Department Head",
      institution: "MIT"
    },
    {
      quote: "An essential tool for modern laboratory management. Highly recommended!",
      author: "Dr. Emily Rodriguez",
      role: "Lab Manager",
      institution: "Harvard Medical School"
    }
  ];

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                component="h1"
                variant="h2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                LabReserve
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                Streamline your laboratory equipment reservations with our modern platform.
                Book equipment, manage reservations, and optimize your research workflow.
              </Typography>
              {!user ? (
                <Box sx={{ '& > button': { mr: 2, mb: 2 } }}>
                  <Button
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => navigate('/login')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.2)',
                        borderColor: 'white'
                      }
                    }}
                  >
                    Register
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  color="secondary"
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  Go to Dashboard
                </Button>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                alt="Laboratory equipment"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Box sx={{
                  color: 'primary.main',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  opacity: 0.9
                }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'primary.main', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Why Choose LabReserve?
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ color: 'primary.main', mr: 2 }}>
                        {benefit.icon}
                      </Box>
                      <Typography variant="h6" component="h3">
                        {benefit.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          gutterBottom
          sx={{ mb: 6 }}
        >
          What Our Users Say
        </Typography>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {testimonial.author}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.institution}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Statistics Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 'bold' }}>
                  50+
                </Typography>
                <Typography variant="h6">Partner Institutions</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 'bold' }}>
                  10k+
                </Typography>
                <Typography variant="h6">Active Users</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 'bold' }}>
                  99.9%
                </Typography>
                <Typography variant="h6">Uptime</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="div" sx={{ fontWeight: 'bold' }}>
                  24/7
                </Typography>
                <Typography variant="h6">Support</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 4
            }}
          >
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
              Join our platform today and experience efficient laboratory resource management.
            </Typography>
            {!user && (
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={() => navigate('/register')}
                sx={{ px: 6, py: 1.5 }}
              >
                Sign Up Now
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}