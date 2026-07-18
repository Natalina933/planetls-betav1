# Instructions projet PlanetLS

## Master Plan obligatoire

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

## Compte rendu final

Toute mission importante se termine par une section `Mise à jour du pilotage PlanetLS` indiquant le fichier mis à jour, les statuts et priorités déplacés, les tâches ou idées ajoutées, les contradictions détectées et les vérifications restantes. Si aucun impact significatif n'existe, l'indiquer explicitement.