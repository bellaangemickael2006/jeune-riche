# JEUNE RICHE — Design system

Source unique de vérité pour l'interface de la vitrine. `ART_DIRECTION.md` décrit l'identité
(palette, assets réels, philosophie) ; ce document décrit **comment on construit un écran**.

Règle qui gouverne tout le reste : avant d'écrire une valeur, se demander *est-ce un choix
JEUNE RICHE ou la valeur par défaut de l'outil ?* Si c'est la seconde, la changer.

---

## 1. Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0B0B0C` | Fond du site, texte sur surface claire |
| `paper` | `#F5F4F1` | Texte sur fond sombre, aplat des actions principales |
| `line` | `#26252A` | Filets, séparateurs, bordures — **jamais** décoratif |
| `studio` | `#E1DED8` | Fond des visuels produit uniquement (identique dans les deux thèmes) |
| `navy` | `#131B2E` | Ligne Polo uniquement |

Rien d'autre. Pas de dégradé, pas de glow, pas de glass, pas d'accent de couleur.
`ink` et `paper` s'inversent en mode clair (voir `globals.css`) — un composant écrit avec
ces tokens fonctionne dans les deux thèmes sans variante.

## 2. Typographie

Trois polices, trois rôles qui ne se recouvrent jamais.

| Police | Classe | Rôle |
|---|---|---|
| Anton | `font-display` | Wordmark, navigation, boutons, tailles, chapitrage. Toujours en majuscules, toujours avec `tracking-widest2` en petit corps. |
| Fraunces | `font-editorial` | Noms de produits, titres de page et de section, citations, prix en récapitulatif. Jamais en majuscules forcées. |
| Inter | `font-body` (défaut) | Paragraphes, aide, microcopy, labels, méta. Jamais en display. |

Échelle nommée (Tailwind) : `text-label` (11px caps) · `text-caption` (13px) · `text-body` (15px)
· `text-heading` (28px) · `text-heading-lg` (44px) · `text-display` (56px).
Un composant reconstruit utilise un de ces rôles, pas une taille arbitraire.

**Interdit** : Inter pour un titre, Anton pour un paragraphe, une seule police sur tout un écran.

## 3. Boutons — `components/ui/Button.tsx`

Quatre variantes, aucune autre. `Button` pour une action, `ButtonLink` pour une navigation.

| Variante | Rendu | Quand |
|---|---|---|
| `primary` | Aplat `paper`, texte `ink` | L'action principale de l'écran. Une seule à la fois. |
| `secondary` | Contour `paper/60`, fond transparent | Action de même importance mais non engageante (retour, appliquer). |
| `text` | Pas de boîte : texte + filet dessous | Sortie de section, lien secondaire, navigation douce. |
| `dark` | Aplat `ink`, texte `paper` | Sur une surface claire (tiroir panier, panneau studio). |

Deux tailles : `md` (h-14, défaut) et `sm` (h-10). Angles vifs, **jamais** d'arrondi ni d'ombre.
Typographie Anton, 10–11px, `tracking-widest2`.

Ne jamais recopier `bg-paper px-8 py-4 …` à la main : c'est ce qui avait produit douze
boutons légèrement différents à travers le site.

## 4. Rayons, bordures, ombres

- **Rayon : `0`.** Aucun `rounded-*` sur les boutons, cartes, champs, panneaux.
  Seules exceptions tolérées : éléments intrinsèquement ronds (bulle WhatsApp flottante).
- **Bordures : filet 1px `line`**, et uniquement pour structurer — séparer deux zones,
  souligner un chapitre, encadrer une sélection. Jamais pour décorer un bloc.
  Préférer un filet sur **un seul côté** (`border-t`) à un cadre complet.
- **Ombres : aucune.** La présence vient du contraste, de l'espace et de la photographie.

## 5. Composition

- **Pas de centrage** comme mise en page par défaut. Un écran se lit en diagonale :
  bloc de texte décalé, image dominante, vide assumé.
- **Chapitrage** : chaque section de l'accueil s'ouvre avec `SectionHeader`
  (numéro + intitulé + méta sur un filet). Deux sections ne s'ouvrent jamais différemment.
- **Grilles produit** : rythme explicite (`ProductShowcase`), tailles et décalages variables.
  Jamais trois vignettes identiques alignées.
- **Une pièce n'est pas une carte** : image sur fond `studio`, puis nom et prix sous un filet.
  Pas de cadre, pas de fond, pas d'ombre autour.

## 6. Mouvement

Trois vitesses, jamais empilées dans la même zone :

- **Lent** — apparitions au scroll (`FadeIn`, `WordPullUp`), 0.7–0.9s, courbe `ease-editorial`.
- **Instantané** — hover, focus : 200–300ms, uniquement couleur, filet ou 1px de décalage.
- **Aucun** — tout le reste.

Retirés volontairement : curseur personnalisé global, boutons magnétiques, texte scramble,
marquee défilant, tilt 3D et halo au curseur sur les vignettes. Une seule interaction
spéciale subsiste (`Spotlight`, section manifeste) parce que c'est la seule zone sans
vêtement à regarder.

`prefers-reduced-motion` neutralise animations et transitions (voir `globals.css`).

## 7. Iconographie

Quand le texte suffit, utiliser du texte : `PANIER 02`, `Instagram`, `Retour`.
Les seules icônes tolérées sont fonctionnelles et sans équivalent textuel court
(recherche, thème, langue, chevron retour, WhatsApp).

## 8. États d'interface

Loading, vide, erreur, sélectionné, épuisé appartiennent au même langage :
filet, alignement à gauche, éditorial pour le message, `Button` pour la sortie.
Un état vide n'est pas une boîte centrée (voir `EmptyState`).

## 9. Copy

Français, court, concret. Nommer le vêtement, la matière, la coupe, le détail.
Bannir : *elevate, timeless, redefine, exclusive, luxury lifestyle*.
Ne jamais inventer un avis, un chiffre, une collaboration ou une composition textile.

## 10. Périmètre

Ce document couvre la **vitrine**. L'admin (`/admin`) garde délibérément une interface
sobre et dense d'outil de gestion : lisibilité et vitesse avant direction artistique.
