import { render, screen } from '@testing-library/react';
import App from '../App';
import { Provider } from 'react-redux';
import { store } from '../store';

// Import AuthProvider so we can keep it unmocked or re-export it
import { AuthProvider } from '../hooks/useAuth';
import { vi } from 'vitest';

vi.mock('../hooks/useAuth', async (importActual) => {
  const actual = await importActual();
  
  return {
    ...(actual as object),
    useAuth: () => ({
      user: { id: 'user1', email: 'test@example.com', role: 'student', department: '', created_at: '', image_url: '' },
      loading: false,
      signIn: vi.fn(),
      resetPassword: vi.fn(),
      resendConfirmation: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    }),
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <AuthProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </AuthProvider>
    );
    screen.debug();
  });
});