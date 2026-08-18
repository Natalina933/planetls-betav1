import styles from "./StrategicDecisionAssistant.module.scss";
import {
  decisionCriteria,
  decisionPrinciples,
  decisionSteps,
  decisionTriggers,
  pilotageOutputs,
  reusableDecisionComponents,
  strategicQuestions,
} from "./decisionFramework";

export function StrategicDecisionAssistant() {
  return (
    <section className={styles.section} aria-labelledby="strategic-decision-title">
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Conseiller stratégique</span>
        <h2 id="strategic-decision-title">
          Un cadre unique pour challenger chaque grande décision de la fondatrice
        </h2>
        <p>
          Ce module transforme la méthode de décision stratégique PlanetLS en cadre de travail
          réutilisable. Il ne tranche pas automatiquement. Il aide à décider mieux, avec plus de
          rigueur, moins de biais et une mémoire exploitable.
        </p>

        <div className={styles.principles}>
          {decisionPrinciples.map((item) => (
            <article key={item} className={styles.principle}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="decision-triggers-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-triggers-title">Quand utiliser ce cadre</h3>
            <p>
              Dès qu&apos;une décision produit, business, technique ou marché peut engager du temps,
              du budget, de la complexité ou de la charge mentale difficile à annuler.
            </p>
          </div>
          <span className={styles.badge}>Décision importante = analyse obligatoire</span>
        </div>

        <div className={styles.triggerList}>
          {decisionTriggers.map((item) => (
            <article key={item} className={styles.trigger}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="decision-method-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-method-title">Méthode en 8 étapes</h3>
            <p>
              La séquence à suivre avant toute recommandation, puis avant toute implémentation.
            </p>
          </div>
          <span className={styles.badge}>De la reformulation à l&apos;historisation</span>
        </div>

        <div className={styles.stepsGrid}>
          {decisionSteps.map((step) => (
            <article key={step.id} className={styles.step}>
              <div className={styles.stepHeader}>
                <strong>{step.title}</strong>
                <span>Livrables attendus</span>
              </div>
              <p>{step.description}</p>
              <ul>
                {step.outputs.map((output) => (
                  <li key={output}>{output}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="decision-questions-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-questions-title">Questions stratégiques à poser avant de trancher</h3>
            <p>
              Ce filtre évite les décisions prises trop vite, par enthousiasme, fatigue ou coût déjà
              engagé.
            </p>
          </div>
          <span className={styles.badge}>5 à 10 questions utiles, jamais plus</span>
        </div>

        <div className={styles.questionGrid}>
          {strategicQuestions.map((item) => (
            <article key={item.id} className={styles.questionCard}>
              <div className={styles.questionHead}>
                <span>{item.category}</span>
                <strong>{item.question}</strong>
              </div>
              <p>{item.whyItMatters}</p>
            </article>
          ))}
        </div>

        <div className={styles.callout}>
          <p>
            Si plusieurs réponses restent floues, la bonne décision peut être de reporter, de tester
            plus petit ou de réduire le périmètre plutôt que de construire trop tôt.
          </p>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="decision-criteria-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-criteria-title">Critères de comparaison des options</h3>
            <p>
              Chaque option réaliste doit être comparée sur ces critères avant toute recommandation
              claire.
            </p>
          </div>
          <span className={styles.badge}>Comparer plus de deux options si nécessaire</span>
        </div>

        <div className={styles.criteriaGrid}>
          {decisionCriteria.map((item) => (
            <article key={item.id} className={styles.criterion}>
              <span>{item.label}</span>
              <strong>{item.focus}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="decision-pilotage-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 id="decision-pilotage-title">Ce qui doit être mis à jour après validation</h3>
            <p>
              Une décision non historisée finit souvent par être oubliée, contredite ou refaite sans
              contexte.
            </p>
          </div>
          <span className={styles.badge}>Transformer chaque arbitrage en mémoire stratégique</span>
        </div>

        <div className={styles.outputGrid}>
          {pilotageOutputs.map((item) => (
            <article key={item} className={styles.output}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>

        <div className={styles.componentGrid}>
          {reusableDecisionComponents.map((item) => (
            <article key={item} className={styles.component}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
