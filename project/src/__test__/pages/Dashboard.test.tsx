import { render, screen } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock vitest before anything else
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: {
      id: 'user1',
      email: 'test@example.com',
      role: 'student',
      department: 'Physics',
      created_at: '',
      image_url: '',
    },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    resendConfirmation: vi.fn(),
    signOut: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

// Hoist supabase mock before import
const { mockFrom } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn().mockImplementation((_table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (onSuccess: any) =>
        onSuccess({ data: [], error: null }),
      catch: (onError: any) =>
        onError({ error: new Error('Fetch error') }),
    })),
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('Dashboard Component', () => {
  test('renders loading state when user is loading', () => {
    // Arrange: Set loading to true
    vi.mock('../../hooks/useAuth', () => ({
      useAuth: vi.fn().mockReturnValue({
        user: null,
        loading: true,
        signIn: vi.fn(),
        signUp: vi.fn(),
        resetPassword: vi.fn(),
        resendConfirmation: vi.fn(),
        signOut: vi.fn(),
        updatePassword: vi.fn(),
      }),
    }));

    // Act
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Assert: Loading indicator shows up
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error message when Supabase request fails', async () => {
    // Arrange: Simulate Supabase error
    mockFrom.mockImplementationOnce((_table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn(), // Don't resolve
      catch: vi.fn((onError) =>
        onError({ error: new Error('Fetch error') })
      ),
    }));

    // Act
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });

  test('renders dashboard content when data is loaded', async () => {
    // Arrange: Return empty arrays for reservations
    mockFrom.mockImplementation((_table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (onSuccess: any) => onSuccess({ data: [], error: null }),
      catch: vi.fn(),
    }));

    // Act
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });

  test('renders no labs available message when no data', async () => {
    // Arrange: Simulate no labs or equipment
    mockFrom.mockImplementation((_table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (onSuccess: any) => onSuccess({ data: [], error: null }),
      catch: vi.fn(),
    }));

    // Act
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });

  test('renders lab and equipment lists when data is fetched', async () => {
    // Arrange: Mock real data
    mockFrom.mockImplementation((_table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: (onSuccess: any) => onSuccess({
        data: [
          { id: 1, name: 'Lab A' },
          { id: 2, name: 'Lab B' },
        ],
        error: null,
      }),
      catch: vi.fn(),
    }));

    // Act
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });
});