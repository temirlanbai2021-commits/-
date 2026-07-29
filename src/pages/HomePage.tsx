import { Link } from 'wouter';

export function HomePage() {
  return (
    <main className="home">
      <div className="home__badge">Тактика встречает аркаду</div>
      <h1>БРАС<br /><span>ТЭНД</span></h1>
      <p>
        Выбери бойца и оружие, прокачивай характеристики за рубины
        и сражайся на гибридной арене в режиме «каждый сам за себя».
      </p>
      <div className="home__actions">
        <Link href="/game" className="play-button">Играть сейчас</Link>
        <Link href="/register" className="register-link">Создать аккаунт</Link>
      </div>
      <div className="home__controls">
        <span>WASD — движение</span>
        <span>Мышь — прицел</span>
        <span>V — сменить вид</span>
      </div>
    </main>
  );
}
