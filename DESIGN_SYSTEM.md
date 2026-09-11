# JEUNE RICHE — Design system

Source unique de vérité pour l'interface de la vitrine.
`ART_DIRECTION.md` décrit l'identité (palette, assets réels, philosophie).
Ce document décrit **comment on construit un écran**.

Règle qui gouverne tout le reste : avant d'écrire une valeur, se demander
*est-ce un choix JEUNE RICHE, ou la valeur par défaut de l'outil ?*
Si c'est la seconde, la changer.

---

## 1. Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0B0B0C` | Fond du site, texte sur surface claire |
| `paper` | `#F5F4F1` | Texte sur fond sombre, aplat des actions engageantes |
| `line` | `#26252A` | Filets, séparateurs — **jamais** décoratif |
| `studio` | `#E1DED8` | Fond des visuels produit uniquement (identique dans les deux thèmes) |
| `navy` | `#131B2E` | Ligne Polo uniquement |

Rien d'autre. Pas de dégradé décoratif, pas de glow, pas de glass, pas
d'accent de conversion. `ink` et `paper` s'inversent en mode clair (voir
`globals.css`) : un composant écrit avec ces tokens fonctionne dans les deux
thèmes sans variante.

Seule exception tolérée : les voiles d'assombrissement posés **sur une photo**
pour la lisibilité du texte (hero). Jamais sur un fond de page.

## 2. Typographie

Trois polices, trois rôles qui ne se recouvrent jamais.

| Police | Classe | Rôle |
|---|---|---|
| **Anton** | `font-display` | Wordmark, navigation, actions, tailles, prix compact. Toujours capitales, toujours `tracking-widest2` en petit corps. |
| **Fraunces** | `font-editorial` | Titres de page et de section, noms de produits, manifeste, toute phrase qui porte la marque. Jamais en capitales forcées. |
| **Inter** | défaut | Descriptions, aide, mentions, microcopy, données. |

Échelle nommée : `text-label` (11px caps) · `text-caption` (13px) ·
`text-body` (15px) · `text-heading` (28px) · `text-heading-lg` (44px) ·
`text-display` (56px).

**Deux rôles dominants par écran, jamais trois.** L'accueil faisait cohabiter
Anton en titre, Anton en sous-titres et Inter en navigation — sans hiérarchie.
Fraunces a repris les titres de section (`SectionHeader`) et de page.

**Interdit** : Inter pour un titre, Anton pour un paragraphe, une seule police
sur tout un écran.

## 3. Le langage des actions — `components/ui/Action.tsx`

Trois familles, aucune autre. Leur différence encode **l'engagement demandé**,
pas une hiérarchie décorative.

| Famille | Engagement | Forme | Exemples |
|---|---|---|---|
| `engager` | Irréversible ou payant | Aplat `paper`, texte `ink` | Ajouter au panier · Commander |
| `poursuivre` | Navigation volontaire | Contour `paper/50` | Voir la pièce · Retour · WhatsApp |
| `passer` | Sortie douce | Texte + filet | Tout le catalogue · Le manifeste |

`Action` pour une action, `ActionLink` pour une navigation interne,
`ActionExternal` pour un lien sortant (WhatsApp).
Deux tailles : `md` (h-14, défaut) et `sm` (h-11).
Angles vifs, **jamais** d'arrondi ni d'ombre. Anton, 10–11px, `tracking-widest2`.

La famille `passer` n'a pas de boîte mais garde une **zone tactile de 44px**
(min-height invisible) : lisible comme du texte, atteignable au doigt.

Ne jamais recopier `bg-paper px-8 py-4 …` à la main : c'est ce qui avait
produit douze boutons légèrement différents à travers le site.

## 4. Rayons, bordures, ombres

- **Rayon : `0`.** Aucun `rounded-*` sur les actions, champs, panneaux,
  nuanciers, cellules de taille. Seule exception : éléments intrinsèquement
  ronds (bulle WhatsApp flottante).
- **Bordures : filet 1px `line`**, uniquement pour structurer — séparer deux
  zones, ouvrir un chapitre, encadrer une sélection. Préférer un filet sur
  **un seul côté** (`border-t`) à un cadre complet.
