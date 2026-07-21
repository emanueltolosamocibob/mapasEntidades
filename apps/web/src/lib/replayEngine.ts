// Motor de reproducción de partidas (MAP-27). Lógica pura, sin UI:
// consume el historial crudo de "position_history" (MAP-25) y expone
// un reloj virtual + cálculo de posición interpolada en cualquier
// instante. La UI (MAP-29) es la que decide cómo mostrar esto.

import { latLng } from "leaflet";

export type PositionHistoryRow = {
  session_id: string;
  entity_id: string;
  nickname: string;
  role: string;
  team_id: string | null;
  team_name: string | null;
  team_color: string | null;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  recorded_at: string;
};

// Mismo shape que PlayerPosition (usePositions.ts) más metadata de
// equipo, para que MapView.tsx reciba exactamente lo que ya sabe
// renderizar en vivo, sin distinguir "en vivo" de "replay".
export type ReplayPosition = {
  entityId: string;
  nickname: string;
  role: string;
  lat: number;
  lng: number;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
};

type TrackPoint = { t: number; lat: number; lng: number };
type EntityMeta = {
  nickname: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
};

export type ReplayTracks = {
  tracksByEntity: Map<string, TrackPoint[]>;
  metaByEntity: Map<string, EntityMeta>;
  startTime: number;
  endTime: number;
};

// El "role" y el equipo se toman de la fila más reciente de cada
// entidad: la vista no guarda su valor histórico al momento de cada
// posición, así que un cambio de rol/equipo a mitad de partida no se
// refleja retroactivamente en el replay. Simplificación aceptada.
export function buildReplayTracks(rows: PositionHistoryRow[]): ReplayTracks {
  const tracksByEntity = new Map<string, TrackPoint[]>();
  const metaByEntity = new Map<string, EntityMeta>();

  for (const row of rows) {
    const t = new Date(row.recorded_at).getTime();
    const track = tracksByEntity.get(row.entity_id) ?? [];
    track.push({ t, lat: row.lat, lng: row.lng });
    tracksByEntity.set(row.entity_id, track);
    metaByEntity.set(row.entity_id, {
      nickname: row.nickname,
      role: row.role,
      teamId: row.team_id,
      teamName: row.team_name,
      teamColor: row.team_color,
    });
  }

  let startTime = Infinity;
  let endTime = -Infinity;
  for (const track of tracksByEntity.values()) {
    track.sort((a, b) => a.t - b.t);
    startTime = Math.min(startTime, track[0].t);
    endTime = Math.max(endTime, track[track.length - 1].t);
  }
  if (tracksByEntity.size === 0) {
    startTime = 0;
    endTime = 0;
  }

  return { tracksByEntity, metaByEntity, startTime, endTime };
}

export type EntityMatchStats = {
  nickname: string;
  teamName: string | null;
  teamColor: string | null;
  durationMs: number;
  distanceM: number;
};

// Resumen de partida (MAP-42): duración y distancia recorrida por
// entidad, a partir de los mismos tracks que ya arma el replay —
// mismo cálculo de distancia (latLng().distanceTo(), gran círculo)
// que pairwiseDistances en MapView.tsx.
export function computeMatchStats(tracks: ReplayTracks): Map<string, EntityMatchStats> {
  const stats = new Map<string, EntityMatchStats>();

  for (const [entityId, track] of tracks.tracksByEntity) {
    const meta = tracks.metaByEntity.get(entityId)!;
    const durationMs = track.length > 0 ? track[track.length - 1].t - track[0].t : 0;

    let distanceM = 0;
    for (let i = 1; i < track.length; i++) {
      distanceM += latLng(track[i - 1].lat, track[i - 1].lng).distanceTo(
        latLng(track[i].lat, track[i].lng)
      );
    }

    stats.set(entityId, {
      nickname: meta.nickname,
      teamName: meta.teamName,
      teamColor: meta.teamColor,
      durationMs,
      distanceM,
    });
  }

  return stats;
}

function interpolate(track: TrackPoint[], t: number): { lat: number; lng: number } | null {
  if (t < track[0].t) return null; // todavía no se unió / no envió su primera posición
  if (t >= track[track.length - 1].t) {
    const last = track[track.length - 1];
    return { lat: last.lat, lng: last.lng };
  }

  let lo = 0;
  let hi = track.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid].t <= t) lo = mid;
    else hi = mid;
  }

  const a = track[lo];
  const b = track[hi];
  const ratio = (t - a.t) / (b.t - a.t);
  return { lat: a.lat + (b.lat - a.lat) * ratio, lng: a.lng + (b.lng - a.lng) * ratio };
}

export function getPositionsAtTime(tracks: ReplayTracks, t: number): ReplayPosition[] {
  const result: ReplayPosition[] = [];
  for (const [entityId, track] of tracks.tracksByEntity) {
    const point = interpolate(track, t);
    if (!point) continue;
    const meta = tracks.metaByEntity.get(entityId)!;
    result.push({
      entityId,
      nickname: meta.nickname,
      role: meta.role,
      lat: point.lat,
      lng: point.lng,
      teamId: meta.teamId,
      teamName: meta.teamName,
      teamColor: meta.teamColor,
    });
  }
  return result;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Reloj virtual: avanza "currentTime" con requestAnimationFrame mientras
// está en play, y notifica cada frame vía onTick. No sabe nada de
// posiciones ni de mapas — la UI combina esto con getPositionsAtTime.
export class ReplayClock {
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly onTick: (time: number) => void;
  private time: number;
  private speed = 1;
  private playing = false;
  private rafId: number | null = null;
  private lastFrameMs: number | null = null;

  constructor(startTime: number, endTime: number, onTick: (time: number) => void) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.onTick = onTick;
    this.time = startTime;
  }

  get currentTime() {
    return this.time;
  }

  get isPlaying() {
    return this.playing;
  }

  seek(t: number) {
    this.time = clamp(t, this.startTime, this.endTime);
    this.onTick(this.time);
  }

  setSpeed(multiplier: number) {
    this.speed = multiplier;
  }

  play() {
    if (this.playing || this.time >= this.endTime) return;
    this.playing = true;
    this.lastFrameMs = null;
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause() {
    this.playing = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy() {
    this.pause();
  }

  private tick = (nowMs: number) => {
    if (!this.playing) return;

    if (this.lastFrameMs !== null) {
      const deltaMs = (nowMs - this.lastFrameMs) * this.speed;
      this.time = clamp(this.time + deltaMs, this.startTime, this.endTime);
      this.onTick(this.time);

      if (this.time >= this.endTime) {
        this.pause();
        return;
      }
    }

    this.lastFrameMs = nowMs;
    this.rafId = requestAnimationFrame(this.tick);
  };
}
