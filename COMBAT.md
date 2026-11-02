# Combat du Front — règles implémentées

Le moteur dans `dist/engine.js` contient les réglages `COMBAT_UNITS` et `COMBAT_RULES`, l’affectation `armyStats`, les profils `enemyArmy`, la prévision `battlePreview` et la résolution pure `simulateCombat`. L’écran Front réutilise directement la composition calculée.

- Un uniforme apporte un homme. Sans arme ni poste, il ne contribue pas à la puissance.
- Fusilier : 0,5 sans munitions ; 1 approvisionné. Canon : 2 hommes ; char : 3 ; chasseur : 2 ; bombardier : 4.
- Affectation automatique : réserve de personnel pour l’infanterie, équipements collectifs, armes individuelles, logistique. Pas de double affectation.
- Les munitions sont réservées puis consommées une seule fois, uniquement pour les unités ayant pu tirer. Le matériel en réserve reste intact.
- Engagement aérien, bombardement, artillerie, engagement terrestre. Chaque phase calcule ses effets simultanément pour les deux camps.
- Les chasseurs interceptent l’aviation ; une force uniquement aérienne ne tient pas le front. La contribution des bombardiers est plafonnée à 50 % de la puissance terrestre avant interception.
- Mitrailleuses et chars avantagés contre l’infanterie ; artillerie protégée par les fantassins, vulnérable aux chars lorsqu’elle est exposée. Les bombardiers favorisent les cibles blindées et l’artillerie.
- Soutien médical, liaison, ravitaillement et reconnaissance avec bonus plafonnés. Les véhicules et appareils de soutien mobilisent aussi du personnel.
- Au seuil de 5 contre 1 après prise en compte de la composition, le vainqueur ne subit aucune perte. La consommation de munitions est réduite. Les pilotes ne subissent pas de pertes dans la phase terrestre.
- Égalité de puissance finale : le défenseur repousse l’assaut. Les pénalités économiques et la troisième défaite consécutive conservent leur comportement antérieur.
- Puissance ennemie de base : plafond(12 × 1,3^(vague−1)), avec profils progressivement diversifiés. Le Front affiche la menace effective face à l’armée du joueur ; la reconnaissance donne sa composition détaillée.
- La composition exacte est affichée au-dessus de la garnison ; les réserves indiquent leur équipement, pas des soldats fictifs. Les rapports ajoutent les pertes matérielles et un détail repliable des phases.

## Compatibilité et vérification

Aucun changement de schéma d’inventaire : les sauvegardes existantes gardent leurs effectifs et leurs stocks. La composition est recalculée. Les anciens rapports restent lisibles ; les nouveaux champs sont facultatifs et validés à l’import.

134 tests réussis, dont équipages, stocks, combats sans munitions, interception, domination symétrique, absence de double comptage, rapports et sauvegardes. Contrôle navigateur à 1440 et 390 pixels, sans débordement horizontal.

Les simulations indépendantes des 15 vagues donnent 5 victoires pour l’infanterie seule contre 14 pour une composition diversifiée à budget nominal de 120 % de l’ennemi. Un scénario de campagne à 160 % conserve les pertes et les stocks entre combats et passe les 15 vagues avec 1 à 17 pertes humaines par assaut. Les livraisons y sont hypothétiques ; leurs recettes et besoins de capacité sont chiffrés, mais les recherches, la trésorerie et la disponibilité réelle des matières ne sont pas simulées. Ce résultat ne prouve pas encore l’équilibrage économique d’une partie complète.
