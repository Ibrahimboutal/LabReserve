import { Box, Typography, Paper, List, ListItem, ListItemText, Button, Grid } from '@mui/material';
import { format, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';



interface RecentReservationsProps<T> {
  reservations: T[];
  userRole: string;
  title: string;
  onReviewClick: (id: string) => void;
  getStatusIcon: (status: string) => JSX.Element | null;
  getReservationName: (reservation: T) => string;
}

export default function RecentReservations<T>({
  reservations,
  userRole,
  title,
  onReviewClick,
  getStatusIcon,
  getReservationName,
}: RecentReservationsProps<T>) {
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

      {/* Reservations List */}
      <List sx={{ p: 0, height: '300px', overflow: 'auto' }}>
        {reservations.length > 0 ? (
          reservations.map((reservation, _index) => {
            // Validate start_time and end_time
            const startTime = isValid(new Date((reservation as any).start_time))
              ? format(new Date((reservation as any).start_time), 'PPp')
              : 'Invalid Time';
            const endTime = isValid(new Date((reservation as any).end_time))
              ? format(new Date((reservation as any).end_time), 'PPp')
              : 'Invalid Time';

            return (
              <ListItem key={(reservation as any).id} sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Status Icon */}
                  <Box sx={{ mr: 2 }}>{getStatusIcon((reservation as any).status) || null}</Box>

                  {/* Reservation Details */}
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="medium">
                        {getReservationName(reservation)}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {startTime} - {endTime}
                      </Typography>
                    }
                  />

                  {/* Review Button (for admin/lab_manager) */}
                  {(userRole === 'admin' || userRole === 'lab_manager') && (
                    <Button
                      variant="outlined"
                      size="small"
                      aria-label={`Review reservation ${(reservation as any).id}`}
                      onClick={() => onReviewClick((reservation as any).id)}
                    >
                      Review
                    </Button>
                  )}
                </Box>
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText
              primary={
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No recent reservations
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
          aria-label="View all reservations"
          onClick={() =>
            navigate(
              userRole === 'student'
                ? '/reservations'
                : userRole === 'admin'
                ? '/admin?tab=5'
                : '/lab_manager?tab=3'
            )
          }
        >
          View All Reservations
        </Button>
      </Box>
    </Paper>
  </Grid>
  );
}

export function EquipmentRecentReservations({
  reservations,
  userRole,
  title,
  onReviewClick,
  getStatusIcon,
}: RecentReservationsProps<any>) {
  return (
    <RecentReservations
      reservations={reservations}
      userRole={userRole}
      title={title}
      onReviewClick={onReviewClick}
      getStatusIcon={getStatusIcon}
      getReservationName={(reservation) => reservation.equipment?.name || 'Unknown Equipment'}
    />
  );
}

export function LabRecentReservations({
  reservations,
  userRole,
  title,
  onReviewClick,
  getStatusIcon,
}: RecentReservationsProps<any>) {
  return (
    <RecentReservations
      reservations={reservations}
      userRole={userRole}
      title={title}
      onReviewClick={onReviewClick}
      getStatusIcon={getStatusIcon}
      getReservationName={(reservation) => reservation.lab?.name || 'Unknown Lab'}
    />
  );
}