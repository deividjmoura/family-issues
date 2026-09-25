import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Issues",
    short_name: "FamilyIssues",
    description: "Tarefas de casa com recompensa em R$ — verificação, saldo e negociação.",
    start_url: "/", display: "standalone", background_color: "#fbfcfe", theme_color: "#20a8e8",
    icons: { apple: "/apple-icon", icon: [
      { url: "/icons/192", sizes: "192x192", type: "image/png" },
      { url: "/icons/512", sizes: "512x512", type: "image/png" },
    ] },
  };
}
