import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert

} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Equipment, Lab } from '../types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';

// Import dashboard components
import StatisticsCards from '../components/dashboard/StatisticsCards';
import MaintenanceSection from '../components/dashboard/MaintenanceSection';
import AvailableResources from '../components/dashboard/AvailableResources';
import { EquipmentReservations, LabReservations } from '../components/dashboard/TodayReservations';
import { EquipmentRecentReservations, LabRecentReservations } from '../components/dashboard/RecentReservations';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for equipment
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeReservations: 0,
    pendingReservations: 0,
    equipmentUtilization: 0,
  });
  const [recentEquipmentReservations, setRecentReservations] = useState<any[]>([]);
  const [equipmentReservations, setTodayReservations] = useState<any[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [popularEquipment, setPopularEquipment] = useState<Equipment[]>([]);

  // State for labs
  const [labStats, setLabStats] = useState({
    totalLab: 0,
    activeLabReservations: 0,
    pendingLabReservations: 0,
    LabUtilization: 0,
  });
  const [recentLabReservations, setRecentLabReservations] = useState<any[]>([]);
  const [labReservations, setTodayLabReservations] = useState<any[]>([]);
  const [upcomingLabMaintenance, setUpcomingLabMaintenance] = useState<any[]>([]);
  const [popularLabs, setPopularLabs] = useState<Lab[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  
  useEffect(() => {
    if (user && !hasFetched) {
      fetchDashboardData();
      fetchLabDashboardData();
      setHasFetched(true);
    }
  }, [user, hasFetched]);

  const fetchDashboardData = async () => {
    try {
      
      if (!hasFetched) setLoading(true);
      // Fetch statistics based on user role
      if (user?.role === 'admin' || user?.role === 'lab_manager') {
        const [equipmentStats, reservationStats, maintenanceStats] = await Promise.all([
          supabase.from('equipment').select('*'),
          supabase.from('reservations').select('*'),
          supabase.from('maintenance_schedules')
            .select(`
              *,
              equipment (
                id,
                name,
                category
              )
            `)
            .gte('scheduled_date', new Date().toISOString())
            .order('scheduled_date', { ascending: true })
            .limit(5),
        ]);

        if (equipmentStats.error) throw equipmentStats.error;
        if (reservationStats.error) throw reservationStats.error;
        if (maintenanceStats.error) throw maintenanceStats.error;

        setStats({
          totalEquipment: equipmentStats.data.length,
          activeReservations: reservationStats.data.filter(r => r.status === 'approved').length,
          pendingReservations: reservationStats.data.filter(r => r.status === 'pending').length,
          equipmentUtilization: calculateUtilization(equipmentStats.data, reservationStats.data),
        });
        
        setUpcomingMaintenance(maintenanceStats.data);
      }

      // Fetch recent reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          equipment (
            id,
            name,
            category,
            status,
            lab_id
          )
        `)
        .eq(user?.role === 'student' ? 'user_id' : 'status', user?.role === 'student' ? user.id : 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (reservationsError) throw reservationsError;
      setRecentReservations(reservations);

      // Fetch today's reservations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayData, error: todayError } = await supabase
        .from('reservations')
        .select(`
          *,
          equipment (
            id,
            name,
            category,
            status,
            lab_id
          )
        `)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .eq('status', 'approved')
        .eq(user?.role === 'student' ? 'user_id' : 'status', user?.role === 'student' ? user.id : 'approved')
        .order('start_time', { ascending: true });

      if (todayError) throw todayError;
      setTodayReservations(todayData || []);

      // Fetch popular equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('status', 'operational')
        .limit(5);

      if (equipmentError) throw equipmentError;
      setPopularEquipment(equipment);

    } catch (error: any) {
      setError(error.message);
    } finally {
      if (!hasFetched) setLoading(false);
    }
  };

  const fetchLabDashboardData = async () => {
    try {
      
      if (!hasFetched) setLoading(true);
      if (user?.role === 'admin' || user?.role === 'lab_manager') {
        const [labStats, labReservationStats, labMaintenanceStats] = await Promise.all([
          supabase.from('lab').select('*'),
          supabase.from('lab_reservations').select('*'),
          supabase.from('lab_maintenance_schedules')
            .select(`
              *,
              lab (
                id,
                name,
                location
              )
            `)
            .gte('scheduled_date', new Date().toISOString())
            .order('scheduled_date', { ascending: true })
            .limit(5)
        ]);

        if (labStats.error) throw labStats.error;
        if (labReservationStats.error) throw labReservationStats.error;
        if (labMaintenanceStats.error) throw labMaintenanceStats.error;

        setLabStats({
          totalLab: labStats.data.length,
          activeLabReservations: labReservationStats.data.filter(r => r.status === 'approved').length,
          pendingLabReservations: labReservationStats.data.filter(r => r.status === 'pending').length,
          LabUtilization: calculateLabUtilization(labStats.data, labReservationStats.data),
        });
        
        setUpcomingLabMaintenance(labMaintenanceStats.data);
      }

      // Fetch recent lab reservations and other lab-related data
      const { data: labReservations, error: labReservationsError } = await supabase
        .from('lab_reservations')
        .select(`
          *,
          lab (
            id,
            name,
            location
          )
        `)
        .eq(user?.role === 'student' ? 'user_id' : 'status', user?.role === 'student' ? user.id : 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (labReservationsError) throw labReservationsError;
      setRecentLabReservations(labReservations);

      // Fetch today's lab reservations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayLabData, error: todayLabError } = await supabase
        .from('lab_reservations')
        .select(`
          *,
          lab (
            id,
            name,
            location
          )
        `)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .eq('status', 'approved')
        .eq(user?.role === 'student' ? 'user_id' : 'status', user?.role === 'student' ? user.id : 'approved')
        .order('start_time', { ascending: true });

      if (todayLabError) throw todayLabError;
      setTodayLabReservations(todayLabData || []);

      // Fetch popular labs
      const { data: labs, error: labsError } = await supabase
        .from('lab')
        .select('*')
        .eq('status', 'available')
        .limit(5);

      if (labsError) throw labsError;
      setPopularLabs(labs);

    } catch (error: any) { 
      setError(error.message);
    } finally {
      if (!hasFetched) setLoading(false);
    }
  };

  const calculateUtilization = (equipment: Equipment[], reservations: any[]) => {
    if (equipment.length === 0) return 0;
    const totalEquipmentUnits = equipment.reduce((total, eq) => total + eq.quantity, 0);
    const totalReservedUnits = reservations
      .filter(r => r.status === 'completed')
      .reduce((total, r) => total + (r.quantity || 1), 0);
    return Math.round((totalReservedUnits / totalEquipmentUnits) * 100);
  };

  const calculateLabUtilization = (labs: Lab[], labReservations: any[]) => {
    if (labs.length === 0) return 0;
    const currentDate = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    const recentReservations = labReservations.filter(reservation => {
      const reservationDate = new Date(reservation.start_time);
      return reservationDate >= sevenDaysAgo && reservation.status === 'completed';
    });
    const reservedLabIds = new Set(recentReservations.map(reservation => reservation.lab_id));
    const reservedLabsCount = reservedLabIds.size;
    return Math.round((reservedLabsCount / labs.length) * 100);
  };

  const handleReserveEquipment = (equipmentId: string) => {
    navigate(`/equipment?reserve=${equipmentId}`);
  };

  const handleReserveLab = (labId: string) => {
    navigate(`/labs?reserve=${labId}`);
  };

  const handleReviewReservation = (reservationId: string) => {
    navigate(`/admin?tab=5&reservation=${reservationId}`);
  };

  const handleReviewLabReservation = (labReservationId: string) => {
    navigate(`/admin?tab=5&labReservation=${labReservationId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'denied':
      case 'cancelled':
        return <CancelIcon color="error" />;
      case 'completed':
        return <CheckCircleIcon color="primary" />;
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" >{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" data-testid="welcome">
          Welcome, {user?.email?.split('@')[0]}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" data-testid="date">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Typography>
      </Box>

      <StatisticsCards 
        stats={stats} 
        labStats={labStats} 
        userRole={user?.role || 'student'} 
        user={user}
      />

    <EquipmentReservations
      reservations={equipmentReservations}
      title="Today's Equipment Reservations"
    />

    <LabReservations
      reservations={labReservations}
      title="Today's Lab Reservations"
    />

    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Left Column */}
      <Box sx={{ flex: 1 }}>
        {/* Recent Equipment Reservations */}
        <EquipmentRecentReservations
            reservations={recentEquipmentReservations}
            userRole={user?.role || 'student'}
            title={user?.role === 'student' ? 'My Recent Equipment Reservations' : 'Pending Equipment Reservations'}
            onReviewClick={handleReviewReservation}
            getStatusIcon={getStatusIcon} getReservationName={function (_reservation: any): string {
              throw new Error('Function not implemented.');
            } }        />

        {/* Recent Lab Reservations */}
        <LabRecentReservations
            reservations={recentLabReservations}
            userRole={user?.role || 'student'}
            title={user?.role === 'student' ? 'My Recent Lab Reservations' : 'Pending Lab Reservations'}
            onReviewClick={handleReviewLabReservation}
            getStatusIcon={getStatusIcon} getReservationName={function (_reservation: any): string {
              throw new Error('Function not implemented.');
            } }        />
      </Box>

      {/* Right Column */}
      <Box sx={{ flex: 1 }}>
        {user?.role === 'student' ? (
          <AvailableResources 
            equipment={popularEquipment}
            labs={popularLabs}
            onReserveEquipment={handleReserveEquipment}
            onReserveLab={handleReserveLab}
          />
        ) : (
          <>
            {/* Upcoming Equipment Maintenance */}
            <MaintenanceSection 
              maintenance={upcomingMaintenance}
              title="Upcoming Equipment Maintenance"
              userRole={user?.role || 'student'}
            />
            {/* Upcoming Lab Maintenance */}
            <MaintenanceSection 
              maintenance={upcomingLabMaintenance}
              title="Upcoming Lab Maintenance"
              userRole={user?.role || 'student'}
            />
          </>
        )}
      </Box>
    </Box>
    </Container>
  );
}