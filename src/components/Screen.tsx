/** The tube: the canvas the console draws on, and the card it shows over it (paused, game over). */
export function Screen(){
  return (
    <div className="tube-surround">
      <div className="screen">
        <canvas id="cv" aria-label="Game Guy 3000 Deluxe screen" />
        <div className="overlay" id="overlay" hidden>
          <h2 id="ovTitle">GAME GUY</h2>
          <p id="ovText" />
          <button className="btn" id="ovBtn" type="button"><span className="blink">▶</span> START</button>
        </div>
      </div>
    </div>
  );
}
