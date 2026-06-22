import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageNotificationBadge } from '../message-notification-badge';

// Mock the cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

describe('MessageNotificationBadge', () => {
  it('should not render when count is 0 and showZero is false', () => {
    const { container } = render(<MessageNotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when count is 0 and showZero is true', () => {
    render(<MessageNotificationBadge count={0} showZero />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render dot indicator when collapsed and has messages', () => {
    render(<MessageNotificationBadge count={5} isCollapsed />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', '5 unread messages');
  });

  it('should render compact badge when variant is compact', () => {
    render(<MessageNotificationBadge count={3} variant="compact" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('should render pill badge when variant is default and not collapsed', () => {
    render(<MessageNotificationBadge count={7} variant="default" />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('7');
  });

  it('should display 99+ when count exceeds maxCount', () => {
    render(<MessageNotificationBadge count={150} maxCount={99} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('99+');
  });

  it('should handle keyboard navigation', () => {
    const onKeyDown = vi.fn();
    render(
      <MessageNotificationBadge 
        count={5} 
        variant="compact"
      />
    );
    
    const badge = screen.getByRole('status');
    fireEvent.keyDown(badge, { key: 'Enter' });
    fireEvent.keyDown(badge, { key: ' ' });
    
    // Should be focusable
    expect(badge).toHaveAttribute('tabIndex', '0');
  });

  it('should have proper accessibility attributes', () => {
    render(
      <MessageNotificationBadge 
        count={3} 
        ariaLabel="Custom aria label"
      />
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Custom aria label');
    expect(badge).toHaveAttribute('aria-live', 'polite');
    expect(badge).toHaveAttribute('aria-atomic', 'true');
    expect(badge).toHaveAttribute('title', '3 unread messages');
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(<MessageNotificationBadge count={1} size="sm" />);
    let badge = screen.getByRole('status');
    expect(badge.className).toContain('text-xs');

    rerender(<MessageNotificationBadge count={1} size="lg" />);
    badge = screen.getByRole('status');
    expect(badge.className).toContain('text-sm');
  });

  it('should handle singular and plural message text correctly', () => {
    const { rerender } = render(<MessageNotificationBadge count={1} />);
    let badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('title', '1 unread message');

    rerender(<MessageNotificationBadge count={2} />);
    badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('title', '2 unread messages');
  });

  it('should apply custom className', () => {
    render(<MessageNotificationBadge count={1} className="custom-class" />);
    const badge = screen.getByRole('status');
    expect(badge.className).toContain('custom-class');
  });
});
