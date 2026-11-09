/** A square key beside POWER (RESET, SELECT), with its label underneath. */
export function KeyButton({ id, label, ariaLabel, variant, hidden = false }: { id: string; label: string; ariaLabel: string; variant?: 'select'; hidden?: boolean }){
  return (
    <span className={'reset-grp' + (variant === 'select' ? ' sel-grp' : '')} hidden={hidden}>
      <button className={'resetbtn' + (variant === 'select' ? ' selectbtn' : '')} id={id} type="button" aria-label={ariaLabel} />
      <span className="ctl-label">{label}</span>
    </span>
  );
}
