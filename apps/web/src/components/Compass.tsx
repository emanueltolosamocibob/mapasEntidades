import { useCallback, useEffect, useState } from "react";

const PX_PER_DEGREE = 4;

const CARDINALS: Record<number, string> = {
  0: "N",
  45: "NE",
  90: "E",
  135: "SE",
  180: "S",
  225: "SO",
  270: "O",
  315: "NO",
};

// Rango generoso (-180 a 540) para que siempre haya ticks cubriendo el ancho
// visible de la tira sin importar el heading actual, evitando huecos al
// acercarse a los bordes de 0°/360°.
const TICKS = Array.from({ length: (540 - -180) / 15 + 1 }, (_, i) => -180 + i * 15);

type PermissionState = "idle" | "needs-gesture" | "granted" | "unavailable";

// iOS 13+ expone requestPermission en el constructor, no en las instancias
// de evento -- no está en los tipos DOM estándar de TS.
type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type DeviceOrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("idle");

  const handleOrientation = useCallback((event: Event) => {
    const orientationEvent = event as DeviceOrientationEventWithCompass;
    // iOS: webkitCompassHeading ya es el heading real respecto al norte, no
    // hace falta invertirlo como con alpha.
    if (typeof orientationEvent.webkitCompassHeading === "number") {
      setHeading(orientationEvent.webkitCompassHeading);
      return;
    }
    // Resto de navegadores: alpha solo es heading real cuando el evento es
    // "absolute" (referenciado al norte); si no, es relativo a la
    // orientación arbitraria que tenía el dispositivo al arrancar.
    if (orientationEvent.alpha === null || !orientationEvent.absolute) return;
    setHeading((360 - orientationEvent.alpha) % 360);
  }, []);

  useEffect(() => {
    if (permissionState !== "granted") return;
    window.addEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionState, handleOrientation]);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") {
      setPermissionState("unavailable");
      return;
    }
    const DOE = DeviceOrientationEvent as DeviceOrientationEventIOS;
    // iOS 13+ exige un gesto explícito del usuario para pedir el permiso --
    // no se puede llamar a requestPermission() automáticamente al montar.
    setPermissionState(typeof DOE.requestPermission === "function" ? "needs-gesture" : "granted");
  }, []);

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as DeviceOrientationEventIOS;
    if (typeof DOE.requestPermission !== "function") {
      setPermissionState("granted");
      return;
    }
    try {
      const result = await DOE.requestPermission();
      setPermissionState(result === "granted" ? "granted" : "unavailable");
    } catch {
      setPermissionState("unavailable");
    }
  }, []);

  return { heading, permissionState, requestPermission };
}

function Compass() {
  const { heading, permissionState, requestPermission } = useCompassHeading();

  if (permissionState === "idle" || permissionState === "unavailable") return null;

  if (permissionState === "needs-gesture") {
    return (
      <button
        type="button"
        onClick={requestPermission}
        className="absolute bottom-10 left-1/2 z-[1000] -translate-x-1/2 border border-primary bg-background/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-primary hover:bg-primary/10"
      >
        ACTIVAR BRÚJULA
      </button>
    );
  }

  // Sin señal todavía (evento no disparó ni una vez): centra en N en vez de
  // no mostrar nada, se corrige solo apenas llega el primer evento.
  const offset = (heading ?? 0) * PX_PER_DEGREE;

  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2 z-[1000] h-9 w-64 -translate-x-1/2 overflow-hidden border border-primary bg-background/90 sm:w-96">
      <div
        className="absolute top-0 left-1/2 h-full"
        style={{ transform: `translateX(calc(-50% - ${offset}px))` }}
      >
        {TICKS.map((angle) => {
          const normalized = ((angle % 360) + 360) % 360;
          const label = CARDINALS[normalized];
          return (
            <div
              key={angle}
              className="absolute top-0 flex h-full flex-col items-center justify-center"
              style={{ left: `${angle * PX_PER_DEGREE}px`, transform: "translateX(-50%)" }}
            >
              {label ? (
                <span
                  className={`text-xs font-bold tracking-[0.1em] ${
                    normalized === 0 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {label}
                </span>
              ) : (
                <span className="h-2 w-px bg-muted-foreground/50" />
              )}
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-primary" />
    </div>
  );
}

export default Compass;
