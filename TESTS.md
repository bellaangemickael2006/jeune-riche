# JEUNE RICHE — Tests

`npm run test:e2e` (Playwright, Chromium). Le serveur de développement est démarré
automatiquement ; il compile chaque route à la première visite, d'où les délais
généreux dans `playwright.config.ts` — un test lent n'est pas un test en échec.

**État au 08/09/2026 : 77 passent, 0 ignoré, 0 en échec** — en local comme
contre la production (`E2E_BASE_URL=https://jeune-riche.vercel.app`).

## Ce qui est couvert

### `tests/navigation.spec.ts` — structure et navigation
Narration 01/02/03 de l'accueil, CTA unique, absence de vidéo hero ; index de la
gamme ; navigation principale ; six catégories réelles ; filtre par catégorie ;
recherche (touche Entrée **et** bouton) ; état vide de recherche ; page
introuvable ; 404 réel sur une route inconnue ; manifeste ; redirection admin ;
panier et favoris vides ; newsletter et canal WhatsApp dans le footer ; absence
de bulle flottante.

### `tests/commerce.spec.ts` — parcours d'achat
Tailles en boutons et absence de `<select>` ; état sélectionné ; changement de
couleur ; aperçu de personnalisation ; ajout au panier (le tiroir s'ouvre de
lui-même) ; quantité + et − ; suppression ; page panier ; favoris.

### `tests/direction-artistique.spec.ts` — garde-fou de direction artistique
Sur `/`, `/catalogue`, une fiche produit, `/panier` et `/manifeste` :
- **aucun dégradé** ;
- **aucun rayon de bordure supérieur à 8px**, aucun `rounded-full` ;
- **aucune couleur hors des cinq tokens** (seule exception assumée : les
  nuanciers de coloris, marqués `data-swatch`, qui montrent la teinte réelle du
  tissu — c'est une information produit, pas de la décoration).

Plus : premier écran mobile sans débordement avec le CTA au-dessus de la ligne
de flottaison ; intro à froid (courte, fermeture au premier clic, ne se rejoue
pas) ; mouvement réduit (pas d'intro, contenu lisible) ; **contenu essentiel
lisible avec JavaScript désactivé**.

Ces trois derniers points existent parce que les interdits du brief ne tiennent
que si quelque chose les vérifie. Un dégradé réintroduit par mégarde fait
échouer la suite.

## Défauts trouvés par les tests et corrigés

| Défaut | Correction |
|---|---|
| La recherche du header ne faisait rien : `onClose()` démontait le panneau dans le même gestionnaire que `router.push`, la navigation était perdue | `onClose()` retiré (l'effet sur `pathname` referme déjà), et un bouton « Rechercher » visible ajouté — la touche Entrée était le seul moyen de valider |
| Deux boutons portaient le nom accessible « Rechercher » (l'icône et la validation) | L'icône devient « Ouvrir la recherche » |
| Une action faite avant la réhydratation des stores était silencieusement écrasée | Drapeau `touched` + `merge` : la décision de l'utilisateur prime sur le contenu du disque |
| Nuanciers `Noir` et `Marine` légèrement décalés des tokens de marque | Alignés sur `ink` et `navy` |

## Le soft-404, et comment il a été trouvé

`/catalogue/<slug-inexistant>` renvoyait un **statut 200** avec le contenu
« Page introuvable » — un soft-404, que les moteurs de recherche indexent, ce
qui ouvrait la porte à un nombre illimité d'URL produit bidons.

La recherche a demandé six builds successifs, chacun isolant une variable :

| Hypothèse | Résultat |
|---|---|
| La frontière `loading.tsx` du segment `[slug]` | Retirée → toujours 200 |
| `notFound()` appelé depuis `generateMetadata` | Toujours 200 |
| Le middleware | Restreint pour ne plus couvrir `/catalogue` → toujours 200. Innocenté. |
| `notFound()` sur une route **statique** de test | 404 ✅ |
| `notFound()` sur une route **dynamique** de test | 404 ✅ |
| La même route de test **+ `generateMetadata`** | 404 ✅ — donc pas la cause |
| La même route de test **+ `loading.tsx`** | **200** ❌ — cause identifiée |

Une frontière Suspense fait partir la réponse en streaming : l'en-tête HTTP est
envoyé avant l'exécution du composant, et `notFound()` ne peut plus fixer le
statut. La première tentative avait échoué parce que le coupable n'était pas le
`loading.tsx` du segment, mais celui du segment **parent** `/catalogue`, qui
englobait aussi `[slug]`.

Correction : la liste du catalogue vit dans le groupe de routes `(liste)`, dont
le squelette n'englobe que la liste. La fiche produit n'a plus de squelette de
chargement — un vrai 404 vaut mieux, et la page ne dépend que d'une requête
indexée. Vérifié : fiche inexistante **404**, fiche réelle 200, catalogue et
filtres 200, route inconnue 404.

⚠️ Ne pas réintroduire de `loading.tsx` dans `app/catalogue/` ni dans
`app/catalogue/[slug]/` : le test « une fiche produit inexistante renvoie un
vrai 404 » échouerait aussitôt.

## Non couvert

- Checkout complet (aucun paiement n'est branché — voir TODO.md).
- Interface d'administration au-delà de la redirection de sécurité.
- Envoi réel des emails : les routes renvoient 200 même quand l'envoi échoue
  silencieusement, un statut HTTP ne prouve donc jamais une livraison.