- **Ombres : aucune** en décoration. La profondeur vient du contraste, de
  l'espace et de la photographie.

## 5. Composition

- **Pas de centrage** comme mise en page par défaut.
- **Chapitrage** : chaque section s'ouvre avec `SectionHeader` (filet +
  intitulé Fraunces + méta factuelle). Deux sections ne s'ouvrent jamais
  différemment.
- **Catalogue en liste** (`ProductRow`) : une pièce par ligne, grande image,
  alternance gauche/droite. Six pièces dans une grille de quatre colonnes
  donnaient une grille aux trois quarts vide.
- **Une pièce n'est pas une carte** : image sur fond `studio`, puis nom et
  prix sous un filet. Pas de cadre, pas de fond, pas d'ombre.

## 6. Mouvement

Trois vitesses, jamais empilées dans la même zone :

- **Lent (700–900 ms)** — apparition au scroll (`FadeIn`), courbe
  `cubic-bezier(0.16, 1, 0.3, 1)`. Une fois, jamais en cascade mot par mot.
- **Instantané (150–250 ms)** — survol, focus : couleur, filet, 1px de
  décalage. Jamais de rebond, jamais de magnétisme.
- **Aucun** — tout le reste.

### Règle de sûreté : visible au repos

**Aucun contenu ne doit dépendre d'une animation pour être lisible.**
`FadeIn` rend son contenu visible par défaut et n'applique le masquage
qu'après montage — donc seulement si JavaScript tourne et peut aussi le
révéler. Sans JS, ou si le navigateur gèle les frames (onglet en
arrière-plan, économie d'énergie, appareil lent), la page reste lisible.
Le hero n'a aucune animation d'entrée du tout.

Retirés volontairement : curseur personnalisé global, boutons magnétiques,
texte scramble, marquee défilant, tilt 3D et halo au curseur sur les
vignettes. Une seule interaction spéciale subsiste (`Spotlight`, section
manifeste) parce que c'est la seule zone sans vêtement à regarder.

`prefers-reduced-motion` neutralise animations et transitions.

## 7. Iconographie

Quand le texte suffit, utiliser du texte : `PANIER 02`, `Instagram`,
`WhatsApp`. Les seules icônes tolérées sont fonctionnelles et sans
équivalent textuel court (thème, langue, chevron retour, WhatsApp).

## 8. Navigation

Le bandeau expose **deux contrôles** : le panier et une entrée de menu unique.
Tout le reste (recherche, favoris, compte, à propos, contact, langue, thème)
vit dans ce menu. Rien n'est supprimé, tout est rangé.
Hauteur cible : ~76px desktop. Logo 48px maximum.

## 9. Personnalisation

`components/product/PersonalizedPiece.tsx` est le **seul** moteur de rendu du
nom sur un vêtement. La galerie produit et l'atelier l'utilisent tous les deux.
Les coordonnées viennent de `lib/data/personalizationOverlay.ts`, mesurées
pixel à pixel sur les vraies photos.

**Une image non calibrée s'affiche sans superposition** plutôt qu'avec un nom
placé au hasard. L'atelier ne propose que les pièces calibrées : montrer un
rendu approximatif reviendrait à mentir sur ce qui sera imprimé.

## 10. Accessibilité

- Zones tactiles ≥ 44px de haut, y compris sur les liens en texte.
- Focus visible (`outline` 2px `paper`, offset 3px).
- `role="radiogroup"` sur le sélecteur de tailles, `aria-checked` par cellule.
- Tailles épuisées : `disabled` + barré, pas seulement grisées.
- Aucun texte sous 11px hors mention légale.

## 11. Copy

Français, court, concret. Nommer le vêtement, la matière, la coupe, le détail.
Bannir : *elevate, timeless, redefine, exclusive, luxury lifestyle*.
**Ne jamais inventer** un avis, un chiffre, une collaboration, une composition
textile. `lib/data/product-details.ts` déclare explicitement ce qui n'est pas
communiqué par la marque plutôt que de le remplir avec des valeurs plausibles.

## 12. Périmètre

Ce document couvre la **vitrine**. L'admin (`/admin`) garde délibérément une
interface sobre et dense d'outil de gestion : lisibilité et vitesse avant
direction artistique.
