/** A rocker switch on the set (SOUND, GLOW, HOLD, FULL). The console flips `aria-pressed` and lights its LED. */
export function Rocker({ id, label, ariaLabel, pressed = false }: { id: string; label: string; ariaLabel: string; pressed?: boolean }){
  return (
    <div className="rk">
      <button className="rocker" type="button" id={id} aria-pressed={pressed} aria-label={ariaLabel}><i /></button>
      <span className="ctl-label">{label}</span>
    </div>
  );
}
