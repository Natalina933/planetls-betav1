import Head from "next/head";
import HomeContent from "./HomePage";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Head>
        <title>PlanetLS | Location saisonniere intelligente</title>
        <meta
          name="description"
          content="Connectez proprietaires et conciergeries independantes pour une gestion locative optimisee. Inscription gratuite."
        />
        <meta
          name="keywords"
          content="location saisonniere, conciergerie, proprietaires, gestion locative, PlanetLS"
        />
        <meta property="og:image" content="/images/planetls-banner.png" />
      </Head>

      <main>
        <HomeContent />
      </main>
    </>
  );
}
