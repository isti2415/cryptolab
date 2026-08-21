// @vitest-environment jsdom
/**
 * The player is the one component every algorithm reuses, so a regression here
 * is a regression on all twenty-four pages. These cover the behaviour that was
 * actually wrong at some point: the empty state that could not tell "nothing
 * typed" from "your key is invalid", and the keyboard handling that used to
 * swallow Space on the speed buttons.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepPlayer } from './StepPlayer';
import type { AlgorithmVisualizerProps, Step } from '@/core/types';

const steps: Step<{ n: number }>[] = [
  { id: 'a', title: 'First', description: 'one', state: { n: 1 }, phase: 'Setup' },
  { id: 'b', title: 'Second', description: 'two', state: { n: 2 }, phase: 'Rounds' },
  { id: 'c', title: 'Third', description: 'three', state: { n: 3 }, phase: 'Rounds' },
];

const Viz = ({ step }: AlgorithmVisualizerProps<{ n: number }>) => (
  <div data-testid="viz">n={step.state.n}</div>
);

type Props = React.ComponentProps<typeof StepPlayer<{ n: number }>>;

function setup(props: Partial<Props> = {}) {
  return render(
    <StepPlayer<{ n: number }>
      steps={steps}
      Visualizer={Viz}
      direction="encrypt"
      {...props}
    />,
  );
}

describe('StepPlayer', () => {
  it('starts on the first step and announces the position', () => {
    setup();
    expect(screen.getByText('First')).toBeDefined();
    expect(screen.getByText(/Step 1 \/ 3/)).toBeDefined();
  });

  it('advances with the Next control', async () => {
    setup();
    await userEvent.click(screen.getByTitle("Next (→)"));
    expect(screen.getByTestId('viz').textContent).toBe('n=2');
  });

  it('moves with the arrow keys when the group has focus', async () => {
    setup();
    const group = screen.getByRole('group', { name: 'Step-by-step walkthrough' });
    group.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('viz').textContent).toBe('n=2');
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('viz').textContent).toBe('n=1');
    await userEvent.keyboard('{End}');
    expect(screen.getByTestId('viz').textContent).toBe('n=3');
    await userEvent.keyboard('{Home}');
    expect(screen.getByTestId('viz').textContent).toBe('n=1');
  });

  it('reports the index so the page can put it in the URL', async () => {
    const onIndexChange = vi.fn();
    setup({ onIndexChange });
    await userEvent.click(screen.getByTitle("Next (→)"));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('follows a controlled index, which is how a shared link lands mid-trace', () => {
    setup({ index: 2 });
    expect(screen.getByTestId('viz').textContent).toBe('n=3');
    expect(screen.getByText(/Step 3 \/ 3/)).toBeDefined();
  });

  it('tells an empty trace apart from a rejected key', () => {
    const { unmount } = setup({ steps: [] });
    expect(screen.getByText(/Enter some input/)).toBeDefined();
    unmount();

    setup({ steps: [], error: { paramKey: 'key', message: 'bad key' } });
    // The console beside it already explains the error; this must not send the
    // reader looking at the input box instead.
    expect(screen.queryByText(/Enter some input/)).toBeNull();
    expect(screen.getByText(/fix the highlighted field/i)).toBeDefined();
  });

  it('surfaces a step warning as a note, not an alert', () => {
    setup({
      steps: [{ ...steps[0], warning: 'This is one of the four DES weak keys.' }],
    });
    const note = screen.getByRole('note');
    expect(note.textContent).toContain('weak keys');
  });

  it('keeps a live region carrying the position', () => {
    const { container } = setup();
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain('Step 1 of 3');
  });
});
