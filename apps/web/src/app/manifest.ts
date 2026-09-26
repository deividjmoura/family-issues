import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Family Issues",
    short_name: "Family Issues",
    description:
      "Tarefas de casa com recompensa em R$ — verificação, saldo e negociação.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfcfe",
    theme_color: "#20a8e8",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
