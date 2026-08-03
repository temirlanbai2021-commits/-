type Props = {
  trophies: number;
};

const leaders = [
  { name: 'ALMA', trophies: 1840 },
  { name: 'Rex_07', trophies: 1560 },
  { name: 'GhostKZ', trophies: 1320 },
];

export function Leaderboard({ trophies }: Props) {
  const rows = [...leaders, { name: 'ВЫ', trophies }]
    .sort((first, second) => second.trophies - first.trophies)
    .slice(0, 4);

  return (
    <section className="leaderboard" aria-label="Таблица лидеров">
      <h2>🏆 ЛИДЕРЫ</h2>
      <ol>
        {rows.map((player, index) => (
          <li className={player.name === 'ВЫ' ? 'leaderboard__player' : ''} key={player.name}>
            <b>{index + 1}</b>
            <span>{player.name}</span>
            <strong>{player.trophies}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
