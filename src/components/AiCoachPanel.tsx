import { FormEvent, useState } from 'react';
import type { FighterId } from '../game/catalog';
import { getFighter } from '../game/catalog';
import { askGameCoach } from '../lib/gameAi';

type Props = {
  fighterId: FighterId;
  onClose: () => void;
};

export function AiCoachPanel({ fighterId, onClose }: Props) {
  const fighter = getFighter(fighterId);
  const [question, setQuestion] = useState(`Как лучше играть за ${fighter.name}?`);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getAnswer = async (nextQuestion: string) => {
    if (!nextQuestion.trim() || isLoading) return;
    setIsLoading(true);
    setAnswer('');
    try {
      setAnswer(await askGameCoach(fighterId, nextQuestion.trim()));
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'Не получилось получить ответ.');
    } finally {
      setIsLoading(false);
    }
  };

  const ask = (event: FormEvent) => {
    event.preventDefault();
    void getAnswer(question);
  };

  const useQuickQuestion = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    void getAnswer(nextQuestion);
  };

  return (
    <div className="section-overlay" role="dialog" aria-modal="true">
      <section className="section-panel ai-coach">
        <header>
          <div><small>ПЕРСОНАЛЬНЫЙ ПОМОЩНИК</small><h2>🤖 ИИ-ТРЕНЕР</h2></div>
          <button type="button" onClick={onClose} aria-label="Закрыть">×</button>
        </header>
        <p>Спроси про бойцов, контры, режимы или тактику. Сейчас выбран {fighter.name}.</p>
        <div className="ai-coach__quick">
          {['Как играть этим бойцом?', 'Кто моя контра?', 'Как использовать ульту?'].map((item) => (
            <button type="button" key={item} disabled={isLoading}
              onClick={() => useQuickQuestion(item)}>{item}</button>
          ))}
        </div>
        <form onSubmit={ask}>
          <textarea value={question} maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Напиши вопрос про игру…" />
          <button type="submit" disabled={isLoading || !question.trim()}>
            {isLoading ? 'ДУМАЮ…' : 'СПРОСИТЬ ИИ'}
          </button>
        </form>
        {answer && <div className="ai-coach__answer">{answer}</div>}
        <small>ИИ может ошибаться — проверяй советы в бою.</small>
      </section>
    </div>
  );
}
