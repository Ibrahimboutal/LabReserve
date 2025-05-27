import { Box, Button, Card, CardContent, Grid, LinearProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ScienceIcon from '@mui/icons-material/Science';
import EventIcon from '@mui/icons-material/Event';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { UserRole, users } from '@/types';

export interface StatisticsCardsProps {
  stats: {
    totalEquipment?: number;
    activeReservations?: number;
    pendingReservations?: number;
    equipmentUtilization?: number;
  };
  labStats: {
    totalLab?: number;
    activeLabReservations?: number;
    pendingLabReservations?: number;
    LabUtilization?: number;
  };
  user: users | null;
  userRole: UserRole;
}

export default function StatisticsCards({ stats = {}, labStats = {}, user }: StatisticsCardsProps) {
  const navigate = useNavigate();

  // Determine the user role with a fallback to 'student'
  const userRole = user?.role || 'student';

  return (
    <>
      {/* Equipment Statistics Cards */}
      {(['admin', 'lab_manager'].includes(userRole)) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Equipment */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'primary.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ScienceIcon color="primary" />
                  </Box>
                  <Typography color="text.secondary">Total Equipment</Typography>

                </Box>

                <Typography variant="h4" fontWeight="bold">{stats.totalEquipment}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/equipment')}
                  sx={{ mt: 1 }}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Reservations */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'success.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <EventIcon color="success" />
                  </Box>
                  <Typography color="text.secondary">Active Reservations</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{stats.activeReservations ?? 0}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    if (user?.role === 'admin')
                    navigate('/admin?tab=5')
                    else if (user?.role === 'lab_manager') {
                      navigate('/lab_manager?tab=3');
                    }
                  }}
                  sx={{ mt: 1 }}
                >
                  Manage
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Reservations */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'warning.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <NotificationsIcon color="warning" />
                  </Box>
                  <Typography color="text.secondary">Pending Requests</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{stats.pendingReservations ?? 0}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    if (user?.role === 'admin') {
                      navigate('/admin?tab=5&filter=pending');
                    } else if (user?.role === 'lab_manager') {
                      navigate('/lab_manager?tab=3&filter=pending');
                    }
                  }}
                  sx={{ mt: 1 }}
                >
                  Review
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipment Utilization */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'info.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AssessmentIcon color="info" />
                  </Box>
                  <Typography color="text.secondary">Equipment Utilization</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{stats.equipmentUtilization ?? 0}%</Typography>
                <Box sx={{ mt: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.equipmentUtilization} 
                    color={
                      (stats.equipmentUtilization ?? 0) > 75 ? "success" : 
                      (stats.equipmentUtilization ?? 0) > 40 ? "info" : "warning"

                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Lab Statistics Cards */}
      {(['admin', 'lab_manager'].includes(userRole)) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'primary.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ScienceIcon color="primary" />
                  </Box>
                  <Typography color="text.secondary">Total Labs</Typography>

                </Box>

                <Typography variant="h4" fontWeight="bold">{labStats.totalLab ?? 0}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/labs')}
                  sx={{ mt: 1 }}
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'success.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <EventIcon color="success" />
                  </Box>
                  <Typography color="text.secondary">Active Lab Reservations</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{labStats.activeLabReservations ?? 0}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    if (user?.role === 'admin')
                      navigate('/admin?tab=5')
                      else if (user?.role === 'lab_manager') {
                        navigate('/lab_manager?tab=3');
                      }
                  }
                  }
                  sx={{ mt: 1 }}
                >
                  Manage 
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'warning.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <NotificationsIcon color="warning" />
                  </Box>
                  <Typography color="text.secondary">Pending Lab Requests</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{labStats.pendingLabReservations ?? 0}</Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    if (user?.role === 'admin') {
                      navigate('/admin?tab=5&filter=pending');
                    } else if (user?.role === 'lab_manager') {
                      navigate('/lab_manager?tab=3&filter=pending');
                    }
                  }}
                  sx={{ mt: 1 }}
                >
                  Review
                </Button>
              </CardContent>
            </Card>
            </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%', 
              transition: 'transform 0.2s', 
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'info.light', 
                    borderRadius: '50%', 
                    p: 1, 
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AssessmentIcon color="info" />
                  </Box>
                  <Typography color="text.secondary">Lab Utilization</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">{labStats.LabUtilization ?? 0}%</Typography>
                <Box sx={{ mt: 1, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={labStats.LabUtilization} 
                    color={
                      (labStats.LabUtilization ?? 0) > 75 ? "success" : 
                      (labStats.LabUtilization ?? 0) > 40 ? "info" : "warning"

                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
            </Grid>
        </Grid>
      )}
    </>
  );
}