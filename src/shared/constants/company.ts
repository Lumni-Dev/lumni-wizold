import { SITE_EMAIL } from "./site";

export const COMPANY = {
  name: "Lumni",
  legalName: "Lumni - Serviços Digitais",
  taxId: "65.613.389/0001-96",
  site: "https://lumni.dev.br",
  privacyUrl: "https://lumni.dev.br/privacy",
  termsUrl: "https://lumni.dev.br/terms",
  description:
    "Lumni builds systems, automates processes and attaches engineers to your team. " +
    "From the first diagnosis to code running in production.",
  channels: [
    {
      kind: "mail" as const,
      label: "E-mail",
      value: SITE_EMAIL,
      href: "mailto:" + SITE_EMAIL,
    },
  ],
};
