import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import NotificationCenter from './NotificationCenter';
import MessageCenter from './MessageCenter';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Footer from './Footer';
import { supabase } from '../lib/supabase';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import React from 'react';



interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode, toggleColorMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  


  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await signOut(); // Only call signOut if session exists
      }

      navigate('/login');
    } catch (err) {
      console.warn('No valid session found — logging out anyway.');
      navigate('/login');
    }
  };

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

type DrawerItem = 
  | { label: string; path: string; action?: never }
  | { label: string; action: () => void; path?: never };

const drawerItems: DrawerItem[] = React.useMemo(() => {
  if (user) {
    const items: DrawerItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Equipment', path: '/equipment' },
      { label: 'Labs', path: '/labs' },
      { label: 'Reservations', path: '/reservations' },
      { label: 'Profile', path: '/profile' },
      { label: 'About', path: '/about' },
    ];

    if (user.role === 'admin') items.push({ label: 'Admin', path: '/admin' });
    if (user.role === 'lab_manager') items.push({ label: 'Lab Manager', path: '/lab_manager' });

    items.push({ label: 'Logout', action: handleLogout });

    return items;
  } else {
    return [
      { label: 'About', path: '/about' },
      { label: 'Login', path: '/login' },
      { label: 'Register', path: '/register' },
    ];
  }
}, [user]);




  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh' }}>

      <AppBar position="static">
        
        <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          LabReserve
        </Typography>

        <IconButton 
          sx={{ mr: 2 }} 
          onClick={toggleColorMode} 
          color="inherit"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {isMobile ? (
          // Simplified mobile version (e.g., drawer menu or fewer buttons)
          <>
          
          <IconButton color="inherit" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', p: 2 }}>
            {user && (
              <Box sx={{ mb: 2 }}>
                <NotificationCenter />
                <MessageCenter />
              </Box>
            )}

            <List sx={{ width: 250 }}>
              {drawerItems.map((item, index) => (
                <ListItem 
                  button 
                  key={index} 
                  onClick={() => {
                    setDrawerOpen(false);
                    item.path ? navigate(item.path) : item.action?.();
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
            </List>
            </Box>
          </Drawer>


          </>
        ) : (
          // Full version for tablets/desktops
          <>
            <Button color="inherit" onClick={() => navigate('/about')}>
              About
            </Button>
            {user ? (
              <>
                <NotificationCenter />
                <MessageCenter />
                <Button color="inherit" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button color="inherit" onClick={() => navigate('/equipment')}>
                  Equipment
                </Button>
                <Button color="inherit" onClick={() => navigate('/labs')}>
                  Labs
                </Button>
                <Button color="inherit" onClick={() => navigate('/reservations')}>
                  Reservations
                </Button>
                {user.role === 'admin' && (
                  <Button color="inherit" onClick={() => navigate('/admin')}>
                    Admin
                  </Button>
                )}
                {user.role === 'lab_manager' && (
                  <Button color="inherit" onClick={() => navigate('/lab_manager')}>
                    Lab Manager
                  </Button>
                )}
                <Button color="inherit" onClick={() => navigate('/profile')}>
                  Profile
                </Button>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </>
        )}
      </Toolbar>
      </AppBar>

      <Box
      component="main"
        sx={{ 
        flexGrow: 1,
        p: 3 }}>

        {children}
      </Box>
      <Footer />
    </Box>
  );
}
