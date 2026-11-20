import './ExperienceSwitcher.css';

export type Experience = 'vibe' | 'dashboard';

type Props = {
  active: Experience;
  onChange: (experience: Experience) => void;
};

export function ExperienceSwitcher({ active, onChange }: Props) {
  return (
    <nav className="experience-switcher" aria-label="OCEANICOS views">
      <button
        id="experience-mode-vibe"
        type="button"
        aria-current={active === 'vibe' ? 'page' : undefined}
        data-active={active === 'vibe'}
        onClick={() => onChange('vibe')}
      >
        Vibe OS
      </button>
      <button
        id="experience-mode-dashboard"
        type="button"
        aria-current={active === 'dashboard' ? 'page' : undefined}
        data-active={active === 'dashboard'}
        onClick={() => onChange('dashboard')}
      >
        Full system dashboard
      </button>
    </nav>
  );
}
