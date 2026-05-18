"use client";

import { useEffect, useRef, useState } from "react";
import { Music, VolumeX, Volume2, Music2 } from "lucide-react";
import {
  MUSIC_TRACKS,
  isMusicOn,
  isSfxOn,
  setMusicOn,
  setSfxOn,
  playSfx,
} from "@/lib/sound";

// Плавающий контрол звука: музыка + звуковые эффекты.
// Висит в правом нижнем углу на всех страницах (вмонтирован в layout).
export default function SoundControl() {
  const [music, setMusic] = useState(false);
  const [sfx, setSfx] = useState(true);
  const [trackIdx, setTrackIdx] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Инициализация из localStorage (только на клиенте)
  useEffect(() => {
    setMusic(isMusicOn());
    setSfx(isSfxOn());
  }, []);

  // Управление воспроизведением музыки
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (music) {
      audio.volume = 0.3;
      audio.play().catch(() => {
        // автоплей заблокирован — запустим при первом клике по странице
        const resume = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", resume);
        };
        document.addEventListener("click", resume, { once: true });
      });
    } else {
      audio.pause();
    }
  }, [music, trackIdx]);

  function toggleMusic() {
    const next = !music;
    setMusic(next);
    setMusicOn(next);
  }

  function toggleSfx() {
    const next = !sfx;
    setSfx(next);
    setSfxOn(next);
    if (next) playSfx("click");
  }

  // Следующий трек по окончании текущего
  function nextTrack() {
    setTrackIdx((i) => (i + 1) % Math.max(1, MUSIC_TRACKS.length));
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={MUSIC_TRACKS[trackIdx]}
        onEnded={nextTrack}
        preload="none"
      />
      <div
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          zIndex: 50,
          display: "flex",
          gap: "0.4rem",
        }}
      >
        <SoundBtn
          on={music}
          onClick={toggleMusic}
          title={music ? "Музыка вкл" : "Музыка выкл"}
          iconOn={<Music size={16} />}
          iconOff={<Music2 size={16} />}
        />
        <SoundBtn
          on={sfx}
          onClick={toggleSfx}
          title={sfx ? "Звуки вкл" : "Звуки выкл"}
          iconOn={<Volume2 size={16} />}
          iconOff={<VolumeX size={16} />}
        />
      </div>
    </>
  );
}

function SoundBtn({
  on,
  onClick,
  title,
  iconOn,
  iconOff,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: "38px",
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-secondary)",
        border: `1px solid ${on ? "var(--color-gold)" : "var(--color-border)"}`,
        color: on ? "var(--color-gold)" : "var(--color-text-dim)",
        cursor: "pointer",
        borderRadius: "50%",
        boxShadow: on ? "0 0 12px rgba(212,165,116,0.3)" : "none",
      }}
    >
      {on ? iconOn : iconOff}
    </button>
  );
}
