import { vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import AuthCallback from '../../pages/AuthCallback';
import { BrowserRouter } from 'react-router-dom';

// ✅ Hoist all variables used inside mocked modules
const { mockGetSession, mockNavigate } = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
    mockNavigate: vi.fn(),
  };
});

// ✅ Mock supabase.getSession
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// ✅ Mock useNavigate without removing BrowserRouter
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    
    useNavigate: () => mockNavigate,
  };
});

describe('AuthCallback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test('renders loading indicator', () => {
    const { getByRole } = render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    expect(getByRole('progressbar')).toBeInTheDocument();
  });

  test('redirects to dashboard if session exists', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: '123' } },
      error: null },
    });

    // Act
    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    // Assert
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('redirects to login if no session exists', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // Act
    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    // Assert
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});