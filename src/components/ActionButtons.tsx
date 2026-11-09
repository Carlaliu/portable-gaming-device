/** FIRE and BOOST. Each game relabels them (JUMP and DUCK in Dino Run); BOOST carries a recharge meter. */
export function ActionButtons(){
  return (
    <div className="keyrow">
      <button className="fire" id="fireBtn" type="button" data-i18n="spark">FIRE</button>
      <button className="boost" id="boostBtn" type="button">
        <span data-i18n="boost">BOOST</span>
        <i className="bmeter" aria-hidden="true"><b id="boostFill" /></i>
      </button>
    </div>
  );
}
