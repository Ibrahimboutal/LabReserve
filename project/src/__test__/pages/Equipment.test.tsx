import { render, screen, fireEvent } from '@testing-library/react';
import Equipment from '../../pages/Equipment';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
// Removed unnecessary import of Mock from 'jest-mock'
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
// import { Mock } from 'node:test'; // Removed, not needed

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

describe('Equipment Component', () => {
  const dispatchMock = vi.fn();

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
    (useDispatch as unknown) = vi.fn(() => dispatchMock);
    (useSelector as unknown) = vi.fn(selector => selector({
      equipment: {
        items: [],
        loading: false,
        error: null,
      },
    }));

    dispatchMock.mockClear();
  });

  test('renders Equipment page with no equipment', () => {
    render(
      <BrowserRouter>
        <Equipment />
      </BrowserRouter>
    );

    expect(screen.getByText(/laboratory equipment/i)).toBeInTheDocument();
    expect(screen.getByText(/no equipment found/i)).toBeInTheDocument();
  });

  test('opens reservation dialog when Reserve button clicked', async () => {
    const equipmentItem = {
      id: 'eq1',
      name: 'Microscope',
      category: 'Optics',
      quantity: 5,
      units_under_reservation: 0,
      units_under_maintenance: 0,
      status: 'operational',
      manufacturer: 'BrandX',
      model: 'X100',
      description: 'High quality microscope',
      lab_id: 'lab1',
      image_url: '',
      detailed_specs: {},
    };

    ((useSelector as unknown) as jest.Mock).mockImplementation(selector => selector({
      equipment: {
        items: [equipmentItem],
        loading: false,
        error: null,
      },
    }));

    render(
      <BrowserRouter>
        <Equipment />
      </BrowserRouter>
    );

    const reserveButton = await screen.findByRole('button', { name: /reserve/i });
    fireEvent.click(reserveButton);

    expect(await screen.findByText(/reserve equipment: microscope/i)).toBeInTheDocument();
  });
});
