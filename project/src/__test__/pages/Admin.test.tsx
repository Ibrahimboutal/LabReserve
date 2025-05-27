import { render, screen } from '@testing-library/react';
import Admin from '../../pages/Admin';
import { useAuth } from '../../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';
import { vi, type Mock } from 'vitest';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
const mockedUseAuth = useAuth as Mock;

describe('Admin Component', () => {
  test('redirects non-admin users', () => {
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
        <Admin />
      </BrowserRouter>
    );

    // Since non-admin users are redirected, the component should render nothing or redirect component
    expect(container.innerHTML).toBe('');
  });

  test('renders admin dashboard for admin user', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: 'admin1', email: 'admin@example.com', role: 'admin', department: '', created_at: '', image_url: '' },
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
        <Admin />
      </BrowserRouter>
    );

    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
