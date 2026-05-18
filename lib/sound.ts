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

// Звуки событий — короткие клипы. Положи файлы в /public/audio/sfx/.
export const SFX: Record<string, string> = {
  click: "/audio/sfx/click.mp3",        // клик/кнопка
  move: "/audio/sfx/move.mp3",          // переход на локацию
  roll: "/audio/sfx/roll.mp3",          // ролл игры
  wheel: "/audio/sfx/wheel.mp3",        // крутка колеса предметов
  quest: "/audio/sfx/quest_complete.mp3", // выполнен квест
  complete: "/audio/sfx/complete.mp3",  // засчитана игра
  coin: "/audio/sfx/coin.mp3",          // покупка/Злато
  fail: "/audio/sfx/fail.mp3",          // дроп/провал/ловушка
  levelup: "/audio/sfx/levelup.mp3",    // новый уровень
};

// Фоновая музыка — плейлист. Положи файлы в /public/audio/music/.
export const MUSIC_TRACKS: string[] = [
  "/audio/music/track1.mp3",
  "/audio/music/track2.mp3",
  "/audio/music/track3.mp3",
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
