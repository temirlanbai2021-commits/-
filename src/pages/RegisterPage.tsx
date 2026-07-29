import { SignUpForm } from '../components/SignUpForm';
import { isSupabaseConfigured } from '../lib/supabase';

export function RegisterPage() {
  return (
    <main className="signup-page">
      {isSupabaseConfigured ? (
        <SignUpForm />
      ) : (
        <section className="signup-card">
          <h1>Подключи Supabase</h1>
          <p className="signup-status signup-status--error">
            Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файл .env.
          </p>
        </section>
      )}
    </main>
  );
}
