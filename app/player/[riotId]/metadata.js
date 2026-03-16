const SITE_URL = "https://trackerx.vercel.app";

export async function generateMetadata({ params, searchParams }) {
  const { riotId } = await params;
  const resolved = await searchParams;
  const region = resolved?.region || "na";

  const decoded = decodeURIComponent(riotId);
  const lastDash = decoded.lastIndexOf("-");
  const gameName = lastDash === -1 ? decoded : decoded.slice(0, lastDash);
  const tagLine  = lastDash === -1 ? ""      : decoded.slice(lastDash + 1);

  const displayId  = `${gameName}#${tagLine}`;
  const regionName = region.toUpperCase();
  const pageUrl    = `${SITE_URL}/player/${riotId}?region=${region}`;

  const title       = `${displayId} — Valorant Stats`;
  const description = `${displayId}'s Valorant stats on TrackerX. Rank, match history, K/D, ACS, HS% and agent analytics for ${regionName}.`;

  return {
    title,
    description,
    keywords: [
      `${displayId} Valorant`,
      `${displayId} stats`,
      "Valorant tracker",
      `${regionName} Valorant`,
      "TrackerX",
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${title} | TrackerX`,
      description,
      url: pageUrl,
      type: "profile",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${displayId} Valorant Stats` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TrackerX`,
      description,
      images: ["/og-image.png"],
    },
  };
}
