import { render, screen } from '@testing-library/react';
import LabManager from '../../pages/LabManager';
import { useAuth } from '../../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LabManager Component', () => {
  test('redirects non-lab_manager users', () => {
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

    const { container } = render(
      <BrowserRouter>
        <LabManager />
      </BrowserRouter>
    );

    // Since non-lab_manager users are redirected, the component should render nothing or redirect component
    expect(container.innerHTML).toBe('');
  });

  test('renders lab manager dashboard for lab_manager user', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'labmanager1', email: 'labmanager@example.com', role: 'lab_manager', department: '', created_at: '', image_url: '' },
      loading: false,
      signIn: vi.fn(),
      resetPassword: vi.fn(),
      resendConfirmation: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LabManager />
      </BrowserRouter>
    );

    expect(screen.getByText(/lab manager dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
