import { GripIcon, LockIcon, PlusMinusIcon } from "./icons.jsx";

/**
 * One Customize section frame: grip, name, Hidden tag, minus/plus, body.
 * Matches wrap() in phone.src.html ~275-280.
 */
export function SectionMod({
  id,
  name,
  note,
  on,
  locked,
  children,
  onToggle,
  dragRef,
}) {
  const off = !on;
  return (
    <div
      ref={dragRef}
      className={`cz-mod${off ? " is-off" : ""}`}
      data-id={id}
    >
      <div className="cz-lift">
        <div className="cz-bar">
          <button
            type="button"
            className="cz-grip"
            aria-label={`Move ${name}. Use arrow keys`}
          >
            <GripIcon />
          </button>
          <span className="cz-name">
            {name}
            {note ? <small>{note}</small> : null}
          </span>
          <span className="cz-off-tag">Hidden</span>
          {locked ? (
            <button
              type="button"
              className="cz-tg"
              disabled
              title="Always on Home"
              aria-label={`${name} is always shown`}
            >
              <LockIcon />
            </button>
          ) : (
            <button
              type="button"
              className="cz-tg"
              aria-pressed={on}
              aria-label={`${off ? "Show" : "Hide"} ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(!on);
              }}
            >
              <PlusMinusIcon />
            </button>
          )}
        </div>
        <div className="cz-body" aria-hidden={off || undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
