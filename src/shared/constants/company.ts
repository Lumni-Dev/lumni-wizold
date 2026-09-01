import { SITE_EMAIL } from "./site";

export const COMPANY = {
  name: "Lumni",
  legalName: "Lumni - Serviços Digitais",
  taxId: "65.613.389/0001-96",
  site: "https://lumni.dev.br",
  privacyUrl: "https://lumni.dev.br/privacy",
  termsUrl: "https://lumni.dev.br/terms",
  description:
    "A Lumni desenvolve sistemas, automatiza processos e acopla engenheiros ao seu time. " +
    "Do primeiro diagnóstico ao código rodando em produção.",
  channels: [
    {
      kind: "mail" as const,
      label: "E-mail",
      value: SITE_EMAIL,
      href: "mailto:" + SITE_EMAIL,
    },
  ],
};
