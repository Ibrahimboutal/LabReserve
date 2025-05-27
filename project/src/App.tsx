import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline} from '@mui/material';
import { Provider } from 'react-redux';
import { getTheme } from './theme';
import { store } from './store';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import Labs from './pages/Labs';
import Reservations from './pages/Reservations';
import Profile from './pages/Profile';
import Admin from './pages/Admin'; 
import About from './pages/About';
import NotFound from './pages/NotFound';
import LabManager from './pages/LabManager';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import PrivateRoute from './components/PrivateRoute';

function AppContent() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/equipment"
                element={
                  <PrivateRoute>
                    <Equipment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/labs"
                element={
                  <PrivateRoute>
                    <Labs />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reservations"
                element={
                  <PrivateRoute>
                    <Reservations />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                }
              />
              <Route
                path="/lab_manager"
                element={
                  <PrivateRoute>
                    <LabManager />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

function App() {
  
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;



