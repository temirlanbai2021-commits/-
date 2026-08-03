import type { FighterId } from '../game/catalog';
import { fighters, getFighter, rarities } from '../game/catalog';
import { supabase } from './supabase';

type AiResponse = {
  text?: string;
  error?: string;
};

export async function askGameCoach(fighterId: FighterId, question: string) {
  const fighter = getFighter(fighterId);
  const counter = getFighter(fighter.counteredBy);
  const roster = fighters.map((item) => (
    `${item.name}: ${item.role}, ${rarities[item.rarity].name}, `
    + `особенность — ${item.ability}, слабость — ${getFighter(item.counteredBy).name}`
  )).join('; ');
  const system = [
    'Ты дружелюбный игровой ИИ-тренер Братемир для подростков.',
    'Отвечай по-русски, кратко, понятно и безопасно.',
    'Отвечай только про игру Братемир: бойцов, контры, режимы, способности и тактику.',
    'На вопросы не про игру предложи спросить что-нибудь про Братемир.',
    'Не выдумывай кнопки или механики вне переданного контекста.',
    `Выбранный боец: ${fighter.name}.`,
    `Роль: ${fighter.role}. Редкость: ${rarities[fighter.rarity].name}.`,
    `Особенность: ${fighter.ability}. Контра бойца: ${counter.name}.`,
    `Полный список бойцов: ${roster}.`,
  ].join(' ');

  try {
    const request = supabase.functions.invoke<AiResponse>('ai', {
      body: { prompt: question, system },
    });
    const timeout = new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), 8000);
    });
    const result = await Promise.race([request, timeout]);
    if (!result) return getOfflineAdvice(fighterId, question);
    const { data, error } = result;
    if (!error && data?.text) return data.text;
  } catch {
    // Встроенный тренер продолжит работать, если облачный AI ещё не настроен.
  }
  return getOfflineAdvice(fighterId, question);
}

function getOfflineAdvice(fighterId: FighterId, question: string) {
  const selected = getFighter(fighterId);
  const normalizedQuestion = question.toLowerCase().replace('ё', 'е');
  const mentioned = fighters.find((item) => {
    const name = item.name.toLowerCase().replace('ё', 'е');
    const stem = name.length > 4 ? name.slice(0, -1) : name;
    return normalizedQuestion.includes(name) || normalizedQuestion.includes(stem);
  });
  const fighter = mentioned ?? selected;
  const counter = getFighter(fighter.counteredBy);
  const text = normalizedQuestion;

  if (text.includes('контр') || text.includes('слаб')) {
    return `${fighter.name} особенно уязвим против бойца ${counter.name}: его атаки наносят на 35% больше урона. Держи дистанцию, двигайся между выстрелами и не начинай бой без готового пути отхода.`;
  }
  if (text.includes('ульт') || text.includes('супер')) {
    return `Не трать ульту ${fighter.name} сразу после зарядки. Сначала вынуди врага приблизиться или потратить способность, а затем используй ульту вместе с основной атакой.`;
  }
  if (text.includes('команд') || text.includes('3') || text.includes('тим')) {
    return `${fighter.name} играет роль «${fighter.role}». Не отходи далеко от команды, помогай атаковать одну цель и прикрывай союзника с низким здоровьем.`;
  }
  if (text.includes('побед') || text.includes('тактик') || text.includes('играть')) {
    return `За ${fighter.name} постоянно двигайся и используй особенность: ${fighter.ability.toLowerCase()}. Сначала атакуй удобную цель, сохраняй дистанцию от ${counter.name} и заходи в бой вместе с командой.`;
  }
  if (/^(привет|здравствуй|здравствуйте|салам|hello)/.test(text)) {
    return `Привет! Я ИИ-помощник Братемир. Можешь спросить меня об игре, бойцах или попросить помочь с идеей.`;
  }
  if (text.includes('кто ты') || text.includes('что ты умеешь')) {
    return 'Я ИИ-помощник Братемир. Помогаю с тактикой игры и отвечаю на общие вопросы, когда облачный AI подключён.';
  }
  const mentionsGame = Boolean(mentioned)
    || ['игр', 'боец', 'бойц', 'бой', 'режим', 'арен', 'кубк', 'братемир']
      .some((word) => text.includes(word));
  if (mentionsGame) {
    return `${fighter.name} — ${fighter.role.toLowerCase()}. Используй его сильную сторону: ${fighter.ability.toLowerCase()}. Опасайся бойца ${counter.name} и атакуй после того, как противник промахнулся.`;
  }
  return 'Я отвечаю только про игру Братемир. Спроси меня о бойцах, контрах, режимах или тактике.';
}
