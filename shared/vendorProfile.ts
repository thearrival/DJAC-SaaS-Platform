export type VendorProfileLocale = "en" | "zh" | "ar";

type LocalizedLabel = {
  en: string;
  zh: string;
  ar?: string;
};

export type VendorOption<T extends string = string> = {
  value: T;
  labels: LocalizedLabel;
};

export const vendorIndustryValues = [
  "software-saas",
  "cloud-digital-infrastructure",
  "financial-services",
  "healthcare-life-sciences",
  "government-public-sector",
  "telecommunications",
  "energy-utilities",
  "manufacturing-operational-technology",
  "retail-ecommerce",
  "logistics-supply-chain",
  "professional-services",
  "other",
] as const;

export type VendorIndustry = (typeof vendorIndustryValues)[number];

export const vendorIndustryOptions: ReadonlyArray<
  VendorOption<VendorIndustry>
> = [
  {
    value: "software-saas",
    labels: {
      en: "Software / SaaS",
      zh: "Φ╜»Σ╗╢ / SaaS",
      ar: "╪º┘ä╪¿╪▒┘à╪¼┘è╪º╪¬ / SaaS",
    },
  },
  {
    value: "cloud-digital-infrastructure",
    labels: {
      en: "Cloud / Digital Infrastructure",
      zh: "Σ║æΣ╕Äµò░σ¡ùσƒ║τíÇΦ«╛µû╜",
      ar: "╪º┘ä╪│╪¡╪º╪¿╪⌐ ┘ê╪º┘ä╪¿┘å┘è╪⌐ ╪º┘ä╪▒┘é┘à┘è╪⌐",
    },
  },
  {
    value: "financial-services",
    labels: { en: "Financial Services", zh: "ΘçæΦ₧ìµ£ìσèí", ar: "╪º┘ä╪«╪»┘à╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐" },
  },
  {
    value: "healthcare-life-sciences",
    labels: {
      en: "Healthcare / Life Sciences",
      zh: "σî╗τûùΣ╕Äτöƒσæ╜τºæσ¡ª",
      ar: "╪º┘ä╪▒╪╣╪º┘è╪⌐ ╪º┘ä╪╡╪¡┘è╪⌐ ┘ê╪╣┘ä┘ê┘à ╪º┘ä╪¡┘è╪º╪⌐",
    },
  },
  {
    value: "government-public-sector",
    labels: {
      en: "Government / Public Sector",
      zh: "µö┐σ║£ / σà¼σà▒Θâ¿Θù¿",
      ar: "╪º┘ä╪¡┘â┘ê┘à╪⌐ ┘ê╪º┘ä┘é╪╖╪º╪╣ ╪º┘ä╪╣╪º┘à",
    },
  },
  {
    value: "telecommunications",
    labels: { en: "Telecommunications", zh: "τö╡Σ┐í", ar: "╪º┘ä╪º╪¬╪╡╪º┘ä╪º╪¬" },
  },
  {
    value: "energy-utilities",
    labels: {
      en: "Energy / Utilities",
      zh: "Φâ╜µ║É / σà¼τö¿Σ║ïΣ╕Ü",
      ar: "╪º┘ä╪╖╪º┘é╪⌐ ┘ê╪º┘ä┘à╪▒╪º┘ü┘é",
    },
  },
  {
    value: "manufacturing-operational-technology",
    labels: {
      en: "Manufacturing / OT",
      zh: "σê╢ΘÇá / OT",
      ar: "╪º┘ä╪¬╪╡┘å┘è╪╣ / ╪º┘ä╪¬┘é┘å┘è╪⌐ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐",
    },
  },
  {
    value: "retail-ecommerce",
    labels: {
      en: "Retail / E-commerce",
      zh: "Θ¢╢σö« / τö╡σòå",
      ar: "╪º┘ä╪¬╪¼╪▓╪ª╪⌐ / ╪º┘ä╪¬╪¼╪º╪▒╪⌐ ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪⌐",
    },
  },
  {
    value: "logistics-supply-chain",
    labels: {
      en: "Logistics / Supply Chain",
      zh: "τë⌐µ╡ü / Σ╛¢σ║öΘô╛",
      ar: "╪º┘ä┘ä┘ê╪¼╪│╪¬┘è╪º╪¬ / ╪│┘ä╪º╪│┘ä ╪º┘ä╪Ñ┘à╪»╪º╪»",
    },
  },
  {
    value: "professional-services",
    labels: {
      en: "Professional Services",
      zh: "Σ╕ôΣ╕Üµ£ìσèí",
      ar: "╪º┘ä╪«╪»┘à╪º╪¬ ╪º┘ä┘à┘ç┘å┘è╪⌐",
    },
  },
  { value: "other", labels: { en: "Other", zh: "σà╢Σ╗û", ar: "╪ú╪«╪▒┘ë" } },
];

export const vendorServiceTypeValues = [
  "saas",
  "paas",
  "iaas",
  "managed-service-provider",
  "managed-security-service-provider",
  "payment-processor",
  "telecom-network",
  "colocation-data-center",
  "business-process-outsourcing",
  "professional-services",
  "other",
] as const;

export type VendorServiceType = (typeof vendorServiceTypeValues)[number];

export const vendorServiceTypeOptions: ReadonlyArray<
  VendorOption<VendorServiceType>
