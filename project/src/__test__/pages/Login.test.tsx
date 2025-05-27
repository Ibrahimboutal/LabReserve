import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a mock for navigate function
const mockedNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock useAuth hook
const signInMock = vi.fn();
const resetPasswordMock = vi.fn();
const resendConfirmationMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: signInMock,
    resetPassword: resetPasswordMock,
    resendConfirmation: resendConfirmationMock,
    signUp: vi.fn(),
    signOut: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    signInMock.mockReset();
    resetPasswordMock.mockReset();
    resendConfirmationMock.mockReset();

    mockedNavigate.mockClear();
    vi.clearAllMocks();
  });

  test('successful sign in calls signIn and navigates', async () => {
    signInMock.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));


    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  test('shows error on sign in failure', async () => {
    const errorMessage = 'Invalid credentials';
    signInMock.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
      });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  }
  );
  test('calls reset password', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open reset password dialog
    fireEvent.click(screen.getByText(/forgot password\?/i));

    // Get the actual input inside the TextField
    const resetEmailInput = screen.getByTestId('reset-password-email').querySelector('input');
    
    // Fill email in dialog
    fireEvent.change(resetEmailInput!, {
      target: { value: 'test@example.com' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith('test@example.com');
    });

    expect(screen.getByText(/password reset instructions have been sent to your email/i)).toBeInTheDocument();
  });

  test('calls resend confirmation', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Open resend confirmation dialog
    fireEvent.click(screen.getByText(/resend confirmation/i));

    // Get the actual input inside the TextField
    const resendEmailInput = screen.getByTestId('resend-confirmation-email').querySelector('input');

    // Fill email in dialog
    fireEvent.change(resendEmailInput!, {
      target: { value: 'test@example.com' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /resend confirmation/i }));

    await waitFor(() => {
      expect(resendConfirmationMock).toHaveBeenCalledWith('test@example.com');
    });

    expect(screen.getByText(/confirmation email has been resent/i)).toBeInTheDocument();
  });

});

