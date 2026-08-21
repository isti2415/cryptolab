/**
 * A class error boundary, because React still offers no hook equivalent.
 *
 * The engines cannot throw by contract (`run` returns a `ValidationError`
 * instead, see `core/types.ts`), so this exists for the other half of the app:
 * the twenty-four Visualizers, which are ordinary React components rendering
 * algorithm-specific state and are perfectly capable of indexing off the end of
 * an array. Without a boundary one bad step blanks the whole document.
 *
 * Scoped deliberately: wrapping the walkthrough alone means a broken visualizer
 * costs the learner the animation, not the playground, the code panel and the
 * prose as well.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown in place of the subtree. Keep it specific to what was lost. */
  fallback: ReactNode;
}

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No error-reporting service is wired up, so the console is the only place
    // this can go. Keep it: a silent boundary is worse than none, because the
    // bug then never surfaces during development either.
    console.error('CryptoLab: render failed inside an error boundary.', error, info);
  }

  /**
   * Route changes remount via `key` on the page, but a param change does not,
   * so a boundary tripped by one bad key would otherwise stay tripped forever.
   */
  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.children !== this.props.children) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
