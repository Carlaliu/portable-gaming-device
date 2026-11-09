import { KeyButton } from './KeyButton';

/** POWER (a sliding switch with its LED), RESET and the hidden-for-now SELECT. */
export function PowerPanel({ showSelect = false }: { showSelect?: boolean }){
  return (
    <div className="power">
      <button className="powerrock" id="powerBtn" type="button" role="switch" aria-checked="false" aria-label="Power"><i /></button>
      <span className="pled" aria-hidden="true" />
      <span className="ctl-label">POWER</span>
      <KeyButton id="resetBtn" label="RESET" ariaLabel="Reset: restart the console" />
      <KeyButton id="selectBtn" label="SELECT" ariaLabel="Select: back to the game menu" variant="select" hidden={!showSelect} />
    </div>
  );
}
