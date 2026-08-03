import { Link } from 'wouter';

export function HomePage() {
  return (
    <main className="home">
      <div className="home__badge">КОМАНДНАЯ АРЕНА</div>
      <h1>БРАТЕ<br /><span>МИР</span></h1>
      <p>Выбирай бойца, собирай скины и оружие, прокачивай силу и захватывай территорию соперника.</p>
      <div className="home__actions">
        <Link href="/game" className="play-button">ИГРАТЬ</Link>
        <Link href="/register" className="register-link">СОЗДАТЬ АККАУНТ</Link>
      </div>
    </main>
  );
}
