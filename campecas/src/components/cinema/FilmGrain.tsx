/** Grão de filme animado + vinheta. Puramente decorativo, sem JS. */
export function FilmGrain() {
  return (
    <>
      <div className="vignette" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
    </>
  );
}
