/** The floating on-screen joystick. */
export function Joystick(){
  return (
    <div className="stickzone" id="stickzone" aria-label="Joystick: touch and drag to steer">
      <div className="stickbase" id="stickbase">
        {(['up', 'down', 'left', 'right'] as const).map(d => <span key={d} className="tick" data-d={d} />)}
        <div className="knob" id="knob" />
      </div>
      <span className="hint" data-i18n="stick">DRAG TO STEER</span>
    </div>
  );
}
