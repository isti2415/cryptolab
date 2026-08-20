import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { Icon, type IconName } from './Icon';
import styles from './ThemeToggle.module.css';

const LABEL: Record<ThemePreference, string> = {
  system: 'Theme: follow system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

const ICON: Record<ThemePreference, IconName> = {
  system: 'system',
  light: 'sun',
  dark: 'moon',
};

/**
 * Tri-state theme control: system → light → dark. "System" is a real option
 * rather than an implicit default, so a visitor whose OS is dark can still pin
 * the site light without fighting their OS setting.
 */
export function ThemeToggle() {
  const { preference, cycleTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={cycleTheme}
      title={LABEL[preference]}
      aria-label={LABEL[preference]}
    >
      <Icon name={ICON[preference]} size={16} />
    </button>
  );
}
