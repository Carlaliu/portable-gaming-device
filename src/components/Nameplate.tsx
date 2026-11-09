import { MODEL } from './site';

/** The badge on the set. The console rewrites the second line with the phosphor in use. */
export function Nameplate(){
  return (
    <div className="nameplate">
      <b>GAME GUY<span className="np-rest"> 3000 DELUXE</span></b>
      <span id="plate">{MODEL} · GREEN P1</span>
    </div>
  );
}
