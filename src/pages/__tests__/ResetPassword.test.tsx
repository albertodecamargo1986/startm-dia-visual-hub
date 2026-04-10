import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      updateUser: vi.fn(),
    },
  },
}));

import ResetPassword from '../ResetPassword';

const renderPage = () =>
  render(
    <HelmetProvider>
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    </HelmetProvider>
  );

describe('ResetPassword', () => {
  it('shows loading state initially', () => {
    renderPage();
    expect(screen.getByText(/validando link/i)).toBeInTheDocument();
  });

  it('shows invalid state after timeout', async () => {
    vi.useFakeTimers();
    renderPage();
    vi.advanceTimersByTime(3100);
    await waitFor(() => {
      expect(screen.getByText(/link inválido ou expirado/i)).toBeInTheDocument();
    });
    vi.useRealTimers();
  });

  it('shows form when hash has type=recovery', async () => {
    window.location.hash = '#type=recovery';
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nova senha/i)).toBeInTheDocument();
    });
    window.location.hash = '';
  });

  it('validates mismatched passwords', async () => {
    window.location.hash = '#type=recovery';
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nova senha')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Nova senha'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nova senha'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
    });
    window.location.hash = '';
  });

  it('validates short password', async () => {
    window.location.hash = '#type=recovery';
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nova senha')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Nova senha'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirmar nova senha'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
    });
    window.location.hash = '';
  });
});
