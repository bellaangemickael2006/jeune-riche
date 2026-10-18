// Grain cinématique, uniquement sur grand écran : un calque plein écran en
// mode de fusion (mix-blend-overlay) oblige le navigateur à recomposer toute
// la page à chaque image pendant le défilement — invisible sur un ordinateur,
// mais c'était l'une des causes de saccades sur les téléphones d'entrée de
// gamme. Promu sur sa propre couche (translateZ) pour ne jamais être repeint.
export default function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] hidden opacity-[0.05] mix-blend-overlay lg:block"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "120px 120px",
        transform: "translateZ(0)",
      }}
    />
  );
}
