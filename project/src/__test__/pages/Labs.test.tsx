import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Labs from '../../pages/Labs'; // Adjust path accordingly

// Mock Redux
vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn: any) => fn(mockRootState),
}));

// Mock AuthContext manually
import { createContext } from 'react';

const mockUser = { id: 'user123' };

export const AuthContext = createContext<{ user: typeof mockUser | null }>({ user: null });

const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={{ user: mockUser }}>{children}</AuthContext.Provider>
);

vi.mock('../../hooks/useAuth', () => {
  return {
    useAuth: () => ({ user: mockUser }),
  };
});

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (_table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockLabToReserve }),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock other dependencies
vi.mock('../../store', () => ({
  setLabLoading: vi.fn(),
  setLabs: vi.fn(),
  setLabError: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '' }),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'uuid-123'),
}));

// Mock Lab Data
const mockLab = {
  id: 'lab1',
  name: 'Physics Lab',
  location: 'Building A',
  capacity: 20,
  status: 'available',
  description: 'A well-equipped physics lab',
  features: 'Projector, Whiteboard',
  manager_id: 'manager1',
  image_url: '',
};

const mockLabToReserve = {
  id: 'lab2',
  name: 'Chemistry Lab',
  location: 'Building B',
  capacity: 30,
  status: 'available',
  description: 'Advanced chemistry equipment',
  features: 'Fume Hood, Microscope',
  manager_id: 'manager2',
  image_url: '',
};

const mockRootState = {
  labs: {
    items: [mockLab],
    loading: false,
    error: null,
  },
};

describe('Labs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render labs correctly', async () => {
    const { getByText } = render(
      <AuthProvider>
        <Labs />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Physics Lab')).toBeInTheDocument();
    });
  });

  it('should open reservation dialog when reserve button is clicked', async () => {
    const { getByText, getByRole } = render(
      <AuthProvider>
        <Labs />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Physics Lab')).toBeInTheDocument();
    });

    fireEvent.click(getByText('Reserve Lab'));
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('should show an error if number of attendees exceeds capacity', async () => {
    render(
      <AuthProvider>
        <Labs />
      </AuthProvider>
    );

    const reserveButton = await screen.findByText('Reserve Lab');
    fireEvent.click(reserveButton);

    const attendeesInput = await screen.findByTestId('attendees-input');
    await userEvent.type(attendeesInput, '25')

    const form = await screen.findByTestId('reservation-form');
fireEvent.submit(form);

  });

  it('should apply filters correctly', async () => {
    render(
      <AuthProvider>
        <Labs />
      </AuthProvider>
    );

      const searchInput = await screen.findByTestId('search-input');
      await userEvent.type(searchInput, 'Chemistry');

  });


  it('should submit a valid reservation', async () => {
  render(
    <AuthProvider>
      <Labs />
    </AuthProvider>
  );

  const reserveButton = await screen.findByText('Reserve Lab');
  fireEvent.click(reserveButton);

  const purposeInput = await screen.findByTestId('purpose-input');
  await userEvent.type(purposeInput, 'Testing chemicals');

  const attendeesInput = await screen.findByTestId('attendees-input');
  await userEvent.type(attendeesInput, '15');

  const startTimeInput = await screen.findByTestId('start-time-input');
  await userEvent.type(startTimeInput, '2023-10-01T10:00');

  const endTimeInput = await screen.findByTestId('end-time-input');
  await userEvent.type(endTimeInput, '2023-10-01T12:00');

  const form = await screen.findByTestId('reservation-form');
fireEvent.submit(form);

});
});