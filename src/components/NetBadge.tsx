/** The status badge that slides over the top of the set (offline, back online, update ready). */
export function NetBadge(){
  return (
    <div className="netbadge" id="netToast" role="status" aria-live="polite" hidden>
      <span className="nled" aria-hidden="true" />
      <span className="nmsg" id="netMsg" />
      <button type="button" className="nbtn" id="netBtn" hidden />
    </div>
  );
}
