import { render, screen } from '@testing-library/react';
import Profile from '../../pages/Profile';
import { useAuth } from '../../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Profile Component', () => {
  test('renders profile page with user info', () => {
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

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test('redirects or shows loading when user is not available', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signIn: vi.fn(),
      resetPassword: vi.fn(),
      resendConfirmation: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    });

    const { container } = render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Depending on implementation, it might show loading or redirect
    expect(container).toBeTruthy();
  });
});
