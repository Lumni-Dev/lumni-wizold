export const COMPANY = {
  name: "Lumni",
  legalName: "Lumni - Serviços Digitais",
  taxId: "65.613.389/0001-96",
  site: "https://lumni.dev.br",
  description:
    "A Lumni desenvolve sistemas, automatiza processos e acopla engenheiros ao seu time. " +
    "Do primeiro diagnóstico ao código rodando em produção.",
  channels: [
    {
      kind: "mail" as const,
      label: "E-mail",
      value: "contact@lumni.dev.br",
      href: "mailto:contact@lumni.dev.br",
    },
    {
      kind: "message" as const,
      label: "WhatsApp",
      value: "+55 (16) 99244-7672",
      href: "https://wa.me/5516992447672",
    },
  ],
};
