import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';
import './styles/global.css';

// vite-react-ssg drives both the static prerender (Node) and client hydration
// from this single entry, using the shared `routes` table so the two can't
// diverge.
export const createRoot = ViteReactSSG({ routes });
