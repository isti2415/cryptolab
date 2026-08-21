// @vitest-environment jsdom
/**
 * The tab pattern here was previously `role="tab"` with no roving focus, no
 * arrow keys and no matching panel — an ARIA promise the component did not
 * keep. These assertions are what stop it regressing to that.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CodePanel } from './CodePanel';
import type { CodeSample } from '@/core/types';

const samples: CodeSample[] = [
  { lang: 'python', label: 'Python', source: 'def f():\n    return 1', path: 'a/b.py' },
  { lang: 'typescript', label: 'TypeScript', source: 'export const f = () => 1;', path: 'a/b.ts' },
];

describe('CodePanel', () => {
  it('exposes a complete tab pattern', () => {
    render(<CodePanel samples={samples} />);
    const tabs = screen.getAllByRole('tab');
    const panel = screen.getByRole('tabpanel');

    expect(tabs).toHaveLength(2);
    // Every tab must point at a panel that exists, and the panel must name the
    // tab that selected it.
    for (const tab of tabs) {
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    }
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
  });

  it('uses a roving tabindex, so the tablist is one tab stop', () => {
    render(<CodePanel samples={samples} />);
    const [first, second] = screen.getAllByRole('tab');
    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);
  });

  it('moves between tabs with the arrow keys', async () => {
    render(<CodePanel samples={samples} />);
    const [first, second] = screen.getAllByRole('tab');
    first.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toContain('export const f');
  });

  it('wraps around at the ends', async () => {
    render(<CodePanel samples={samples} />);
    const [first, second] = screen.getAllByRole('tab');
    first.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(second);
  });

  it('keeps the scrollable listing reachable by keyboard', () => {
    render(<CodePanel samples={samples} />);
    expect(screen.getByRole('tabpanel').tabIndex).toBe(0);
  });

  it('shows the selected language and its path', async () => {
    render(<CodePanel samples={samples} />);
    expect(screen.getByText('a/b.py')).toBeDefined();
    await userEvent.click(screen.getByRole('tab', { name: 'TypeScript' }));
    expect(screen.getByText('a/b.ts')).toBeDefined();
  });
});
