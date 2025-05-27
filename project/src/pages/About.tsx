import { Box, Container, Typography, Grid, Avatar, Card, CardContent, Button, Stack, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import VerifiedIcon from '@mui/icons-material/Verified';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const HeroSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(10, 0),
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
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(6),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -16,
    left: 0,
    width: 60,
    height: 4,
    backgroundColor: theme.palette.primary.main
  }
}));

const TeamMember = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginBottom: theme.spacing(4)
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(20),
  height: theme.spacing(20),
  marginBottom: theme.spacing(2),
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[3]
}));

const TestimonialCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 20,
    left: 20,
    color: theme.palette.grey[200],
    fontSize: '4rem',
    opacity: 0.2,
    zIndex: 0
  }
}));

const ValueItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(3)
}));

export default function About() {
  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            About LabReserve
          </Typography>
          <Typography variant="h5" sx={{ maxWidth: '800px', mb: 4 }}>
            Empowering research and education through innovative laboratory resource management
          </Typography>
        </Container>
      </HeroSection>

      {/* Our Story Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <SectionTitle variant="h4" as="h2">
              Our Story
            </SectionTitle>
            <Typography paragraph>
              LabReserve was founded in 2023 by a team of scientists and engineers who experienced firsthand the challenges of managing laboratory resources in academic and research settings. We recognized that inefficient equipment scheduling and resource allocation were significant barriers to research productivity and educational outcomes.
            </Typography>
            <Typography paragraph>
              What began as an internal solution for our university's science department quickly evolved into a comprehensive platform designed to serve research institutions, universities, and corporate laboratories worldwide. Our mission is to streamline laboratory operations, maximize equipment utilization, and foster collaboration among researchers.
            </Typography>
            <Typography paragraph>
              Today, LabReserve serves over 50 institutions across the country, helping thousands of researchers and students access the equipment they need when they need it. We're proud to play a small but meaningful role in advancing scientific discovery and education.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
              alt="Laboratory equipment"
              sx={{
                width: '100%',
                maxWidth: 500,
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3
              }}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Mission & Values Section */}
      <Box sx={{ bgcolor: 'dark.100', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <SectionTitle variant="h4" as="h2">
                Our Mission
              </SectionTitle>
              <Typography variant="h6" paragraph fontWeight="medium">
                To optimize laboratory resource utilization and accelerate scientific progress through intuitive, efficient management solutions.
              </Typography>
              <Typography paragraph>
                We believe that researchers and educators should focus on their work, not on administrative hurdles. LabReserve eliminates the friction in laboratory resource management, creating more time for what truly matters: discovery, learning, and innovation.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ mt: 2 }}
              >
                Learn More About Our Solutions
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle variant="h4" as="h2">
                Our Core Values
              </SectionTitle>
              
              <ValueItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" fontSize="large" />
                </ListItemIcon>
                <Box>
                  <Typography variant="h6">Innovation</Typography>
                  <Typography variant="body1">
                    We continuously improve our platform with cutting-edge technology to meet evolving laboratory needs.
                  </Typography>
                </Box>
              </ValueItem>
              
              <ValueItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" fontSize="large" />
                </ListItemIcon>
                <Box>
                  <Typography variant="h6">Accessibility</Typography>
                  <Typography variant="body1">
                    We believe all researchers and students deserve equal access to laboratory resources.
                  </Typography>
                </Box>
              </ValueItem>
              
              <ValueItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" fontSize="large" />
                </ListItemIcon>
                <Box>
                  <Typography variant="h6">Reliability</Typography>
                  <Typography variant="body1">
                    Our systems are designed for maximum uptime and dependability, because research can't wait.
                  </Typography>
                </Box>
              </ValueItem>
              
              <ValueItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" fontSize="large" />
                </ListItemIcon>
                <Box>
                  <Typography variant="h6">Collaboration</Typography>
                  <Typography variant="body1">
                    We foster a community where knowledge and resources are shared efficiently.
                  </Typography>
                </Box>
              </ValueItem>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <SectionTitle variant="h4" as="h2" align="center" sx={{ '&:after': { left: 'calc(50% - 30px)' } }}>
          Our Leadership Team
        </SectionTitle>
        <Typography align="center" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
          Meet the experts behind LabReserve. Our diverse team combines decades of experience in laboratory management, software development, and academic research.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <TeamMember>
              <LargeAvatar alt="Dr. Sarah Chen" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" />
              <Typography variant="h6" component="h3">Dr. Sarah Chen</Typography>
              <Typography variant="subtitle1" color="primary" gutterBottom>Founder & CEO</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                Former Research Director with 15+ years experience in laboratory management and academic research.
              </Typography>
            </TeamMember>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TeamMember>
              <LargeAvatar alt="Dr. Marcus Johnson" src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" />
              <Typography variant="h6" component="h3">Dr. Marcus Johnson</Typography>
              <Typography variant="subtitle1" color="primary" gutterBottom>CTO</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                PhD in Computer Science with expertise in database systems and resource optimization algorithms.
              </Typography>
            </TeamMember>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <TeamMember>
              <LargeAvatar alt="Dr. Amelia Rodriguez" src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" />
              <Typography variant="h6" component="h3">Dr. Amelia Rodriguez</Typography>
              <Typography variant="subtitle1" color="primary" gutterBottom>Head of Customer Success</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                Former Lab Manager with a passion for improving laboratory workflows and user experience.
              </Typography>
            </TeamMember>
          </Grid>
        </Grid>
      </Container>

      {/* Achievements Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Our Impact
          </Typography>
          <Typography align="center" paragraph sx={{ mb: 6 }}>
            LabReserve is transforming how institutions manage their laboratory resources
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="p" fontWeight="bold">50+</Typography>
                <Typography variant="h6" component="p">Institutions</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="p" fontWeight="bold">10,000+</Typography>
                <Typography variant="h6" component="p">Users</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="p" fontWeight="bold">30%</Typography>
                <Typography variant="h6" component="p">Increase in Equipment Utilization</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" component="p" fontWeight="bold">25+</Typography>
                <Typography variant="h6" component="p">Research Publications Citing Our Platform</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Certifications Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <SectionTitle variant="h4" as="h2">
              Certifications & Recognition
            </SectionTitle>
            <List>
              <ListItem>
                <ListItemIcon>
                  <VerifiedIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="ISO 27001 Certified" 
                  secondary="Our information security management system meets international standards"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="EdTech Breakthrough Award 2024" 
                  secondary="Winner of 'Best STEM Solution' category"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ScienceIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Lab Manager Innovation Award" 
                  secondary="Recognized for transformative impact on laboratory operations"
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              <Box 
                component="img" 
                src="https://via.placeholder.com/150x100?text=ISO+27001"
                alt="ISO 27001 Certification"
                sx={{ maxWidth: 150, height: 'auto' }}
              />
              <Box 
                component="img" 
                src="https://via.placeholder.com/150x100?text=EdTech+Award"
                alt="EdTech Breakthrough Award"
                sx={{ maxWidth: 150, height: 'auto' }}
              />
              <Box 
                component="img" 
                src="https://via.placeholder.com/150x100?text=Lab+Manager"
                alt="Lab Manager Innovation Award"
                sx={{ maxWidth: 150, height: 'auto' }}
              />
              <Box 
                component="img" 
                src="https://via.placeholder.com/150x100?text=GDPR+Compliant"
                alt="GDPR Compliance"
                sx={{ maxWidth: 150, height: 'auto' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ bgcolor: 'dark.100', py: 8 }}>
        <Container maxWidth="lg">
          <SectionTitle variant="h4" as="h2" align="center" sx={{ '&:after': { left: 'calc(50% - 30px)' } }}>
            What Our Clients Say
          </SectionTitle>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <TestimonialCard elevation={3}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FormatQuoteIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" paragraph sx={{ flex: 1 }}>
                    "LabReserve has revolutionized how we manage our research equipment. The scheduling conflicts that used to plague our department are now a thing of the past. Our equipment utilization has increased by 40% since implementation."
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Dr. James Wilson</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Department Chair, Chemistry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stanford University
                    </Typography>
                  </Box>
                </CardContent>
              </TestimonialCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TestimonialCard elevation={3}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FormatQuoteIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" paragraph sx={{ flex: 1 }}>
                    "The maintenance tracking features alone have saved us thousands in preventive maintenance costs. The platform is intuitive for both students and faculty, and the support team is incredibly responsive."
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Dr. Emily Chen</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lab Operations Director
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      MIT Biological Engineering
                    </Typography>
                  </Box>
                </CardContent>
              </TestimonialCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TestimonialCard elevation={3}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <FormatQuoteIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" paragraph sx={{ flex: 1 }}>
                    "As a research-intensive pharmaceutical company, equipment downtime directly impacts our bottom line. LabReserve has helped us reduce scheduling conflicts by 90% and improve our maintenance compliance to nearly 100%."
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Sarah Johnson</Typography>
                    <Typography variant="body2" color="text.secondary">
                      VP of Laboratory Operations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      BioGenTech Pharmaceuticals
                    </Typography>
                  </Box>
                </CardContent>
              </TestimonialCard>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <SectionTitle variant="h4" as="h2">
              Get In Touch
            </SectionTitle>
            <Typography paragraph>
              Have questions about LabReserve or want to see how our platform can help your institution? Our team is ready to assist you.
            </Typography>
            
            <List>
              <ListItem disableGutters>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Email" secondary="info@labreserve.com" />
              </ListItem>
              
              <ListItem disableGutters>
                <ListItemIcon>
                  <PhoneIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Phone" secondary="(800) 555-LABS" />
              </ListItem>
              
              <ListItem disableGutters>
                <ListItemIcon>
                  <LocationOnIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Headquarters" 
                  secondary="123 Innovation Way, Cambridge, MA 02142"
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Follow Us
              </Typography>
              <Stack direction="row" spacing={2}>
                <IconButton color="primary" aria-label="LinkedIn">
                  <LinkedInIcon />
                </IconButton>
                <IconButton color="primary" aria-label="Twitter">
                  <TwitterIcon />
                </IconButton>
                <IconButton color="primary" aria-label="Facebook">
                  <FacebookIcon />
                </IconButton>
              </Stack>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: 4,
                borderRadius: 2,
                boxShadow: 3
              }}
            >
              <Typography variant="h5" component="h3" gutterBottom>
                Ready to optimize your lab resources?
              </Typography>
              <Typography paragraph>
                Join the growing community of institutions that trust LabReserve for their laboratory management needs.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                sx={{ mt: 2 }}
              >
                Request a Demo
              </Button>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                No commitment required. See the difference for yourself.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}