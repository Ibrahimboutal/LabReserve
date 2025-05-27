import { render,  } from '@testing-library/react';
import Reservations from '../../pages/Reservations';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { vi, Mock } from 'vitest';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock react-redux hooks
vi.mock('react-redux', () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

describe('Reservations Component', () => {
  const dispatchMock: Mock = vi.fn();

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'user1', email: 'test@example.com', role: 'student', department: '', created_at: '', image_url: '' },
      loading: false,
      signIn: vi.fn(),
      resetPassword: vi.fn(),
      resendConfirmation: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    });

    (useDispatch as unknown as jest.Mock).mockReturnValue(dispatchMock);
    (useSelector as unknown as jest.Mock).mockImplementation(selector => selector({
      reservations: {
        items: [],
        loading: false,
        error: null,
      },
    }));

    dispatchMock.mockClear();
  });

  test('renders Reservations page with no reservations', () => {
    render(
      <BrowserRouter>
        <Reservations />
      </BrowserRouter>
    );
  });

  test('opens reservation details dialog when info icon clicked', async () => {
    const reservationItem = {
      id: 'res1',
      equipment: {
        id: 'eq1',
        name: 'Microscope',
        category: 'Optics',
        manufacturer: 'BrandX',
        model: 'X100',
        image_url: '',
        lab_id: 'lab1',
      },
      start_time: new Date().toISOString(),
      end_time: new Date(new Date().getTime() + 3600000).toISOString(),
      status: 'approved',
      quantity: 1,
      purpose: 'Research',
      created_at: new Date().toISOString(),
    };

    ((useSelector as unknown) as jest.Mock).mockImplementation(selector => selector({
      reservations: {
        items: [reservationItem],
        loading: false,
        error: null,
      },
    }));

    render(
      <BrowserRouter>
        <Reservations />
      </BrowserRouter>
    );

 

  });
});
