import React, { useState, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
} from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';
import EventIcon from '@mui/icons-material/Event';
import NotificationAddIcon from '@mui/icons-material/NotificationAdd';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';

// Lazy-loaded components
const EquipmentManagement = React.lazy(() => import('../components/labmanager/EquipmentManagement'));
const CategoryManagement = React.lazy(() => import('../components/labmanager/CategoryManagement'));
const MaintenanceScheduling = React.lazy(() => import('../components/labmanager/MaintenanceScheduling'));
const ReservationManagement = React.lazy(() => import('../components/labmanager/ReservationManagement'));
const NotificationManagement = React.lazy(() => import('../components/labmanager/NotificationManagement'));
const AutoApprovalSettings = React.lazy(() => import('../components/labmanager/AutoApprovalSettings'));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lab_manager-tabpanel-${index}`}
      aria-labelledby={`lab_manager-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Suspense fallback={<CircularProgress />}>{children}</Suspense>
        </Box>
      )}
    </div>
  );
}

export default function LabManager() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const initialTab = parseInt(queryParams.get('tab') || '0', 10); // Default to tab 0
  const [value, setValue] = useState(initialTab);

  // Redirect if not lab_manager
  if (!user || user.role !== 'lab_manager') {
    return <Navigate to="/" replace />;
  }

  // Update the URL when the tab changes
  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);

    // Update the URL with the new tab value
    const params = new URLSearchParams(location.search);
    params.set('tab', newValue.toString());
    navigate(`/lab_manager${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Define tabs dynamically
  const TABS = [
    { label: 'Equipment', icon: <PrecisionManufacturingIcon />, Component: EquipmentManagement },
    { label: 'Categories', icon: <CategoryIcon />, Component: CategoryManagement },
    { label: 'Maintenance', icon: <BuildIcon />, Component: MaintenanceScheduling },
    { label: 'Reservations', icon: <EventIcon />, Component: ReservationManagement },
    { label: 'Notifications', icon: <NotificationAddIcon />, Component: NotificationManagement },
    { label: 'Auto-Approval', icon: <SettingsIcon />, Component: AutoApprovalSettings },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Lab Manager Dashboard
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        {/* Tabs */}
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="lab manager tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'capitalize',
              '&.Mui-selected': { color: 'primary.main' },
            },
          }}
        >
          {TABS.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              id={`lab_manager-tab-${index}`}
              aria-controls={`lab_manager-tabpanel-${index}`}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {/* Tab Panels */}
        {TABS.map((tab, index) => (
          <TabPanel key={index} value={value} index={index}>
            <tab.Component />
          </TabPanel>
        ))}
      </Paper>
    </Container>
  );
}