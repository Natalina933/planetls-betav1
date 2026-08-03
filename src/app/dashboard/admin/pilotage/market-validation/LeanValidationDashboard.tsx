import styles from "./LeanValidationDashboard.module.scss";
import {
  analyzedFiles,
  exploitableJourneys,
  followUpMessage,
  goNoGoRules,
  immediateActionGroups,
  initialDiagnostic,
  integrationRecommendations,
  interviewScripts,
  landingVariants,
  nextDecisions,
  pilotOfferMessage,
  planLimits,
  prioritizedHypotheses,
  recruitmentMessage,
  reusableComponents,
  surveyQuestions,
  totalEstimatedBudget,
  totalEstimatedTime,
  unnecessaryFeaturesForValidation,
  unverifiableHypotheses,
  validationKpis,
  validationSchedule,
  validationTests,
} from "./validationData";

function phaseLabel(phase: string) {
  if (phase === "problem") return "Phase 1 - Problème";
  if (phase === "interest") return "Phase 2 - Intérêt";
  return "Phase 3 - Volonté de payer";
}

export function LeanValidationDashboard() {
  return (
    <section className={styles.section} aria-labelledby="lean-validation-title">
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Validation marché</span>
        <h2 id="lean-validation-title">
          Plan Lean Startup sur 30 jours pour trouver le premier segment, le premier problème et la
          première offre vraiment commercialisable
        </h2>
        <p>
          Cette brique ne cherche pas à confirmer la vision complète de PlanetLS. Elle sert à tester
          rapidement, avec peu de budget et peu de développement, si une douleur suffisamment forte
          existe vraiment et si une offre resserrée peut être utilisée puis payée.
        </p>

        <div className={styles.heroGrid}>
          <article className={styles.heroCard}>
            <span className={styles.subEyebrow}>Budget cible</span>
            <strong>{totalEstimatedBudget}</strong>
            <p>Priorité au scénario le plus frugal, sans campagne publicitaire lourde.</p>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.subEyebrow}>Temps estimé</span>
            <strong>{totalEstimatedTime}</strong>
            <p>Compatible avec une fondatrice seule aidée ponctuellement par Codex.</p>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.subEyebrow}>Segment à challenger</span>
            <strong>Concierges et petites conciergeries en priorité</strong>
            <p>Hypothèse forte, mais non validée à ce stade.</p>
          </article>
          <article className={styles.heroCard}>
            <span className={styles.subEyebrow}>MVP le plus testable</span>
            <strong>Séjour - mission - planning - preuve</strong>
            <p>Appuyé par les parcours déjà présents et l&apos;offre Concierge PRO existante.</p>
          </article>
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="diagnostic-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="diagnostic-title">1. Diagnostic initial</h3>
            <p className={styles.panelIntro}>
              Diagnostic issu du code, du Master Plan et des parcours déjà exploitables observés au
              lundi 3 août 2026.
            </p>
          </div>
          <span className={styles.badge}>Base de départ avant tout nouveau développement</span>
        </div>

        <div className={styles.diagnosticGrid}>
          {initialDiagnostic.map((item) => (
            <article key={item.id} className={styles.diagnosticCard}>
              <strong className={styles.cardTitle}>{item.title}</strong>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="hypotheses-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="hypotheses-title">2. Hypothèses prioritaires</h3>
            <p className={styles.panelIntro}>
              Classement selon importance, incertitude, urgence et coût d&apos;une mauvaise décision.
            </p>
          </div>
          <span className={styles.badge}>Commencer par ce qui pourrait invalider le projet le plus vite</span>
        </div>

        <div className={styles.hypothesisGrid}>
          {prioritizedHypotheses.map((item) => (
            <article key={item.id} className={styles.hypothesisCard} data-priority={item.priority}>
              <div className={styles.labelRow}>
                <strong>{item.code}</strong>
                <span className={styles.pill}>{item.priority}</span>
              </div>
              <p>{item.title}</p>
              <ul>
                <li>Importance : {item.importance}</li>
                <li>Incertitude : {item.uncertainty}</li>
                <li>Urgence : {item.urgency}</li>
                <li>Coût d&apos;une mauvaise décision : {item.wrongDecisionCost}</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="schedule-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="schedule-title">3. Planning des 30 jours</h3>
            <p className={styles.panelIntro}>
              Répartition réaliste en trois phases, conçue pour limiter les risques et préserver la
              capacité d&apos;exécution.
            </p>
          </div>
          <span className={styles.badge}>13 tests répartis sur 30 jours calendaires maximum</span>
        </div>

        <div className={styles.scheduleGrid}>
          {validationSchedule.map((item) => (
            <article key={item.id} className={styles.scheduleCard}>
              <span>{item.window}</span>
              <strong>{phaseLabel(item.phase)}</strong>
              <p>{item.focus}</p>
              <ul>
                {item.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="tests-table-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="tests-table-title">4. Tableau des 13 tests</h3>
            <p className={styles.panelIntro}>
              Vue synthétique pour comparer objectif, méthode, coût, durée et seuils avant exécution.
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Test</th>
                <th>Phase</th>
                <th>Cible</th>
                <th>Objectif</th>
                <th>Méthode</th>
                <th>Durée</th>
                <th>Coût</th>
                <th>Métrique</th>
                <th>Seuil</th>
              </tr>
            </thead>
            <tbody>
              {validationTests.map((test) => (
                <tr key={test.id}>
                  <td>{test.number}. {test.title}</td>
                  <td>{phaseLabel(test.phase)}</td>
                  <td>{test.targetSegment}</td>
                  <td>{test.objective}</td>
                  <td>{test.protocol[0]}</td>
                  <td>{test.prepTime} + {test.executionTime}</td>
                  <td>{test.estimatedCost}</td>
                  <td>{test.primaryMetrics[0]}</td>
                  <td>{test.validationThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="tests-detail-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="tests-detail-title">5. Détail de chaque test</h3>
            <p className={styles.panelIntro}>
              Chaque test produit une donnée mesurable et débouche sur une action de pilotage claire.
            </p>
          </div>
        </div>

        <div className={styles.testGrid}>
          {validationTests.map((test) => (
            <article key={test.id} className={styles.testCard}>
              <span>{phaseLabel(test.phase)}</span>
              <strong>{test.number}. {test.title}</strong>
              <p>{test.objective}</p>
              <div className={styles.testMeta}>
                <ul>
                  <li>Cible : {test.targetSegment}</li>
                  <li>Hypothèse : {test.testedHypothesis}</li>
                  <li>Risque évalué : {test.riskAssessed}</li>
                  <li>Participants minimum : {test.minimumParticipants}</li>
                  <li>Recrutement : {test.recruitmentMode}</li>
                  <li>Outils : {test.tools.join(", ")}</li>
                  <li>Préparation : {test.prepTime}</li>
                  <li>Exécution : {test.executionTime}</li>
                  <li>Coût estimé : {test.estimatedCost}</li>
                  <li>Seuil de validation : {test.validationThreshold}</li>
                  <li>Seuil d'incertitude : {test.uncertaintyThreshold}</li>
                  <li>Seuil d'échec : {test.failureThreshold}</li>
                  <li>Action selon résultat : {test.followUpAction}</li>
                  <li>Livrable produit : {test.deliverable}</li>
                </ul>
                <ul>
                  {test.protocol.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <ul>
                  {test.biases.map((bias) => (
                    <li key={bias}>Biais possible : {bias}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="scripts-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="scripts-title">6. Scripts et templates</h3>
            <p className={styles.panelIntro}>
              Les questions privilégient les comportements observés, pas les réponses orientées.
            </p>
          </div>
        </div>

        <div className={styles.scriptGrid}>
          {interviewScripts.map((script) => (
            <article key={script.id} className={styles.scriptCard}>
              <span>{script.audience}</span>
              <strong>Script d&apos;entretien</strong>
              <ul>
                {script.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>
          ))}
          <article className={styles.scriptCard}>
            <span>Sondage de 10 questions</span>
            <strong>Version courte à diffuser</strong>
            <ul>
              {surveyQuestions.map((item) => (
                <li key={item.id}>{item.question} - {item.answerFormat}</li>
              ))}
            </ul>
          </article>
          <article className={styles.scriptCard}>
            <span>Message de recrutement</span>
            <strong>Premier contact</strong>
            <p className={styles.notes}>{recruitmentMessage}</p>
          </article>
          <article className={styles.scriptCard}>
            <span>Message de relance</span>
            <strong>Deuxième contact</strong>
            <p className={styles.notes}>{followUpMessage}</p>
          </article>
          <article className={styles.scriptCard}>
            <span>Offre pilote</span>
            <strong>Proposition à envoyer</strong>
            <p className={styles.notes}>{pilotOfferMessage}</p>
          </article>
        </div>

        <div className={styles.landingGrid}>
          {landingVariants.map((item) => (
            <article key={item.id} className={styles.landingCard}>
              <span>{item.audience}</span>
              <strong>{item.headline}</strong>
              <p>{item.subheadline}</p>
              <ul>
                {item.sections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="kpi-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="kpi-title">7. Dashboard de validation</h3>
            <p className={styles.panelIntro}>
              6 métriques essentielles seulement, avec seuils de lecture et action corrective en cas
              de signal faible.
            </p>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          {validationKpis.map((item) => (
            <article key={item.id} className={styles.kpiCard}>
              <span>{item.name}</span>
              <strong>{item.currentValue}</strong>
              <p>{item.definition}</p>
              <ul>
                <li>Formule : {item.formula}</li>
                <li>Source : {item.source}</li>
                <li>Vert : {item.greenThreshold}</li>
                <li>Orange : {item.orangeThreshold}</li>
                <li>Rouge : {item.redThreshold}</li>
                <li>Mise à jour : {item.updateFrequency}</li>
                <li>Action : {item.actionIfBad}</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="decision-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-title">8. Grille GO / NO-GO / TEST MORE</h3>
            <p className={styles.panelIntro}>
              Les seuils sont des références de départ à ajuster selon la qualité du trafic et du
              recrutement, pas une règle mécanique aveugle.
            </p>
          </div>
        </div>

        <div className={styles.rulesGrid}>
          {goNoGoRules.map((rule) => (
            <article key={rule.id} className={styles.ruleCard} data-decision={rule.decision}>
              <span>{rule.title}</span>
              <strong>Signaux de décision</strong>
              <ul>
                {rule.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
              <p>{rule.nextMove}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="integration-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="integration-title">9. Recommandations d&apos;intégration</h3>
            <p className={styles.panelIntro}>
              Intégration dans la page `Pilotage Business` existante, sans refonte lourde ni migration
              immédiate.
            </p>
          </div>
        </div>

        <div className={styles.recommendationGrid}>
          {integrationRecommendations.map((item) => (
            <article key={item.id} className={styles.recommendationCard}>
              <span>{item.title}</span>
              <strong>À retenir</strong>
              <ul>
                {item.items.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="actions-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="actions-title">10. Actions immédiates</h3>
            <p className={styles.panelIntro}>
              Ce qu&apos;il faut faire maintenant, ce qu&apos;il ne faut pas lancer, et quelle preuve chercher
              en premier.
            </p>
          </div>
        </div>

        <div className={styles.actionGrid}>
          {immediateActionGroups.map((group) => (
            <article key={group.id} className={styles.actionGroup}>
              <span>{group.title}</span>
              <strong>Priorité immédiate</strong>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="meta-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="meta-title">Annexes utiles au pilotage</h3>
            <p className={styles.panelIntro}>
              Ce qui a été relu, ce qui est déjà exploitable, ce qu&apos;il ne faut pas sur-investir et ce
              qui reste non vérifiable à ce stade.
            </p>
          </div>
        </div>

        <div className={styles.summaryBar}>
          <article className={styles.summaryCard}>
            <strong>Budget estimé</strong>
            <p>{totalEstimatedBudget}</p>
          </article>
          <article className={styles.summaryCard}>
            <strong>Temps estimé</strong>
            <p>{totalEstimatedTime}</p>
          </article>
          <article className={styles.summaryCard}>
            <strong>Prochaines décisions</strong>
            <p>{nextDecisions.length} arbitrages à préparer après les tests</p>
          </article>
        </div>

        <div className={styles.metaGrid}>
          <article className={styles.metaPanel}>
            <strong>Fichiers analysés</strong>
            <ul>
              {analyzedFiles.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Parcours déjà exploitables</strong>
            <ul>
              {exploitableJourneys.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Fonctionnalités non nécessaires au test</strong>
            <ul>
              {unnecessaryFeaturesForValidation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Composants réutilisables</strong>
            <ul>
              {reusableComponents.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Hypothèses non vérifiables actuellement</strong>
            <ul>
              {unverifiableHypotheses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Limites du plan</strong>
            <ul>
              {planLimits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.metaPanel}>
            <strong>Prochaines décisions à prendre</strong>
            <ul>
              {nextDecisions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </section>
  );
}
