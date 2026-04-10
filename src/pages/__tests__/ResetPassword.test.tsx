import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });

  it('shows loading or form state', () => {
    const { container } = renderPage();
    // Should show either loading spinner or form
    const hasContent = container.querySelector('.container');
    expect(hasContent).toBeTruthy();
  });

  it('shows form when hash has type=recovery', () => {
    window.location.hash = '#type=recovery';
    const { container } = renderPage();
    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).toBeTruthy();
    window.location.hash = '';
  });
});
