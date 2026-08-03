import { battleModes, BattleMode } from '../game/battleMode';

type Props = {
  value: BattleMode;
  onChange: (mode: BattleMode) => void;
};

export function BattleModePicker({ value, onChange }: Props) {
  return (
    <div className="battle-mode-picker" aria-label="Выбор режима боя">
      {battleModes.map((mode) => (
        <button
          type="button"
          className={mode.id === value ? 'selected' : ''}
          aria-pressed={mode.id === value}
          style={{ '--mode-color': mode.color } as React.CSSProperties}
          key={mode.id}
          onClick={() => onChange(mode.id)}
          aria-label={`Выбрать режим ${mode.title}`}
        >
          <i>{mode.icon}</i>
          <span><strong>{mode.title}</strong><small>{mode.subtitle}</small></span>
          {mode.id === value && <b>✓</b>}
        </button>
      ))}
    </div>
  );
}
