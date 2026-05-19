// Звуковая система Темнодушного Лета (клиентская).
//
// Музыка и звуки лежат в /public/audio/. Файлов может не быть — всё тихо
// падает в catch, ошибок нет. Состояние вкл/выкл хранится в localStorage.
//
// Использование:
//   import { playSfx } from "@/lib/sound";
//   playSfx("coin");

const KEY_MUSIC = "ds_music_on";
const KEY_SFX = "ds_sfx_on";

// Звуки событий — короткие клипы. Все файлы кладём в /public/audio/.
export const SFX: Record<string, string> = {
  click: "/audio/click.mp3",          // клик/кнопка
  move: "/audio/move.mp3",            // переход на локацию
  roll: "/audio/roll.mp3",            // ролл игры
  wheel: "/audio/wheel.mp3",          // крутка колеса предметов
  quest: "/audio/quest_complete.mp3", // выполнен квест
  complete: "/audio/complete.mp3",    // засчитана игра
  coin: "/audio/coin.mp3",            // покупка/Злато
  fail: "/audio/fail.mp3",            // дроп/провал/ловушка
  levelup: "/audio/levelup.mp3",      // новый уровень
};

// Фоновая музыка — плейлист. Файлы кладём в /public/audio/.
// Чтобы добавить трек: залей файл и впиши его сюда строкой.
export const MUSIC_TRACKS: string[] = [
  "/audio/track1.mp3",
];

// === Состояние ===
// Музыка по умолчанию ВЫКЛ (автоплей всё равно блокируется браузером).
// Звуки по умолчанию ВКЛ.
export function isMusicOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_MUSIC) === "on";
}

export function isSfxOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_SFX) !== "off";
}

export function setMusicOn(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_MUSIC, on ? "on" : "off");
}

export function setSfxOn(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_SFX, on ? "on" : "off");
}

// === Воспроизведение звука события ===
export function playSfx(key: keyof typeof SFX): void {
  if (typeof window === "undefined") return;
  if (!isSfxOn()) return;
  const src = SFX[key];
  if (!src) return;
  try {
    const audio = new Audio(src);
    audio.volume = 0.45;
    audio.play().catch(() => {
      // нет файла / автоплей заблокирован — молча игнорируем
    });
  } catch {
    // ignore
  }
}
