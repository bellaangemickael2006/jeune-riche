// Fait voler une copie de la photo produit jusqu'au bouton panier de
// l'en-tête (marqué data-cart-target), puis fait rebondir ce bouton.
// Résout la promesse à l'arrivée — ou tout de suite si l'animation est
// impossible ou non souhaitée (pas de source, bouton panier caché, réglage
// « réduire les animations »), pour que l'ajout au panier ne dépende jamais
// de l'effet.
export function flyToCart(source: HTMLElement | null): Promise<void> {
  if (typeof window === "undefined" || !source) return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find(
    (el) => el.offsetParent !== null
  );
  if (!target) return Promise.resolve();

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return Promise.resolve();

  const size = Math.min(from.width, from.height, 220);
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-product-hero");
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    margin: "0",
    zIndex: "9999",
    pointerEvents: "none",
    overflow: "hidden",
    transform: "none",
    viewTransitionName: "none",
  });
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  return new Promise((resolve) => {
    const flight = clone.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        // Point haut de l'arc : la pièce monte un peu avant de plonger.
        { transform: `translate(${dx * 0.45}px, ${dy * 0.2 - 90}px) scale(0.55) rotate(-10deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(-18deg)`, opacity: 0.5 },
      ],
      { duration: 750, easing: "cubic-bezier(.5, 0, .3, 1)" }
    );
    const land = () => {
      clone.remove();
      target.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.3)" }, { transform: "scale(0.92)" }, { transform: "scale(1)" }],
        { duration: 450, easing: "ease-out" }
      );
      resolve();
    };
    flight.onfinish = land;
    flight.oncancel = land;
  });
}
