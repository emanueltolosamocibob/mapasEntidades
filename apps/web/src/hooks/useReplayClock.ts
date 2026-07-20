import { useEffect, useRef, useState } from "react";
import { ReplayClock } from "../lib/replayEngine";

export function useReplayClock(startTime: number, endTime: number) {
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const clockRef = useRef<ReplayClock | null>(null);

  useEffect(() => {
    const clock = new ReplayClock(startTime, endTime, setCurrentTime);
    clockRef.current = clock;
    setCurrentTime(startTime);
    setIsPlaying(false);
    return () => clock.destroy();
  }, [startTime, endTime]);

  // El clock se pausa solo al llegar al final (ver ReplayClock.tick) — sin
  // esto el botón de play/pause queda mostrando "pausar" aunque ya terminó.
  useEffect(() => {
    if (currentTime >= endTime) setIsPlaying(false);
  }, [currentTime, endTime]);

  function toggle() {
    if (isPlaying) {
      clockRef.current?.pause();
      setIsPlaying(false);
    } else {
      clockRef.current?.play();
      setIsPlaying(true);
    }
  }

  function seek(t: number) {
    clockRef.current?.seek(t);
  }

  function setSpeed(speed: number) {
    clockRef.current?.setSpeed(speed);
  }

  return { currentTime, isPlaying, toggle, seek, setSpeed };
}
