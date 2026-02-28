import Head from "next/head";
import HomeContent from "./HomePage";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PlanetLS | Location saisonnière intelligente</title>
        <meta
          name="description"
          content="Connectez propriétaires et conciergeries indépendantes pour une gestion locative optimisée. Inscription gratuite."
        />
        <meta
          name="keywords"
          content="location saisonnière, conciergerie, propriétaires, gestion locative, PlanetLS"
        />
        <meta property="og:image" content="/images/planetls-banner.png" />
      </Head>

      <main>
        <HomeContent />
      </main>
    </>
  );
}
