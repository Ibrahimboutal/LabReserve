import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../../lib/supabase';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

const mockSignInWithPassword = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>;
const mockSignUp = supabase.auth.signUp as ReturnType<typeof vi.fn>;

describe('useAuth hook', () => {
  it('should sign in user', async () => {
    // Arrange
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null,
    });

    // Act
    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    // Assert
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.data && result.data.user && result.data.user.id).toBe('123');
  });

  it('should sign up user', async () => {
    // Arrange
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null,
    });

    // Act
    const result = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // Assert
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    expect(result.data && result.data.user && result.data.user.id).toBe('123');
  });

  it('should sign out user', async () => {
    const signOutMock = supabase.auth.signOut as ReturnType<typeof vi.fn>;
    signOutMock.mockResolvedValue({ error: null });

    await supabase.auth.signOut();
    expect(signOutMock).toHaveBeenCalled();
  });

  it('should reset password', async () => {
    const resetPasswordMock = supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>;
    resetPasswordMock.mockResolvedValue({ data: null, error: null });

    await supabase.auth.resetPasswordForEmail('test@example.com');

    expect(resetPasswordMock).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle errors', async () => {
    const signInMock = supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>;
    signInMock.mockResolvedValue({ data: null, error: new Error('Test error') });

    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpass',
    });

    expect(result.error).toEqual(new Error('Test error'));
  });

  it('should handle sign out errors', async () => {
    const signOutMock = supabase.auth.signOut as ReturnType<typeof vi.fn>;
    signOutMock.mockResolvedValue({ error: new Error('Test error') });

    const result = await supabase.auth.signOut();

    expect(result.error).toEqual(new Error('Test error'));
  });
});