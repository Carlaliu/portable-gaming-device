/** The phosphor dial. The console draws its labels and turns it. */
export function PhosphorDial(){
  return (
    <div className="dial-block">
      <div className="dial-wrap">
        <div className="dial-labels" id="dialLabels" />
        <div className="dial" id="dial" role="slider" tabIndex={0} aria-label="Phosphor dial" aria-valuemin={0} aria-valuemax={5} aria-valuenow={0} aria-valuetext="GREEN P1">
          <div className="dial-cap" id="dialCap"><span className="pointer" /></div>
        </div>
      </div>
      <span className="ctl-label">PHOSPHOR</span>
    </div>
  );
}
