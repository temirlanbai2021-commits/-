import { battleModes, BattleMode } from '../game/battleMode';

type Props = {
  value: BattleMode;
  onChange: (mode: BattleMode) => void;
};

export function BattleModePicker({ value, onChange }: Props) {
  return (
    <div className="battle-mode-picker" aria-label="Режим боя">
      {battleModes.map((mode) => (
        <button
          type="button"
          className={mode.id === value ? 'selected' : ''}
          aria-pressed={mode.id === value}
          key={mode.id}
          onClick={() => onChange(mode.id)}
        >
          <strong>{mode.title}</strong>
          <small>{mode.subtitle}</small>
        </button>
      ))}
    </div>
  );
}