> = [
  { value: "saas", labels: { en: "SaaS", zh: "SaaS", ar: "╪º┘ä╪¿╪▒┘à╪¼┘è╪º╪¬ ┘â╪«╪»┘à╪⌐" } },
  { value: "paas", labels: { en: "PaaS", zh: "PaaS", ar: "╪º┘ä┘à┘å╪╡╪⌐ ┘â╪«╪»┘à╪⌐" } },
  {
    value: "iaas",
    labels: { en: "IaaS", zh: "IaaS", ar: "╪º┘ä╪¿┘å┘è╪⌐ ╪º┘ä╪¬╪¡╪¬┘è╪⌐ ┘â╪«╪»┘à╪⌐" },
  },
  {
    value: "managed-service-provider",
    labels: {
      en: "Managed Service Provider",
      zh: "µëÿτ«íµ£ìσèíµÅÉΣ╛¢σòå",
      ar: "┘à╪▓┘ê╪» ╪«╪»┘à╪º╪¬ ┘à┘Å╪»╪º╪▒╪⌐",
    },
  },
  {
    value: "managed-security-service-provider",
    labels: {
      en: "Managed Security Service Provider",
      zh: "µëÿτ«íσ«ëσà¿µ£ìσèíµÅÉΣ╛¢σòå",
      ar: "┘à╪▓┘ê╪» ╪«╪»┘à╪º╪¬ ╪ú┘à┘å┘è╪⌐ ┘à┘Å╪»╪º╪▒╪⌐",
    },
  },
  {
    value: "payment-processor",
    labels: { en: "Payment Processor", zh: "µö»Σ╗ÿσñäτÉåσòå", ar: "┘à╪╣╪º┘ä╪¼ ┘à╪»┘ü┘ê╪╣╪º╪¬" },
  },
  {
    value: "telecom-network",
    labels: {
      en: "Telecom / Network Provider",
      zh: "τö╡Σ┐í / τ╜æτ╗£µÅÉΣ╛¢σòå",
      ar: "┘à╪▓┘ê╪» ╪º╪¬╪╡╪º┘ä╪º╪¬ / ╪┤╪¿┘â╪⌐",
    },
  },
  {
    value: "colocation-data-center",
    labels: {
      en: "Colocation / Data Center",
      zh: "µ£║µê┐µëÿτ«í / µò░µì«Σ╕¡σ┐â",
      ar: "╪º╪│╪¬╪╢╪º┘ü╪⌐ / ┘à╪▒┘â╪▓ ╪¿┘è╪º┘å╪º╪¬",
    },
  },
  {
    value: "business-process-outsourcing",
    labels: {
      en: "Business Process Outsourcing",
      zh: "Σ╕Üσèíµ╡üτ¿ïσñûσîà",
      ar: "╪º┘ä╪º╪│╪¬╪╣╪º┘å╪⌐ ╪¿┘à╪╡╪º╪»╪▒ ╪«╪º╪▒╪¼┘è╪⌐ ┘ä┘ä╪╣┘à┘ä┘è╪º╪¬",
    },
  },
  {
    value: "professional-services",
    labels: {
      en: "Professional Services",
      zh: "Σ╕ôΣ╕Üµ£ìσèí",
      ar: "╪º┘ä╪«╪»┘à╪º╪¬ ╪º┘ä┘à┘ç┘å┘è╪⌐",
    },
  },
  { value: "other", labels: { en: "Other", zh: "σà╢Σ╗û", ar: "╪ú╪«╪▒┘ë" } },
];

export const vendorCloudProviderValues = [
  "aws",
  "azure",
  "gcp",
  "oracle-cloud",
  "alibaba-cloud",
  "huawei-cloud",
  "tencent-cloud",
  "stc-cloud",
  "private-cloud",
  "other",
] as const;

export type VendorCloudProvider = (typeof vendorCloudProviderValues)[number];

export const vendorCloudProviderOptions: ReadonlyArray<
  VendorOption<VendorCloudProvider>
> = [
  { value: "aws", labels: { en: "AWS", zh: "AWS", ar: "AWS" } },
  {
    value: "azure",
    labels: { en: "Microsoft Azure", zh: "σ╛«Φ╜» Azure", ar: "┘à╪º┘è┘â╪▒┘ê╪│┘ê┘ü╪¬ Azure" },
  },
  {
    value: "gcp",
    labels: { en: "Google Cloud", zh: "Φ░╖µ¡îΣ║æ", ar: "Google Cloud" },
  },
  {
    value: "oracle-cloud",
    labels: { en: "Oracle Cloud", zh: "τö▓Θ¬¿µûçΣ║æ", ar: "Oracle Cloud" },
  },
  {
    value: "alibaba-cloud",
    labels: { en: "Alibaba Cloud", zh: "Θÿ┐ΘçîΣ║æ", ar: "Alibaba Cloud" },
  },
  {
    value: "huawei-cloud",
    labels: { en: "Huawei Cloud", zh: "σìÄΣ╕║Σ║æ", ar: "Huawei Cloud" },
  },
  {
    value: "tencent-cloud",
    labels: { en: "Tencent Cloud", zh: "Φà╛Φ«»Σ║æ", ar: "Tencent Cloud" },
  },
  {
    value: "stc-cloud",
    labels: { en: "stc Cloud", zh: "stc Σ║æ", ar: "stc Cloud" },
  },
  {
    value: "private-cloud",
    labels: {
      en: "Private Cloud / VMware",
      zh: "τºüµ£ëΣ║æ / VMware",
      ar: "╪│╪¡╪º╪¿╪⌐ ╪«╪º╪╡╪⌐ / VMware",
    },
  },
  { value: "other", labels: { en: "Other", zh: "σà╢Σ╗û", ar: "╪ú╪«╪▒┘ë" } },
];

export const vendorHostingEnvironmentValues = [
  "on-premises",
  "private-cloud",
  "single-public-cloud",
  "multi-cloud",
  "hybrid",
] as const;

export type VendorHostingEnvironment =
  (typeof vendorHostingEnvironmentValues)[number];

export const vendorHostingEnvironmentOptions: ReadonlyArray<
  VendorOption<VendorHostingEnvironment>
> = [
  {
    value: "on-premises",
    labels: { en: "On-premises", zh: "µ£¼σ£░Θâ¿τ╜▓", ar: "╪»╪º╪«┘ä ╪º┘ä┘à╪ñ╪│╪│╪⌐" },
  },
  {
    value: "private-cloud",
    labels: { en: "Private Cloud", zh: "τºüµ£ëΣ║æ", ar: "╪│╪¡╪º╪¿╪⌐ ╪«╪º╪╡╪⌐" },
  },
  {
    value: "single-public-cloud",
    labels: {
      en: "Single Public Cloud",
      zh: "σìòΣ╕Çσà¼µ£ëΣ║æ",
      ar: "╪│╪¡╪º╪¿╪⌐ ╪╣╪º┘à╪⌐ ┘ê╪º╪¡╪»╪⌐",
    },
  },
  {
    value: "multi-cloud",
    labels: { en: "Multi-cloud", zh: "σñÜΣ║æ", ar: "┘à╪¬╪╣╪»╪» ╪º┘ä╪│╪¡╪º╪¿╪º╪¬" },
  },
  { value: "hybrid", labels: { en: "Hybrid", zh: "µ╖╖σÉê", ar: "┘ç╪¼┘è┘å╪⌐" } },
];

export const vendorCountryValues = [
  "saudi-arabia",
  "china",
  "eu",
  "us",
  "brazil",
  "global",
  "united-arab-emirates",
  "bahrain",
  "singapore",
  "india",
  "germany",
  "netherlands",
  "united-kingdom",
  "united-states",
  "canada",
  "australia",
  "japan",
  "south-korea",
  "south-africa",
  "mexico",
  "qatar",
  "kuwait",
  "oman",
  "jordan",
  "egypt",
  "indonesia",
  "thailand",
  "vietnam",
  "philippines",
  "malaysia",
  "nigeria",
  "kenya",
  "other",
] as const;

export type VendorCountry = (typeof vendorCountryValues)[number];

