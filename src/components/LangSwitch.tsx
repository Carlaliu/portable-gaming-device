/** EN · 繁中 · 简中. The console wires the buttons and keeps aria-pressed in step. */
export function LangSwitch(){
  return (
    <div className="lang" role="group" aria-label="Language" id="langSeg">
      <button type="button" data-lang="en" aria-pressed="true">EN</button>
      <button type="button" data-lang="zh-hant" aria-pressed="false" lang="zh-Hant">繁中</button>
      <button type="button" data-lang="zh-hans" aria-pressed="false" lang="zh-Hans">简中</button>
    </div>
  );
}
