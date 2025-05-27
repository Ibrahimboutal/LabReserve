import { Box, Typography, List, ListItem, ListItemText, Button, Chip, Grid, Paper } from '@mui/material';
import { format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface MaintenanceSectionProps {
  maintenance: any[];
  title: string;
  userRole: string;
}

export default function MaintenanceSection({ maintenance, title, userRole }: MaintenanceSectionProps) {
  const navigate = useNavigate();

  return (
    <Grid item xs={12} md={6}>
    <Paper sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
    
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>

      {/* Maintenance List */}
      <List sx={{ p: 0, height: '300px', overflow: 'auto' }}>
        {maintenance.length > 0 ? (
          maintenance.map((item, _index) => {
            // Validate scheduled_date
            const scheduledDate = isValid(new Date(item.scheduled_date))
              ? format(new Date(item.scheduled_date), 'MMM d')
              : 'Invalid Date';

            return (
              <ListItem key={item.id} sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Scheduled Date */}
                  <Box
                    sx={{
                      mr: 2,
                      p: 1,
                      bgcolor: 'primary.light',
                      borderRadius: 1,
                      minWidth: '80px',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {scheduledDate}
                    </Typography>
                  </Box>

                  {/* Maintenance Details */}
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {item.equipment?.name || item.lab?.name || 'Unknown Resource'}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {item.type || 'Unknown Type'} • {item.status || 'Unknown Status'}
                      </Typography>
                    }
                  />

                  {/* Status Chip */}
                  <Chip
                    label={item.status || 'Unknown'}
                    color={
                      item.status === 'scheduled'
                        ? 'primary'
                        : item.status === 'in_progress'
                        ? 'warning'
                        : item.status === 'completed'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                  />
                </Box>
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No upcoming maintenance scheduled
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      {/* View All Button */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="text"
          endIcon={<ArrowForwardIcon />}
          aria-label="View all maintenance"
          onClick={() =>
            navigate(userRole === 'admin' ? '/admin?tab=4' : '/lab_manager?tab=2')
          }
        >
          View All Maintenance
        </Button>
      </Box>
    
    </Paper>
  </Grid>
  );
}