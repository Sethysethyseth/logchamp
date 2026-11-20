import { Link } from "react-router-dom";

/** The shared Home card frame: title row with a link or a quiet aside. */
export function HomeSectionCard({ id, title, aside = null, linkTo = null, className = "", children, ...rest }) {
  const headingId = `home-${id}-heading`;
  return (
    <section
      className={`card weekly-report home-section home-section--${id}${className ? ` ${className}` : ""}`}
      aria-labelledby={headingId}
      {...rest}
    >
      <div className="weekly-report__head row">
        <h2 id={headingId} className="weekly-report__title">
          {title}
        </h2>
        {linkTo ? (
          <Link className="weekly-report__link" to={linkTo}>
            {aside}
          </Link>
        ) : aside ? (
          <span className="home-section__aside muted small">{aside}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
