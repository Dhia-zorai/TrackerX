export async function generateMetadata({ params, searchParams }) {
  const { riotId } = await params;
  // Decode the Riot ID from URL format
  const decoded = decodeURIComponent(riotId);
  const lastDash = decoded.lastIndexOf("-");
  const gameName = lastDash === -1 ? decoded : decoded.slice(0, lastDash);
  const tagLine = lastDash === -1 ? "" : decoded.slice(lastDash + 1);
  const region = searchParams?.region || "na";
  
  const riotIdDisplay = `${gameName}#${tagLine}`;
  const regionName = region.toUpperCase();

  return {
    title: `${riotIdDisplay} — Valorant Stats | TrackerX`,
    description: `View ${riotIdDisplay}'s Valorant competitive stats, match history, rank, and performance analytics on TrackerX. Powered by advanced data tracking.`,
    keywords: `${riotIdDisplay}, Valorant stats, rank tracker, competitive gaming, ${regionName} region`,
    openGraph: {
      title: `${riotIdDisplay} — Valorant Stats | TrackerX`,
      description: `Check out ${riotIdDisplay}'s Valorant statistics and performance on TrackerX`,
      url: `https://trackerx.vercel.app/player/${riotId}?region=${region}`,
      type: "profile",
      images: [
        {
          url: "https://trackerx.vercel.app/og-player.png",
          width: 1200,
          height: 630,
          alt: `${riotIdDisplay} Valorant Stats`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${riotIdDisplay} — Valorant Stats`,
      description: `Check out ${riotIdDisplay}'s competitive stats on TrackerX`,
      images: ["https://trackerx.vercel.app/og-player.png"],
    },
  };
}
