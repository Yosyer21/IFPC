/** Puntos de un pentágono regular centrado en (cx, cy) con `rotationDeg`. */
function pentagonPoints(cx: number, cy: number, radius: number, rotationDeg = 0): string {
  return Array.from({ length: 5 }, (_, i) => {
    const angle = ((-90 + i * 72 + rotationDeg) * Math.PI) / 180;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');
}

/**
 * Balón de fútbol estilizado para la landing: esfera con sombreado radial +
 * pentágonos negros recortados al círculo y un brillo especular fijo (da la
 * sensación de 3D). El movimiento (oscilación 3D + flotación) lo pone la clase
 * `.fb-ball-3d` del contenedor, no el SVG, para mantener el brillo coherente.
 */
export function SoccerBall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Football">
      <defs>
        <radialGradient id="sbShade" cx="35%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#eef0f2" />
          <stop offset="80%" stopColor="#c6ccd2" />
          <stop offset="100%" stopColor="#878d95" />
        </radialGradient>
        <radialGradient id="sbSpec" cx="30%" cy="24%" r="44%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sbOcclude" cx="72%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <clipPath id="sbClip">
          <circle cx="100" cy="100" r="96" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="96" fill="url(#sbShade)" />

      <g clipPath="url(#sbClip)" fill="#141414">
        <polygon points={pentagonPoints(100, 100, 26, 0)} />
        {Array.from({ length: 5 }, (_, k) => {
          const theta = ((-90 + k * 72) * Math.PI) / 180;
          const cx = 100 + 70 * Math.cos(theta);
          const cy = 100 + 70 * Math.sin(theta);
          return <polygon key={k} points={pentagonPoints(cx, cy, 24, k * 72)} />;
        })}
      </g>

      {/* Brillo + oclusión fijos para reforzar el volumen sin seguir al giro. */}
      <circle cx="100" cy="100" r="96" fill="url(#sbSpec)" />
      <circle cx="100" cy="100" r="96" fill="url(#sbOcclude)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
    </svg>
  );
}
