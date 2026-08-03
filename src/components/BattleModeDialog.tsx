import { BattleModePicker } from './BattleModePicker';
import type { BattleMode } from '../game/battleMode';

type Props = {
  value: BattleMode;
  onSelect: (mode: BattleMode) => void;
  onClose: () => void;
};

export function BattleModeDialog({ value, onSelect, onClose }: Props) {
  return (
    <div className="section-overlay battle-mode-overlay" role="dialog" aria-modal="true"
      aria-labelledby="battle-mode-title">
      <section className="battle-mode-dialog">
        <header>
          <div><small>ШАГ 1 ИЗ 1</small><h2 id="battle-mode-title">Выбери режим боя</h2></div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <p>Нажми на режим — бой начнётся сразу.</p>
        <BattleModePicker value={value} onChange={onSelect} />
      </section>
    </div>
  );
}
