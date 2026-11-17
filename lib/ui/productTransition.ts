// Transition « carte → fiche » : la photo de la carte grandit jusqu'à la
// grande photo de la fiche produit (View Transitions du navigateur).
//
// Le navigateur fige l'écran entre la capture de l'ancienne page et l'appel
// de fin : on attend donc l'apparition de la photo de la fiche
// ([data-product-hero]), mais jamais plus de MAX_WAIT_MS, pour qu'une
// connexion lente ne laisse pas l'écran figé — au-delà, la transition se
// joue sur ce qui est affiché.
const MAX_WAIT_MS = 1200;

type ViewTransition = {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
};
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => ViewTransition;
};

export function canAnimateToProduct() {
  if (typeof window === "undefined") return false;
  const doc = document as ViewTransitionDocument;
  return typeof doc.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Minuterie et non requestAnimationFrame : pendant la transition, le
// navigateur suspend l'affichage, et les callbacks d'animation avec — l'attente
// ne se terminait alors jamais.
function waitForProductHero() {
  return new Promise<void>((resolve) => {
    const start = Date.now();
    const check = () => {
      if (document.querySelector("[data-product-hero]") || Date.now() - start > MAX_WAIT_MS) resolve();
      else setTimeout(check, 30);
    };
    check();
  });
}

export function animateToProduct(cardImage: HTMLElement, navigate: () => void) {
  const doc = document as ViewTransitionDocument;
  // Le nom est posé sur la carte juste avant la capture de l'ancienne page,
  // puis retiré : deux éléments ne peuvent pas porter le même nom à la fois.
  // Depuis une fiche (« Compléter la tenue »), sa grande photo le porte déjà :
  // on le lui retire, sinon le navigateur annule la transition.
  document.querySelectorAll<HTMLElement>("[data-product-hero]").forEach((el) => {
    el.style.viewTransitionName = "none";
  });
  cardImage.style.viewTransitionName = "product-hero";
  const transition = doc.startViewTransition!(async () => {
    cardImage.style.viewTransitionName = "";
    navigate();
    await waitForProductHero();
  });
  // Une transition interrompue (autre clic, onglet masqué…) rejette ses
  // promesses : la navigation a quand même lieu, seule l'animation saute.
  // On l'ignore plutôt que de laisser une erreur non gérée dans la console.
  const ignore = () => {};
  transition.ready.catch(ignore);
  transition.finished.catch(ignore);
  transition.updateCallbackDone.catch(ignore);
}
