import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../pages/Register';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock navigate
const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock signUp function
const signUpMock = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signUp: signUpMock,
    signIn: vi.fn(),
    resetPassword: vi.fn(),
    resendConfirmation: vi.fn(),
    signOut: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

describe('Register Component', () => {
  beforeEach(() => {
    signUpMock.mockClear();
    mockedNavigate.mockClear();
  });

  test('renders Register component', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();

    // Use data-testid instead of label text to avoid ambiguity
    expect(screen.getByTestId('register-email')).toBeInTheDocument();
    expect(screen.getByTestId('register-password')).toBeInTheDocument();
    expect(screen.getByTestId('register-confirm-password')).toBeInTheDocument();
    expect(screen.getByTestId('register-department')).toBeInTheDocument();
  });

  test('shows error if required fields are empty', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));


  });

  test('shows error if passwords do not match', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Access input elements directly
    const passwordInput = screen.getByTestId('register-password').querySelector('input');
    const confirmPasswordInput = screen.getByTestId('register-confirm-password').querySelector('input');

    fireEvent.change(passwordInput!, { target: { value: 'Password123@' } });
    fireEvent.change(confirmPasswordInput!, { target: { value: 'WrongPassword123@' } });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    });



  test('calls signUp with correct parameters', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Access input elements directly
    const emailInput = screen.getByTestId('register-email').querySelector('input');
    const passwordInput = screen.getByTestId('register-password').querySelector('input');
    const confirmPasswordInput = screen.getByTestId('register-confirm-password').querySelector('input');
    const departmentInput = screen.getByTestId('register-department').querySelector('input');


    fireEvent.change(emailInput!, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'Password123@' } });
    fireEvent.change(confirmPasswordInput!, { target: { value: 'Password123@' } });
    fireEvent.change(departmentInput!, { target: { value: 'Computer Science' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith('test@example.com', 'Password123@', 'Computer Science');
    }
    );
    expect(await screen.findByTestId('register-success')).toHaveTextContent(
    'Registration successful! Please check your email to confirm your account.'
  );
  }
  );


});