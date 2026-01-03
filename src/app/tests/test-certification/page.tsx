// app/test-certification/page.tsx
"use client";
import CertificationBadge from "@/app/components/ui/CertificationBadge/CertificationBadge";
import CertificationCard from "@/app/components/ui/CertificationCard/CertificationCard";
import CertificationProgress from "@/app/components/ui/CertificationProgress/CertificationProgress";

export default function TestPage() {
  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Test Composants Certification</h1>
      
      {/* Badges - Différentes tailles */}
      <section>
        <h2>Badges (différentes tailles)</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <CertificationBadge level="verified" size="xs" />
          <CertificationBadge level="certified" size="sm" />
          <CertificationBadge level="premium" size="md" />
          <CertificationBadge level="elite" size="lg" />
        </div>
      </section>

      {/* Badges - Tous les niveaux */}
      <section>
        <h2>Tous les niveaux</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <CertificationBadge level="verified" />
          <CertificationBadge level="certified" />
          <CertificationBadge level="premium" />
          <CertificationBadge level="elite" />
        </div>
      </section>

      {/* Badges - Sans label */}
      <section>
        <h2>Badges sans label</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <CertificationBadge level="verified" showLabel={false} />
          <CertificationBadge level="certified" showLabel={false} />
          <CertificationBadge level="premium" showLabel={false} />
          <CertificationBadge level="elite" showLabel={false} />
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2>Cartes de certification</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {/* ✅ showBenefits sur CertificationCard, pas sur CertificationBadge */}
          <CertificationCard 
            level="verified" 
            showBenefits={true} 
          />
          <CertificationCard 
            level="certified" 
            showBenefits={true} 
          />
          <CertificationCard 
            level="premium" 
            showBenefits={true} 
            isCurrentLevel={true} 
          />
          <CertificationCard 
            level="elite" 
            showBenefits={true} 
          />
        </div>
      </section>

      {/* Progress - En cours */}
      <section>
        <h2>Progression (65% complétée)</h2>
        <CertificationProgress
          currentLevel="verified"
          progressPercentage={65}
          missingCriteria={[
            { 
              key: "missions", 
              label: "Complétez 5 missions", 
              description: "Finalisez vos premières missions", 
              is_met: false, 
              current_value: 2, 
              required_value: 5, 
              progress_percentage: 40 
            },
            { 
              key: "rating", 
              label: "Note moyenne 4.5/5", 
              description: "Maintenez une excellente qualité", 
              is_met: false, 
              current_value: 4.2, 
              required_value: 4.5 
            },
            { 
              key: "insurance", 
              label: "Assurance RC Pro validée", 
              description: "Envoyez votre attestation", 
              is_met: false, 
              current_value: false, 
              required_value: true 
            },
          ]}
        />
      </section>

      {/* Progress - Complétée */}
      <section>
        <h2>Progression (100% - Prêt à certifier)</h2>
        <CertificationProgress
          currentLevel="certified"
          progressPercentage={100}
          missingCriteria={[]}
          onViewDetails={() => alert("Demander la certification Premium !")}
        />
      </section>

      {/* Progress - Niveau maximum */}
      <section>
        <h2>Niveau maximum atteint</h2>
        <CertificationProgress
          currentLevel="elite"
          progressPercentage={100}
          missingCriteria={[]}
        />
      </section>
    </div>
  );
}