export const vendorCountryOptions: ReadonlyArray<VendorOption<VendorCountry>> =
  [
    {
      value: "eu",
      labels: { en: "European Union", zh: "µ¼ºτ¢ƒ", ar: "╪º┘ä╪º╪¬╪¡╪º╪» ╪º┘ä╪ú┘ê╪▒┘ê╪¿┘è" },
    },
    {
      value: "us",
      labels: { en: "United States", zh: "τ╛Äσ¢╜", ar: "╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
    },
    { value: "brazil", labels: { en: "Brazil", zh: "σ╖┤ΦÑ┐", ar: "╪º┘ä╪¿╪▒╪º╪▓┘è┘ä" } },
    { value: "global", labels: { en: "Global", zh: "σà¿τÉâ", ar: "╪╣╪º┘ä┘à┘è" } },
    {
      value: "saudi-arabia",
      labels: {
        en: "Saudi Arabia",
        zh: "µ▓Öτë╣Θÿ┐µïëΣ╝»",
        ar: "╪º┘ä┘à┘à┘ä┘â╪⌐ ╪º┘ä╪╣╪▒╪¿┘è╪⌐ ╪º┘ä╪│╪╣┘ê╪»┘è╪⌐",
      },
    },
    { value: "china", labels: { en: "China", zh: "Σ╕¡σ¢╜", ar: "╪º┘ä╪╡┘è┘å" } },
    {
      value: "united-arab-emirates",
      labels: {
        en: "United Arab Emirates",
        zh: "Θÿ┐ΦüöΘàï",
        ar: "╪º┘ä╪Ñ┘à╪º╪▒╪º╪¬ ╪º┘ä╪╣╪▒╪¿┘è╪⌐ ╪º┘ä┘à╪¬╪¡╪»╪⌐",
      },
    },
    { value: "bahrain", labels: { en: "Bahrain", zh: "σ╖┤µ₧ù", ar: "╪º┘ä╪¿╪¡╪▒┘è┘å" } },
    {
      value: "singapore",
      labels: { en: "Singapore", zh: "µû░σèáσ¥í", ar: "╪│┘å╪║╪º┘ü┘ê╪▒╪⌐" },
    },
    { value: "india", labels: { en: "India", zh: "σì░σ║ª", ar: "╪º┘ä┘ç┘å╪»" } },
    { value: "germany", labels: { en: "Germany", zh: "σ╛╖σ¢╜", ar: "╪ú┘ä┘à╪º┘å┘è╪º" } },
    {
      value: "netherlands",
      labels: { en: "Netherlands", zh: "Φì╖σà░", ar: "┘ç┘ê┘ä┘å╪»╪º" },
    },
    {
      value: "united-kingdom",
      labels: { en: "United Kingdom", zh: "Φï▒σ¢╜", ar: "╪º┘ä┘à┘à┘ä┘â╪⌐ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
    },
    {
      value: "united-states",
      labels: { en: "United States", zh: "τ╛Äσ¢╜", ar: "╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
    },
    {
      value: "canada",
      labels: { en: "Canada", zh: "σèáµï┐σñº", ar: "┘â┘å╪»╪º" },
    },
    {
      value: "australia",
      labels: { en: "Australia", zh: "µ╛│σñºσê⌐Σ║Ü", ar: "╪ú╪│╪¬╪▒╪º┘ä┘è╪º" },
    },
    { value: "japan", labels: { en: "Japan", zh: "µùÑµ£¼", ar: "╪º┘ä┘è╪º╪¿╪º┘å" } },
    {
      value: "south-korea",
      labels: { en: "South Korea", zh: "Θƒ⌐σ¢╜", ar: "┘â┘ê╪▒┘è╪º ╪º┘ä╪¼┘å┘ê╪¿┘è╪⌐" },
    },
    {
      value: "south-africa",
      labels: { en: "South Africa", zh: "σìùΘ¥₧", ar: "╪¼┘å┘ê╪¿ ╪ú┘ü╪▒┘è┘é┘è╪º" },
    },
    { value: "mexico", labels: { en: "Mexico", zh: "σó¿ΦÑ┐σôÑ", ar: "╪º┘ä┘à┘â╪│┘è┘â" } },
    { value: "qatar", labels: { en: "Qatar", zh: "σìíσíöσ░ö", ar: "┘é╪╖╪▒" } },
    { value: "kuwait", labels: { en: "Kuwait", zh: "τºæσ¿üτë╣", ar: "╪º┘ä┘â┘ê┘è╪¬" } },
    { value: "oman", labels: { en: "Oman", zh: "Θÿ┐µ¢╝", ar: "╪╣┘Å┘à╪º┘å" } },
    { value: "jordan", labels: { en: "Jordan", zh: "τ║ªµùª", ar: "╪º┘ä╪ú╪▒╪»┘å" } },
    { value: "egypt", labels: { en: "Egypt", zh: "σƒâσÅè", ar: "┘à╪╡╪▒" } },
    {
      value: "indonesia",
      labels: { en: "Indonesia", zh: "σì░σ║ªσ░╝ΦÑ┐Σ║Ü", ar: "╪Ñ┘å╪»┘ê┘å┘è╪│┘è╪º" },
    },
    {
      value: "thailand",
      labels: { en: "Thailand", zh: "µ│░σ¢╜", ar: "╪¬╪º┘è┘ä╪º┘å╪»" },
    },
    { value: "vietnam", labels: { en: "Vietnam", zh: "Φ╢èσìù", ar: "┘ü┘è╪¬┘å╪º┘à" } },
    {
      value: "philippines",
      labels: { en: "Philippines", zh: "ΦÅ▓σ╛ïσ«╛", ar: "╪º┘ä┘ü┘ä╪¿┘è┘å" },
    },
    {
      value: "malaysia",
      labels: { en: "Malaysia", zh: "Θ⌐¼µ¥ÑΦÑ┐Σ║Ü", ar: "┘à╪º┘ä┘è╪▓┘è╪º" },
    },
    {
      value: "nigeria",
      labels: { en: "Nigeria", zh: "σ░╝µùÑσê⌐Σ║Ü", ar: "┘å┘è╪¼┘è╪▒┘è╪º" },
    },
    { value: "kenya", labels: { en: "Kenya", zh: "Φé»σ░╝Σ║Ü", ar: "┘â┘è┘å┘è╪º" } },
    { value: "other", labels: { en: "Other", zh: "σà╢Σ╗û", ar: "╪ú╪«╪▒┘ë" } },
  ];

export const vendorJurisdictionValues = [
  "saudi-arabia",
  "china",
  "eu",
  "us",
  "brazil",
  "global",
  "gcc",
  "eu-eea",
  "united-kingdom",
  "united-states",
  "apac",
  "canada",
  "australia",
  "japan",
  "south-korea",
  "south-africa",
  "mexico",
  "qatar",
  "kuwait",
  "bahrain",
  "oman",
  "jordan",
  "egypt",
  "indonesia",
  "thailand",
  "vietnam",
  "philippines",
  "malaysia",
  "nigeria",
  "kenya",
] as const;

export type VendorJurisdiction = (typeof vendorJurisdictionValues)[number];

export const vendorJurisdictionOptions: ReadonlyArray<
  VendorOption<VendorJurisdiction>
> = [
  {
    value: "eu",
    labels: { en: "European Union", zh: "µ¼ºτ¢ƒ", ar: "╪º┘ä╪º╪¬╪¡╪º╪» ╪º┘ä╪ú┘ê╪▒┘ê╪¿┘è" },
  },
  {
    value: "us",
    labels: { en: "United States", zh: "τ╛Äσ¢╜", ar: "╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
  },
  { value: "brazil", labels: { en: "Brazil", zh: "σ╖┤ΦÑ┐", ar: "╪º┘ä╪¿╪▒╪º╪▓┘è┘ä" } },
  { value: "global", labels: { en: "Global", zh: "σà¿τÉâ", ar: "╪╣╪º┘ä┘à┘è" } },
  {
    value: "saudi-arabia",
    labels: {
      en: "Saudi Arabia",
      zh: "µ▓Öτë╣Θÿ┐µïëΣ╝»",
      ar: "╪º┘ä┘à┘à┘ä┘â╪⌐ ╪º┘ä╪╣╪▒╪¿┘è╪⌐ ╪º┘ä╪│╪╣┘ê╪»┘è╪⌐",
    },
  },
  { value: "china", labels: { en: "China", zh: "Σ╕¡σ¢╜", ar: "╪º┘ä╪╡┘è┘å" } },
  {
    value: "gcc",
    labels: { en: "GCC", zh: "µ╡╖σÉêΣ╝Ü", ar: "┘à╪¼┘ä╪│ ╪º┘ä╪¬╪╣╪º┘ê┘å ╪º┘ä╪«┘ä┘è╪¼┘è" },
  },
  {
    value: "eu-eea",
    labels: {
      en: "EU / EEA",
      zh: "µ¼ºτ¢ƒ / µ¼ºµ┤▓τ╗Åµ╡Äσî║",
      ar: "╪º┘ä╪º╪¬╪¡╪º╪» ╪º┘ä╪ú┘ê╪▒┘ê╪¿┘è / ╪º┘ä┘à┘å╪╖┘é╪⌐ ╪º┘ä╪º┘é╪¬╪╡╪º╪»┘è╪⌐ ╪º┘ä╪ú┘ê╪▒┘ê╪¿┘è╪⌐",
    },
  },
  {
    value: "united-kingdom",
    labels: { en: "United Kingdom", zh: "Φï▒σ¢╜", ar: "╪º┘ä┘à┘à┘ä┘â╪⌐ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
  },
  {
    value: "united-states",
    labels: { en: "United States", zh: "τ╛Äσ¢╜", ar: "╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘à╪¬╪¡╪»╪⌐" },
  },
  {
    value: "apac",
    labels: { en: "APAC", zh: "Σ║Üσñ¬", ar: "╪ó╪│┘è╪º ┘ê╪º┘ä┘à╪¡┘è╪╖ ╪º┘ä┘ç╪º╪»╪ª" },
  },
  {
    value: "canada",
    labels: { en: "Canada", zh: "σèáµï┐σñº", ar: "┘â┘å╪»╪º" },
  },
  {
    value: "australia",
    labels: { en: "Australia", zh: "µ╛│σñºσê⌐Σ║Ü", ar: "╪ú╪│╪¬╪▒╪º┘ä┘è╪º" },
  },
  { value: "japan", labels: { en: "Japan", zh: "µùÑµ£¼", ar: "╪º┘ä┘è╪º╪¿╪º┘å" } },
  {
    value: "south-korea",
    labels: { en: "South Korea", zh: "Θƒ⌐σ¢╜", ar: "┘â┘ê╪▒┘è╪º ╪º┘ä╪¼┘å┘ê╪¿┘è╪⌐" },
  },
  {
    value: "south-africa",
    labels: { en: "South Africa", zh: "σìùΘ¥₧", ar: "╪¼┘å┘ê╪¿ ╪ú┘ü╪▒┘è┘é┘è╪º" },
  },
  { value: "mexico", labels: { en: "Mexico", zh: "σó¿ΦÑ┐σôÑ", ar: "╪º┘ä┘à┘â╪│┘è┘â" } },
  { value: "qatar", labels: { en: "Qatar", zh: "σìíσíöσ░ö", ar: "┘é╪╖╪▒" } },
  { value: "kuwait", labels: { en: "Kuwait", zh: "τºæσ¿üτë╣", ar: "╪º┘ä┘â┘ê┘è╪¬" } },
  { value: "bahrain", labels: { en: "Bahrain", zh: "σ╖┤µ₧ù", ar: "╪º┘ä╪¿╪¡╪▒┘è┘å" } },
  { value: "oman", labels: { en: "Oman", zh: "Θÿ┐µ¢╝", ar: "╪╣┘Å┘à╪º┘å" } },
  { value: "jordan", labels: { en: "Jordan", zh: "τ║ªµùª", ar: "╪º┘ä╪ú╪▒╪»┘å" } },
  { value: "egypt", labels: { en: "Egypt", zh: "σƒâσÅè", ar: "┘à╪╡╪▒" } },
  {
    value: "indonesia",
    labels: { en: "Indonesia", zh: "σì░σ║ªσ░╝ΦÑ┐Σ║Ü", ar: "╪Ñ┘å╪»┘ê┘å┘è╪│┘è╪º" },
  },
  {
    value: "thailand",
    labels: { en: "Thailand", zh: "µ│░σ¢╜", ar: "╪¬╪º┘è┘ä╪º┘å╪»" },
  },
  { value: "vietnam", labels: { en: "Vietnam", zh: "Φ╢èσìù", ar: "┘ü┘è╪¬┘å╪º┘à" } },
  {
    value: "philippines",
    labels: { en: "Philippines", zh: "ΦÅ▓σ╛ïσ«╛", ar: "╪º┘ä┘ü┘ä╪¿┘è┘å" },
  },
  {
    value: "malaysia",
    labels: { en: "Malaysia", zh: "Θ⌐¼µ¥ÑΦÑ┐Σ║Ü", ar: "┘à╪º┘ä┘è╪▓┘è╪º" },
  },
  {
    value: "nigeria",
    labels: { en: "Nigeria", zh: "σ░╝µùÑσê⌐Σ║Ü", ar: "┘å┘è╪¼┘è╪▒┘è╪º" },
  },
  { value: "kenya", labels: { en: "Kenya", zh: "Φé»σ░╝Σ║Ü", ar: "┘â┘è┘å┘è╪º" } },
];

export const vendorComplianceStandardValues = [
  "iso-27001",
  "iso-27701",
  "soc-2-type-ii",
  "pci-dss",
  "csa-star",
  "nist-csf-aligned",
  "nca-ecc",
  "nca-ccc",
  "mlps-2.0",
  "privacy-impact-assessment-program",
] as const;

export type VendorComplianceStandard =
  (typeof vendorComplianceStandardValues)[number];

export const vendorComplianceStandardOptions: ReadonlyArray<
  VendorOption<VendorComplianceStandard>
> = [
  {
    value: "iso-27001",
    labels: { en: "ISO 27001", zh: "ISO 27001", ar: "ISO 27001" },
  },
  {
    value: "iso-27701",
    labels: { en: "ISO 27701", zh: "ISO 27701", ar: "ISO 27701" },
  },
  {
    value: "soc-2-type-ii",
    labels: { en: "SOC 2 Type II", zh: "SOC 2 Type II", ar: "SOC 2 Type II" },
  },
  { value: "pci-dss", labels: { en: "PCI DSS", zh: "PCI DSS", ar: "PCI DSS" } },
  {
    value: "csa-star",
    labels: { en: "CSA STAR", zh: "CSA STAR", ar: "CSA STAR" },
  },
  {
    value: "nist-csf-aligned",
    labels: {
      en: "NIST CSF aligned",
      zh: "τ¼ªσÉê NIST CSF",
      ar: "┘à╪¬┘ê╪º┘ü┘é ┘à╪╣ NIST CSF",
    },
  },
  { value: "nca-ecc", labels: { en: "NCA ECC", zh: "NCA ECC", ar: "NCA ECC" } },
  { value: "nca-ccc", labels: { en: "NCA CCC", zh: "NCA CCC", ar: "NCA CCC" } },
  {
    value: "mlps-2.0",
    labels: { en: "MLPS 2.0", zh: "MLPS 2.0", ar: "MLPS 2.0" },
  },
  {
    value: "privacy-impact-assessment-program",
    labels: {
      en: "Privacy impact assessment program",
      zh: "ΘÜÉτºüσ╜▒σôìΦ»äΣ╝░Φ«íσêÆ",
      ar: "╪¿╪▒┘å╪º┘à╪¼ ╪¬┘é┘è┘è┘à ╪ú╪½╪▒ ╪º┘ä╪«╪╡┘ê╪╡┘è╪⌐",
    },
  },
];

export const vendorDataProcessingActivityValues = [
  "customer-personal-data",
  "employee-data",
  "financial-payment-data",
  "health-biometric-data",
  "security-telemetry-logs",
  "source-code-intellectual-property",
  "operational-technology-data",
  "identity-access-data",
  "backup-disaster-recovery-data",
  "cross-border-data-transfer",
] as const;

export type VendorDataProcessingActivity =
  (typeof vendorDataProcessingActivityValues)[number];

export const vendorDataProcessingActivityOptions: ReadonlyArray<
  VendorOption<VendorDataProcessingActivity>
> = [
  {
    value: "customer-personal-data",
    labels: {
      en: "Customer personal data",
      zh: "σ«óµê╖Σ╕¬Σ║║µò░µì«",
      ar: "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪┤╪«╪╡┘è╪⌐ ┘ä┘ä╪╣┘à┘ä╪º╪í",
    },
  },
  {
    value: "employee-data",
    labels: { en: "Employee data", zh: "σæÿσ╖Ñµò░µì«", ar: "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à┘ê╪╕┘ü┘è┘å" },
  },
  {
    value: "financial-payment-data",
    labels: {
      en: "Financial / payment data",
      zh: "ΘçæΦ₧ì / µö»Σ╗ÿµò░µì«",
      ar: "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐ / ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪»┘ü╪╣",
    },
  },
  {
    value: "health-biometric-data",
    labels: {
      en: "Health / biometric data",
      zh: "σüÑσ║╖ / τöƒτë⌐Φ»åσê½µò░µì«",
      ar: "╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╡╪¡┘è╪⌐ / ╪º┘ä╪¿┘è┘ê┘à╪¬╪▒┘è╪⌐",
    },
  },
  {
    value: "security-telemetry-logs",
    labels: {
      en: "Security telemetry / logs",
      zh: "σ«ëσà¿ΘüÑµ╡ï / µùÑσ┐ù",
      ar: "┘é┘è╪º╪│╪º╪¬ ╪º┘ä╪ú┘à┘å / ╪º┘ä╪│╪¼┘ä╪º╪¬",
    },
  },
  {
    value: "source-code-intellectual-property",
    labels: {
      en: "Source code / intellectual property",
      zh: "µ║ÉΣ╗úτáü / τƒÑΦ»åΣ║ºµ¥â",
      ar: "╪º┘ä╪┤┘ü╪▒╪⌐ ╪º┘ä┘à╪╡╪»╪▒┘è╪⌐ / ╪º┘ä┘à┘ä┘â┘è╪⌐ ╪º┘ä┘ü┘â╪▒┘è╪⌐",
    },
  },
  {
    value: "operational-technology-data",
    labels: {
      en: "Operational technology data",
      zh: "Φ┐ÉΦÉÑµèÇµ£»µò░µì«",
      ar: "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪¬┘é┘å┘è╪⌐ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐",
    },
  },
  {
    value: "identity-access-data",
    labels: {
      en: "Identity / access data",
      zh: "Φ║½Σ╗╜ / Φ«┐Θù«µò░µì«",
      ar: "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘ç┘ê┘è╪⌐ / ╪º┘ä┘ê╪╡┘ê┘ä",
    },
  },
  {
    value: "backup-disaster-recovery-data",
    labels: {
      en: "Backup / disaster recovery data",
      zh: "σñçΣ╗╜ / τü╛σñçµò░µì«",
      ar: "╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘å╪│╪« ╪º┘ä╪º╪¡╪¬┘è╪º╪╖┘è / ╪º┘ä╪¬╪╣╪º┘ü┘è ┘à┘å ╪º┘ä┘â┘ê╪º╪▒╪½",
    },
  },
  {
    value: "cross-border-data-transfer",
    labels: {
      en: "Cross-border data transfer",
      zh: "Φ╖¿σóâµò░µì«Σ╝áΦ╛ô",
      ar: "┘å┘é┘ä ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪╣╪¿╪▒ ╪º┘ä╪¡╪»┘ê╪»",
    },
  },
];

export const vendorCriticalityLevelValues = [
  "low",
  "moderate",
  "high",
  "mission-critical",
] as const;

export type VendorCriticalityLevel =
  (typeof vendorCriticalityLevelValues)[number];

export const vendorCriticalityLevelOptions: ReadonlyArray<
  VendorOption<VendorCriticalityLevel>
> = [
  { value: "low", labels: { en: "Low", zh: "Σ╜Ä", ar: "┘à┘å╪«┘ü╪╢" } },
  { value: "moderate", labels: { en: "Moderate", zh: "Σ╕¡", ar: "┘à╪¬┘ê╪│╪╖" } },
  { value: "high", labels: { en: "High", zh: "Θ½ÿ", ar: "┘à╪▒╪¬┘ü╪╣" } },
  {
    value: "mission-critical",
    labels: { en: "Mission critical", zh: "σà│Θö«µá╕σ┐â", ar: "╪¡╪▒╪¼ ┘ä┘ä╪║╪º┘è╪⌐" },
  },
];

export const vendorRiskTierValues = [
  "tier-1-critical",
  "tier-2-high",
  "tier-3-moderate",
  "tier-4-low",
] as const;

export type VendorRiskTier = (typeof vendorRiskTierValues)[number];

export const vendorRiskTierOptions: ReadonlyArray<
  VendorOption<VendorRiskTier>
> = [
  {
    value: "tier-1-critical",
    labels: {
      en: "Tier 1 - Critical",
      zh: "Σ╕Çτ║º - σà│Θö«",
      ar: "╪º┘ä┘à╪│╪¬┘ê┘ë 1 - ╪¡╪▒╪¼",
    },
  },
  {
    value: "tier-2-high",
    labels: { en: "Tier 2 - High", zh: "Σ║îτ║º - Θ½ÿ", ar: "╪º┘ä┘à╪│╪¬┘ê┘ë 2 - ┘à╪▒╪¬┘ü╪╣" },
  },
  {
    value: "tier-3-moderate",
    labels: {
      en: "Tier 3 - Moderate",
      zh: "Σ╕ëτ║º - Σ╕¡",
      ar: "╪º┘ä┘à╪│╪¬┘ê┘ë 3 - ┘à╪¬┘ê╪│╪╖",
    },
  },
  {
    value: "tier-4-low",
    labels: { en: "Tier 4 - Low", zh: "σ¢¢τ║º - Σ╜Ä", ar: "╪º┘ä┘à╪│╪¬┘ê┘ë 4 - ┘à┘å╪«┘ü╪╢" },
  },
];

export const vendorDependencyLevelValues = [
  "none",
  "limited",
  "material",
  "extensive",
] as const;

export type VendorDependencyLevel =
  (typeof vendorDependencyLevelValues)[number];

export const vendorDependencyLevelOptions: ReadonlyArray<
  VendorOption<VendorDependencyLevel>
> = [
  { value: "none", labels: { en: "None", zh: "µùá", ar: "┘ä╪º ┘è┘ê╪¼╪»" } },
  { value: "limited", labels: { en: "Limited", zh: "µ£ëΘÖÉ", ar: "┘à╪¡╪»┘ê╪»" } },
  { value: "material", labels: { en: "Material", zh: "ΘçìΦªü", ar: "╪¼┘ê┘ç╪▒┘è" } },
  { value: "extensive", labels: { en: "Extensive", zh: "σ╣┐µ│¢", ar: "┘ê╪º╪│╪╣" } },
];

export type EnterpriseTechStackComponentInput = {
  componentName: string;
  componentType: string;
  technology: string;
  description?: string;
  dataHandling?: string;
};

export type EnterpriseVendorProfileInput = {
  vendorName: string;
  vendorDescription: string;
  industry: VendorIndustry | "";
  businessRegistrationNumber: string;
  headquartersLocation: VendorCountry | "";
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactRole: string;
  primaryContactPhone: string;
  serviceType: VendorServiceType | "";
  serviceScope: string;
  hostingEnvironment: VendorHostingEnvironment | "";
  cloudProviders: VendorCloudProvider[];
  operatingCountries: VendorCountry[];
  dataLocations: VendorCountry[];
  regulatoryJurisdictions: VendorJurisdiction[];
  certifications: VendorComplianceStandard[];
  dataProcessingActivities: VendorDataProcessingActivity[];
  criticalityLevel: VendorCriticalityLevel | "";
  riskTier: VendorRiskTier | "";
  thirdPartyDependencies: VendorDependencyLevel | "";
  fourthPartyDependencies: VendorDependencyLevel | "";
  techStackComponents?: EnterpriseTechStackComponentInput[];
};

export const vendorProfileCopy = {
  sectionCompany: {
    en: "Company Information",
    zh: "σà¼σÅ╕Σ┐íµü»",
    ar: "┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪┤╪▒┘â╪⌐",
  },
  sectionCompanyHint: {
    en: "Capture the supplier's legal identity and organizational context.",
    zh: "Φ«░σ╜òΣ╛¢σ║öσòåτÜäµ│òσ╛ïΦ║½Σ╗╜Σ╕Äτ╗äτ╗çΦâîµÖ»πÇé",
    ar: "╪│╪¼┘æ┘ä ╪º┘ä┘ç┘ê┘è╪⌐ ╪º┘ä┘é╪º┘å┘ê┘å┘è╪⌐ ┘ê╪º┘ä╪│┘è╪º┘é ╪º┘ä┘à╪ñ╪│╪│┘è ┘ä┘ä┘à┘ê╪▒┘æ╪».",
  },
  sectionService: {
    en: "Service & Infrastructure",
    zh: "µ£ìσèíΣ╕Äσƒ║τíÇΦ«╛µû╜",
    ar: "╪º┘ä╪«╪»┘à╪⌐ ┘ê╪º┘ä╪¿┘å┘è╪⌐ ╪º┘ä╪¬╪¡╪¬┘è╪⌐",
  },
  sectionServiceHint: {
    en: "Define what the vendor delivers, where it runs, and which jurisdictions it affects.",
    zh: "σ«ÜΣ╣ëΣ╛¢σ║öσòåµÅÉΣ╛¢τÜäµ£ìσèíπÇüΦ┐ÉΦíîτÄ»σóâΣ╗ÑσÅèσ╜▒σôìσê░τÜäµ│òσƒƒπÇé",
    ar: "╪¡╪»┘æ╪» ┘à╪º ┘è┘é╪»┘à┘ç ╪º┘ä┘à┘ê╪▒┘æ╪» ┘ê╪ú┘è┘å ┘è╪╣┘à┘ä ┘ê┘à╪º ┘ç┘è ╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘é╪╢╪º╪ª┘è╪⌐ ╪º┘ä┘à╪¬╪ú╪½╪▒╪⌐.",
  },
  sectionCompliance: {
    en: "Security & Compliance",
    zh: "σ«ëσà¿Σ╕ÄσÉêΦºä",
    ar: "╪º┘ä╪ú┘à┘å ┘ê╪º┘ä╪º┘à╪¬╪½╪º┘ä",
  },
  sectionComplianceHint: {
    en: "Record control attestations, data handling patterns, and regulatory exposure.",
    zh: "Φ«░σ╜òµÄºσê╢Φ«ñΦ»üπÇüµò░µì«σñäτÉåµ¿íσ╝ÅσÆîτ¢æτ«íµÜ┤Θ£▓Θ¥óπÇé",
    ar: "╪│╪¼┘æ┘ä ╪º┘ä╪º╪╣╪¬┘à╪º╪»╪º╪¬ ╪º┘ä╪▒┘é╪º╪¿┘è╪⌐ ┘ê╪ú┘å┘à╪º╪╖ ┘à╪╣╪º┘ä╪¼╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ┘ê╪º┘ä╪¬╪╣╪▒╪╢ ╪º┘ä╪¬┘å╪╕┘è┘à┘è.",
  },
  sectionRisk: {
    en: "Risk Classification",
    zh: "ΘúÄΘÖ⌐σêåτ▒╗",
    ar: "╪¬╪╡┘å┘è┘ü ╪º┘ä┘à╪«╪º╪╖╪▒",
  },
  sectionRiskHint: {
    en: "Classify inherent risk, business criticality, and supply-chain dependency depth.",
    zh: "σêåτ▒╗σ¢║µ£ëΘúÄΘÖ⌐πÇüΣ╕Üσèíσà│Θö«µÇºΣ╕ÄΣ╛¢σ║öΘô╛Σ╛¥Φ╡ûµ╖▒σ║ªπÇé",
    ar: "╪╡┘å┘æ┘ü ╪º┘ä┘à╪«╪º╪╖╪▒ ╪º┘ä┘â╪º┘à┘å╪⌐ ┘ê╪º┘ä╪ú┘ç┘à┘è╪⌐ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐ ┘ê╪╣┘à┘é ╪º┘ä╪¬╪¿╪╣┘è╪⌐ ┘ü┘è ╪│┘ä╪│┘ä╪⌐ ╪º┘ä╪¬┘ê╪▒┘è╪».",
  },
  sectionContact: {
    en: "Primary Contact",
    zh: "Σ╕╗ΦªüΦüöτ│╗Σ║║",
    ar: "╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐",
  },
  sectionContactHint: {
    en: "Store the accountable contact for due diligence, remediation, and evidence requests.",
    zh: "Σ┐¥σ¡ÿσ░╜Φ░âπÇüµò┤µö╣σÆîΦ»üµì«Φ»╖µ▒éτÜäΦ┤úΣ╗╗Φüöτ│╗Σ║║πÇé",
    ar: "╪º╪¡┘ü╪╕ ╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä┘à╪│╪ñ┘ê┘ä╪⌐ ╪╣┘å ╪º┘ä╪╣┘å╪º┘è╪⌐ ╪º┘ä┘ê╪º╪¼╪¿╪⌐ ┘ê╪º┘ä┘à╪╣╪º┘ä╪¼╪⌐ ┘ê╪╖┘ä╪¿╪º╪¬ ╪º┘ä╪ú╪»┘ä╪⌐.",
  },
  fieldBusinessRegistrationNumber: {
    en: "Business Registration Number",
    zh: "σòåΣ╕Üµ│¿σåîσÅ╖",
    ar: "╪▒┘é┘à ╪º┘ä╪│╪¼┘ä ╪º┘ä╪¬╪¼╪º╪▒┘è",
  },
  fieldHeadquartersLocation: {
    en: "Headquarters Location",
    zh: "µÇ╗Θâ¿µëÇσ£¿σ£░",
    ar: "┘à┘ê┘é╪╣ ╪º┘ä┘à┘é╪▒ ╪º┘ä╪▒╪ª┘è╪│┘è",
  },
  fieldPrimaryContactName: {
    en: "Primary Contact Name",
    zh: "Σ╕╗ΦªüΦüöτ│╗Σ║║σºôσÉì",
    ar: "╪º╪│┘à ╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐",
  },
  fieldPrimaryContactEmail: {
    en: "Primary Contact Email",
    zh: "Σ╕╗ΦªüΦüöτ│╗Σ║║Θé«τ«▒",
    ar: "╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ┘ä╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐",
  },
  fieldPrimaryContactRole: {
    en: "Primary Contact Role",
    zh: "Σ╕╗ΦªüΦüöτ│╗Σ║║ΦºÆΦë▓",
    ar: "╪»┘ê╪▒ ╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐",
  },
  fieldPrimaryContactPhone: {
    en: "Primary Contact Phone",
    zh: "Σ╕╗ΦªüΦüöτ│╗Σ║║τö╡Φ»¥",
    ar: "┘ç╪º╪¬┘ü ╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐",
  },
  fieldServiceType: {
    en: "Service Type",
    zh: "µ£ìσèíτ▒╗σ₧ï",
    ar: "┘å┘ê╪╣ ╪º┘ä╪«╪»┘à╪⌐",
  },
  fieldServiceScope: {
    en: "Service Scope",
    zh: "µ£ìσèíΦîâσ¢┤",
    ar: "┘å╪╖╪º┘é ╪º┘ä╪«╪»┘à╪⌐",
  },
  fieldHostingEnvironment: {
    en: "Hosting Environment",
    zh: "µëÿτ«íτÄ»σóâ",
    ar: "╪¿┘è╪ª╪⌐ ╪º┘ä╪º╪│╪¬╪╢╪º┘ü╪⌐",
  },
  fieldCloudProviders: {
    en: "Cloud Providers",
    zh: "Σ║æµ£ìσèíσòå",
    ar: "┘à╪▓┘ê╪»┘ê ╪º┘ä╪│╪¡╪º╪¿╪⌐",
  },
  fieldRegulatoryJurisdictions: {
    en: "Regulatory Jurisdictions",
    zh: "τ¢æτ«íµ│òσƒƒ",
    ar: "╪º┘ä┘ê┘ä╪º┘è╪º╪¬ ╪º┘ä┘é╪╢╪º╪ª┘è╪⌐ ╪º┘ä╪¬┘å╪╕┘è┘à┘è╪⌐",
  },
  fieldDataProcessingActivities: {
    en: "Data Processing Activities",
    zh: "µò░µì«σñäτÉåµ┤╗σè¿",
    ar: "╪ú┘å╪┤╪╖╪⌐ ┘à╪╣╪º┘ä╪¼╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬",
  },
  fieldCriticalityLevel: {
    en: "Criticality Level",
    zh: "σà│Θö«µÇºτ║ºσê½",
    ar: "┘à╪│╪¬┘ê┘ë ╪º┘ä╪ú┘ç┘à┘è╪⌐",
  },
  fieldRiskTier: {
    en: "Inherent Risk Tier",
    zh: "σ¢║µ£ëΘúÄΘÖ⌐τ¡ëτ║º",
    ar: "╪»╪▒╪¼╪⌐ ╪º┘ä┘à╪«╪º╪╖╪▒ ╪º┘ä┘â╪º┘à┘å╪⌐",
  },
  fieldThirdPartyDependencies: {
    en: "Third-Party Dependencies",
    zh: "τ¼¼Σ╕ëµû╣Σ╛¥Φ╡û",
    ar: "╪º╪╣╪¬┘à╪º╪»┘è╪º╪¬ ╪º┘ä╪╖╪▒┘ü ╪º┘ä╪½╪º┘ä╪½",
  },
  fieldFourthPartyDependencies: {
    en: "Fourth-Party Dependencies",
    zh: "τ¼¼σ¢¢µû╣Σ╛¥Φ╡û",
    ar: "╪º╪╣╪¬┘à╪º╪»┘è╪º╪¬ ╪º┘ä╪╖╪▒┘ü ╪º┘ä╪▒╪º╪¿╪╣",
  },
  fieldComplianceStandards: {
    en: "Security Certifications & Standards",
    zh: "σ«ëσà¿Φ«ñΦ»üΣ╕Äµáçσçå",
    ar: "╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘à╪╣╪º┘è┘è╪▒ ╪º┘ä╪ú┘à┘å┘è╪⌐",
  },
  fieldCompanyProfile: {
    en: "Company Profile / Description",
    zh: "σà¼σÅ╕τ«ÇΣ╗ï / µÅÅΦ┐░",
    ar: "┘à┘ä┘ü ╪º┘ä╪┤╪▒┘â╪⌐ / ╪º┘ä┘ê╪╡┘ü",
  },
  requiredFieldsNotice: {
    en: "Complete the required enterprise profile fields before creating or previewing the supplier.",
    zh: "Φ»╖σàêσ«îµêÉσ┐àσí½τÜäΣ╝üΣ╕Üτ║ºµíúµíêσ¡ùµ«╡∩╝îσåìσê¢σ╗║µêûΘóäΦºêΣ╛¢σ║öσòåπÇé",
    ar: "╪ú┘â┘à┘ä ╪º┘ä╪¡┘é┘ê┘ä ╪º┘ä╪Ñ┘ä╪▓╪º┘à┘è╪⌐ ┘ü┘è ┘à┘ä┘ü ╪º┘ä┘à╪ñ╪│╪│╪⌐ ┘é╪¿┘ä ╪Ñ┘å╪┤╪º╪í ╪º┘ä┘à┘ê╪▒╪» ╪ú┘ê ┘à╪╣╪º┘è┘å╪¬┘ç.",
  },
  requiredBadge: {
    en: "Required",
    zh: "σ┐àσí½",
    ar: "╪Ñ┘ä╪▓╪º┘à┘è",
  },
  profileCompleteness: {
    en: "Profile completeness",
    zh: "µíúµíêσ«îµò┤σ║ª",
    ar: "╪º┘â╪¬┘à╪º┘ä ╪º┘ä┘à┘ä┘ü",
  },
  summaryCompany: {
    en: "Company",
    zh: "σà¼σÅ╕",
    ar: "╪º┘ä╪┤╪▒┘â╪⌐",
  },
  summaryService: {
    en: "Service",
    zh: "µ£ìσèí",
    ar: "╪º┘ä╪«╪»┘à╪⌐",
  },
  summaryCompliance: {
    en: "Compliance",
    zh: "σÉêΦºä",
    ar: "╪º┘ä╪º┘à╪¬╪½╪º┘ä",
  },
  summaryRisk: {
    en: "Risk & Dependencies",
    zh: "ΘúÄΘÖ⌐Σ╕ÄΣ╛¥Φ╡û",
    ar: "╪º┘ä┘à╪«╪º╪╖╪▒ ┘ê╪º┘ä╪º╪╣╪¬┘à╪º╪»┘è╪º╪¬",
  },
  summaryContact: {
    en: "Contact",
    zh: "Φüöτ│╗Σ║║",
    ar: "╪¼┘ç╪⌐ ╪º┘ä╪º╪¬╪╡╪º┘ä",
  },
  optionSelectPlaceholder: {
    en: "Select an option",
    zh: "Φ»╖ΘÇëµï⌐",
    ar: "╪º╪«╪¬╪▒ ╪«┘è╪º╪▒╪º",
  },
  optionMultiSelectHint: {
    en: "Select all that apply",
    zh: "σÅ»σñÜΘÇë",
    ar: "╪º╪«╪¬╪▒ ┘â┘ä ┘à╪º ┘è┘å╪╖╪¿┘é",
  },
  formIntro: {
    en: "Capture enterprise-grade supplier attributes used by the assessment, reporting, and governance workflows.",
    zh: "Φ«░σ╜òΦ»äΣ╝░πÇüµèÑσæèΣ╕Äµ▓╗τÉåµ╡üτ¿ïµëÇΘ£ÇτÜäΣ╝üΣ╕Üτ║ºΣ╛¢σ║öσòåσ▒₧µÇºπÇé",
    ar: "╪│╪¼┘æ┘ä ╪«╪╡╪º╪ª╪╡ ╪º┘ä┘à┘ê╪▒╪» ╪º┘ä┘à╪ñ╪│╪│┘è╪⌐ ╪º┘ä┘à╪│╪¬╪«╪»┘à╪⌐ ┘ü┘è ╪º┘ä╪¬┘é┘è┘è┘à ┘ê╪º┘ä╪¬┘é╪º╪▒┘è╪▒ ┘ê┘à╪│╪º╪▒╪º╪¬ ╪º┘ä╪¡┘ê┘â┘à╪⌐.",
  },
  methodologyPoint: {
    en: "Scores now combine localization evidence with business criticality, hosting model, dependency depth, and declared regulatory exposure.",
    zh: "Φ»äσêåτÄ░σ£¿τ╗ôσÉêµò░µì«µ£¼σ£░σîûΦ»üµì«πÇüΣ╕Üσèíσà│Θö«µÇºπÇüµëÿτ«íµ¿íσ₧ïπÇüΣ╛¥Φ╡ûµ╖▒σ║ªσÆîτö│µèÑτ¢æτ«íµÜ┤Θ£▓Θ¥óπÇé",
    ar: "╪¬╪¼┘à╪╣ ╪º┘ä╪»╪▒╪¼╪º╪¬ ╪º┘ä╪ó┘å ╪¿┘è┘å ╪ú╪»┘ä╪⌐ ╪º┘ä╪¬┘ê╪╖┘è┘å ┘ê╪º┘ä╪ú┘ç┘à┘è╪⌐ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐ ┘ê┘å┘à┘ê╪░╪¼ ╪º┘ä╪º╪│╪¬╪╢╪º┘ü╪⌐ ┘ê╪╣┘à┘é ╪º┘ä╪º╪╣╪¬┘à╪º╪»┘è╪º╪¬ ┘ê╪º┘ä╪¬╪╣╪▒╪╢ ╪º┘ä╪¬┘å╪╕┘è┘à┘è ╪º┘ä┘à╪╣┘ä┘å.",
  },
} as const;

export type VendorProfileCopyKey = keyof typeof vendorProfileCopy;

export function getVendorProfileCopy(
  key: VendorProfileCopyKey,
  locale: VendorProfileLocale
): string {
  const entry = vendorProfileCopy[key];
  return entry[locale] ?? entry.en;
}

export function getVendorOptionLabel<T extends string>(
  options: ReadonlyArray<VendorOption<T>>,
  value: T | string | null | undefined,
  locale: VendorProfileLocale
): string {
  if (!value) {
    return "";
  }

  const match = options.find(option => option.value === value);
  if (match) {
    return match.labels[locale] ?? match.labels.en;
  }

  return humanizeVendorValue(String(value));
}

export function parseVendorMultiValue(
  value: string | null | undefined
): string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[;,|\n]/g)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

export function serializeVendorMultiValue(values: readonly string[]): string {
  return Array.from(
    new Set(values.map(value => value.trim()).filter(Boolean))
  ).join(";");
}

function humanizeVendorValue(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}
