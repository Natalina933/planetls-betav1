# Instructions projet PlanetLS

## Master Plan obligatoire

### Definitions de gouvernance

- Une **mission importante** modifie un parcours utilisateur, une regle metier, une API, un schema de donnees, une permission, une integration externe, une dependance majeure ou un risque produit/technique.
- Une **evolution significative** est une modification qui peut changer le statut, la priorite, les preuves, les dependances, les limites connues ou la roadmap d'un sujet du Master Plan.
- Un **audit** est une analyse factuelle et datee du code, des migrations, des tests et, si applicable, des donnees ou integrations. Il produit des preuves, ecarts et prochaines actions ; il ne remplace pas le Master Plan.
- Un **workflow** est une chaine de transitions metier ou techniques, avec declencheur, acteur ou systeme responsable, permissions, donnees persistantes, erreurs et resultat attendu.

### Migrations et permissions Supabase

- Toute migration doit etre testee sur une base locale fraiche et sur une base existante representative avant d'etre declaree terminee. Si un rollback, une sauvegarde ou une previsualisation est necessaire, son statut doit etre documente.
- Toute fonctionnalite qui lit ou ecrit des donnees Supabase doit inclure une verification RLS dans sa checklist : acces autorise, acces refuse entre roles ou tenants, et parcours serveur lorsque pertinent.

Le document officiel de pilotage est `docs/master-plan-planetls.md`.

Après toute évolution fonctionnelle, technique ou métier significative, analyser les fichiers modifiés et mettre à jour ce Master Plan dans la même mission. La mise à jour doit refléter l'état réel du code, le statut de la fonctionnalité, les priorités, la roadmap, les dépendances, les limites, les nouvelles idées et les décisions importantes. Ne pas créer un nouvel audit lorsque l'information peut être intégrée au document principal.

Le code, les migrations réellement appliquées et les tests sont les sources de vérité. La présence d'une page, d'un composant ou d'une route ne suffit pas pour déclarer une fonctionnalité terminée.

Statuts autorisés : `✅ Terminé`, `🟡 En cours`, `🟠 Partiel`, `🔴 À faire`, `⚠️ Bloqué`, `⏸️ Reporté`, `❌ Abandonné`.

Priorités : `P0 Critique`, `P1 Prioritaire`, `P2 Important`, `P3 Confort`, `P4 Évolution future`.

Les petites corrections typographiques ou purement visuelles ne nécessitent pas de mise à jour, sauf si elles changent une règle commune du design system.

## Vérification de fin de mission importante

- [ ] Le développement demandé est réalisé et les fichiers concernés ont été relus.
- [ ] Les tests, le lint, le build ou les vérifications pertinentes ont été exécutés.
- [ ] Les permissions, erreurs, chargements, états vides et données persistées ont été contrôlés selon le contexte.
- [ ] Le statut, la priorité, les preuves et la prochaine action ont été actualisés dans le Master Plan.
- [ ] La roadmap, les dépendances et les limites connues ont été réévaluées.
- [ ] Les idées nouvelles ont été enregistrées sans doublon, sans être implémentées hors demande.
- [ ] Les décisions significatives ont été ajoutées au journal.
- [ ] Aucun audit ou document redondant n'a été créé.

- [ ] Toute migration concernee a ete validee sur une base fraiche et une base existante representative, avec rollback, sauvegarde ou previsualisation documente si necessaire.
- [ ] Toute fonctionnalite impliquant Supabase a une verification RLS documentee : acces autorise, refus entre roles ou tenants, et parcours serveur si pertinent.

## Compte rendu final

Toute mission importante se termine par une section `Mise à jour du pilotage PlanetLS` indiquant le fichier mis à jour, les statuts et priorités déplacés, les tâches ou idées ajoutées, les contradictions détectées et les vérifications restantes. Si aucun impact significatif n'existe, l'indiquer explicitement.
