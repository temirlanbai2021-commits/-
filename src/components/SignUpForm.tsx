import { FormEvent, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '../lib/supabase';

type FormStatus = {
  type: 'error' | 'success';
  text: string;
};

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<'email' | 'google' | null>(null);

  async function handleGoogleSignUp() {
    setStatus(null);
    setLoadingMethod('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/game` },
      });
      if (!error) return;
      setStatus({ type: 'error', text: `Не удалось войти через Google: ${error.message}` });
    } catch {
      setStatus({ type: 'error', text: 'Нет связи с Google. Попробуй ещё раз.' });
    } finally {
      setLoadingMethod(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (password !== passwordRepeat) {
      setStatus({ type: 'error', text: 'Пароли не совпадают.' });
      return;
    }

    setLoadingMethod('email');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (error) {
        setStatus({ type: 'error', text: error.message });
        return;
      }

      const text = data.session
        ? 'Аккаунт создан. Теперь можно играть!'
        : 'Аккаунт создан. Проверь почту и подтверди email.';
      setStatus({ type: 'success', text });
    } catch {
      setStatus({ type: 'error', text: 'Нет связи с сервером. Попробуй ещё раз.' });
    } finally {
      setLoadingMethod(null);
    }
  }

  return (
    <section className="signup-card">
      <div className="signup-card__heading">
        <span>ARENA SHIFT</span>
        <h1>Создай аккаунт</h1>
        <p>Сохраняй результаты и возвращайся в игру в любое время.</p>
      </div>
      <button className="google-signup" type="button" onClick={handleGoogleSignUp}
        disabled={loadingMethod !== null}>
        <span aria-hidden="true">G</span>
        {loadingMethod === 'google' ? 'Открываем Google…' : 'Продолжить с Google'}
      </button>
      <div className="signup-divider"><span>или через email</span></div>
      <form className="signup-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
            placeholder="player@example.com" autoComplete="email" required />
        </label>
        <label>
          Пароль
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 6 символов" autoComplete="new-password" minLength={6} required />
        </label>
        <label>
          Повтори пароль
          <input type="password" value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            placeholder="Ещё раз тот же пароль" autoComplete="new-password" minLength={6} required />
        </label>
        {status && (
          <p className={`signup-status signup-status--${status.type}`} role="status">{status.text}</p>
        )}
        <button type="submit" disabled={loadingMethod !== null}>
          {loadingMethod === 'email' ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </button>
      </form>
      <Link href="/" className="signup-card__back">← Вернуться на главную</Link>
    </section>
  );
}
