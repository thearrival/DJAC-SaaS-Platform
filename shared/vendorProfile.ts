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

export const vendorIndustryOptions: ReadonlyArray<VendorOption<VendorIndustry>> = [
  { value: "software-saas", labels: { en: "Software / SaaS", zh: "软件 / SaaS", ar: "البرمجيات / SaaS" } },
  { value: "cloud-digital-infrastructure", labels: { en: "Cloud / Digital Infrastructure", zh: "云与数字基础设施", ar: "السحابة والبنية الرقمية" } },
  { value: "financial-services", labels: { en: "Financial Services", zh: "金融服务", ar: "الخدمات المالية" } },
  { value: "healthcare-life-sciences", labels: { en: "Healthcare / Life Sciences", zh: "医疗与生命科学", ar: "الرعاية الصحية وعلوم الحياة" } },
  { value: "government-public-sector", labels: { en: "Government / Public Sector", zh: "政府 / 公共部门", ar: "الحكومة والقطاع العام" } },
  { value: "telecommunications", labels: { en: "Telecommunications", zh: "电信", ar: "الاتصالات" } },
  { value: "energy-utilities", labels: { en: "Energy / Utilities", zh: "能源 / 公用事业", ar: "الطاقة والمرافق" } },
  { value: "manufacturing-operational-technology", labels: { en: "Manufacturing / OT", zh: "制造 / OT", ar: "التصنيع / التقنية التشغيلية" } },
  { value: "retail-ecommerce", labels: { en: "Retail / E-commerce", zh: "零售 / 电商", ar: "التجزئة / التجارة الإلكترونية" } },
  { value: "logistics-supply-chain", labels: { en: "Logistics / Supply Chain", zh: "物流 / 供应链", ar: "اللوجستيات / سلاسل الإمداد" } },
  { value: "professional-services", labels: { en: "Professional Services", zh: "专业服务", ar: "الخدمات المهنية" } },
  { value: "other", labels: { en: "Other", zh: "其他", ar: "أخرى" } },
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

export const vendorServiceTypeOptions: ReadonlyArray<VendorOption<VendorServiceType>> = [
  { value: "saas", labels: { en: "SaaS", zh: "SaaS", ar: "البرمجيات كخدمة" } },
  { value: "paas", labels: { en: "PaaS", zh: "PaaS", ar: "المنصة كخدمة" } },
  { value: "iaas", labels: { en: "IaaS", zh: "IaaS", ar: "البنية التحتية كخدمة" } },
  { value: "managed-service-provider", labels: { en: "Managed Service Provider", zh: "托管服务提供商", ar: "مزود خدمات مُدارة" } },
  { value: "managed-security-service-provider", labels: { en: "Managed Security Service Provider", zh: "托管安全服务提供商", ar: "مزود خدمات أمنية مُدارة" } },
  { value: "payment-processor", labels: { en: "Payment Processor", zh: "支付处理商", ar: "معالج مدفوعات" } },
  { value: "telecom-network", labels: { en: "Telecom / Network Provider", zh: "电信 / 网络提供商", ar: "مزود اتصالات / شبكة" } },
  { value: "colocation-data-center", labels: { en: "Colocation / Data Center", zh: "机房托管 / 数据中心", ar: "استضافة / مركز بيانات" } },
  { value: "business-process-outsourcing", labels: { en: "Business Process Outsourcing", zh: "业务流程外包", ar: "الاستعانة بمصادر خارجية للعمليات" } },
  { value: "professional-services", labels: { en: "Professional Services", zh: "专业服务", ar: "الخدمات المهنية" } },
  { value: "other", labels: { en: "Other", zh: "其他", ar: "أخرى" } },
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

export const vendorCloudProviderOptions: ReadonlyArray<VendorOption<VendorCloudProvider>> = [
  { value: "aws", labels: { en: "AWS", zh: "AWS", ar: "AWS" } },
  { value: "azure", labels: { en: "Microsoft Azure", zh: "微软 Azure", ar: "مايكروسوفت Azure" } },
  { value: "gcp", labels: { en: "Google Cloud", zh: "谷歌云", ar: "Google Cloud" } },
  { value: "oracle-cloud", labels: { en: "Oracle Cloud", zh: "甲骨文云", ar: "Oracle Cloud" } },
  { value: "alibaba-cloud", labels: { en: "Alibaba Cloud", zh: "阿里云", ar: "Alibaba Cloud" } },
  { value: "huawei-cloud", labels: { en: "Huawei Cloud", zh: "华为云", ar: "Huawei Cloud" } },
  { value: "tencent-cloud", labels: { en: "Tencent Cloud", zh: "腾讯云", ar: "Tencent Cloud" } },
  { value: "stc-cloud", labels: { en: "stc Cloud", zh: "stc 云", ar: "stc Cloud" } },
  { value: "private-cloud", labels: { en: "Private Cloud / VMware", zh: "私有云 / VMware", ar: "سحابة خاصة / VMware" } },
  { value: "other", labels: { en: "Other", zh: "其他", ar: "أخرى" } },
];

export const vendorHostingEnvironmentValues = [
  "on-premises",
  "private-cloud",
  "single-public-cloud",
  "multi-cloud",
  "hybrid",
] as const;

export type VendorHostingEnvironment = (typeof vendorHostingEnvironmentValues)[number];

export const vendorHostingEnvironmentOptions: ReadonlyArray<VendorOption<VendorHostingEnvironment>> = [
  { value: "on-premises", labels: { en: "On-premises", zh: "本地部署", ar: "داخل المؤسسة" } },
  { value: "private-cloud", labels: { en: "Private Cloud", zh: "私有云", ar: "سحابة خاصة" } },
  { value: "single-public-cloud", labels: { en: "Single Public Cloud", zh: "单一公有云", ar: "سحابة عامة واحدة" } },
  { value: "multi-cloud", labels: { en: "Multi-cloud", zh: "多云", ar: "متعدد السحابات" } },
  { value: "hybrid", labels: { en: "Hybrid", zh: "混合", ar: "هجينة" } },
];

export const vendorCountryValues = [
  "saudi-arabia",
  "china",
  "united-arab-emirates",
  "bahrain",
  "singapore",
  "india",
  "germany",
  "netherlands",
  "united-kingdom",
  "united-states",
  "other",
] as const;

export type VendorCountry = (typeof vendorCountryValues)[number];

export const vendorCountryOptions: ReadonlyArray<VendorOption<VendorCountry>> = [
  { value: "saudi-arabia", labels: { en: "Saudi Arabia", zh: "沙特阿拉伯", ar: "المملكة العربية السعودية" } },
  { value: "china", labels: { en: "China", zh: "中国", ar: "الصين" } },
  { value: "united-arab-emirates", labels: { en: "United Arab Emirates", zh: "阿联酋", ar: "الإمارات العربية المتحدة" } },
  { value: "bahrain", labels: { en: "Bahrain", zh: "巴林", ar: "البحرين" } },
  { value: "singapore", labels: { en: "Singapore", zh: "新加坡", ar: "سنغافورة" } },
  { value: "india", labels: { en: "India", zh: "印度", ar: "الهند" } },
  { value: "germany", labels: { en: "Germany", zh: "德国", ar: "ألمانيا" } },
  { value: "netherlands", labels: { en: "Netherlands", zh: "荷兰", ar: "هولندا" } },
  { value: "united-kingdom", labels: { en: "United Kingdom", zh: "英国", ar: "المملكة المتحدة" } },
  { value: "united-states", labels: { en: "United States", zh: "美国", ar: "الولايات المتحدة" } },
  { value: "other", labels: { en: "Other", zh: "其他", ar: "أخرى" } },
];

export const vendorJurisdictionValues = [
  "saudi-arabia",
  "china",
  "gcc",
  "eu-eea",
  "united-kingdom",
  "united-states",
  "apac",
] as const;

export type VendorJurisdiction = (typeof vendorJurisdictionValues)[number];

export const vendorJurisdictionOptions: ReadonlyArray<VendorOption<VendorJurisdiction>> = [
  { value: "saudi-arabia", labels: { en: "Saudi Arabia", zh: "沙特阿拉伯", ar: "المملكة العربية السعودية" } },
  { value: "china", labels: { en: "China", zh: "中国", ar: "الصين" } },
  { value: "gcc", labels: { en: "GCC", zh: "海合会", ar: "مجلس التعاون الخليجي" } },
  { value: "eu-eea", labels: { en: "EU / EEA", zh: "欧盟 / 欧洲经济区", ar: "الاتحاد الأوروبي / المنطقة الاقتصادية الأوروبية" } },
  { value: "united-kingdom", labels: { en: "United Kingdom", zh: "英国", ar: "المملكة المتحدة" } },
  { value: "united-states", labels: { en: "United States", zh: "美国", ar: "الولايات المتحدة" } },
  { value: "apac", labels: { en: "APAC", zh: "亚太", ar: "آسيا والمحيط الهادئ" } },
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

export type VendorComplianceStandard = (typeof vendorComplianceStandardValues)[number];

export const vendorComplianceStandardOptions: ReadonlyArray<VendorOption<VendorComplianceStandard>> = [
  { value: "iso-27001", labels: { en: "ISO 27001", zh: "ISO 27001", ar: "ISO 27001" } },
  { value: "iso-27701", labels: { en: "ISO 27701", zh: "ISO 27701", ar: "ISO 27701" } },
  { value: "soc-2-type-ii", labels: { en: "SOC 2 Type II", zh: "SOC 2 Type II", ar: "SOC 2 Type II" } },
  { value: "pci-dss", labels: { en: "PCI DSS", zh: "PCI DSS", ar: "PCI DSS" } },
  { value: "csa-star", labels: { en: "CSA STAR", zh: "CSA STAR", ar: "CSA STAR" } },
  { value: "nist-csf-aligned", labels: { en: "NIST CSF aligned", zh: "符合 NIST CSF", ar: "متوافق مع NIST CSF" } },
  { value: "nca-ecc", labels: { en: "NCA ECC", zh: "NCA ECC", ar: "NCA ECC" } },
  { value: "nca-ccc", labels: { en: "NCA CCC", zh: "NCA CCC", ar: "NCA CCC" } },
  { value: "mlps-2.0", labels: { en: "MLPS 2.0", zh: "MLPS 2.0", ar: "MLPS 2.0" } },
  { value: "privacy-impact-assessment-program", labels: { en: "Privacy impact assessment program", zh: "隐私影响评估计划", ar: "برنامج تقييم أثر الخصوصية" } },
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

export type VendorDataProcessingActivity = (typeof vendorDataProcessingActivityValues)[number];

export const vendorDataProcessingActivityOptions: ReadonlyArray<VendorOption<VendorDataProcessingActivity>> = [
  { value: "customer-personal-data", labels: { en: "Customer personal data", zh: "客户个人数据", ar: "البيانات الشخصية للعملاء" } },
  { value: "employee-data", labels: { en: "Employee data", zh: "员工数据", ar: "بيانات الموظفين" } },
  { value: "financial-payment-data", labels: { en: "Financial / payment data", zh: "金融 / 支付数据", ar: "البيانات المالية / بيانات الدفع" } },
  { value: "health-biometric-data", labels: { en: "Health / biometric data", zh: "健康 / 生物识别数据", ar: "البيانات الصحية / البيومترية" } },
  { value: "security-telemetry-logs", labels: { en: "Security telemetry / logs", zh: "安全遥测 / 日志", ar: "قياسات الأمن / السجلات" } },
  { value: "source-code-intellectual-property", labels: { en: "Source code / intellectual property", zh: "源代码 / 知识产权", ar: "الشفرة المصدرية / الملكية الفكرية" } },
  { value: "operational-technology-data", labels: { en: "Operational technology data", zh: "运营技术数据", ar: "بيانات التقنية التشغيلية" } },
  { value: "identity-access-data", labels: { en: "Identity / access data", zh: "身份 / 访问数据", ar: "بيانات الهوية / الوصول" } },
  { value: "backup-disaster-recovery-data", labels: { en: "Backup / disaster recovery data", zh: "备份 / 灾备数据", ar: "بيانات النسخ الاحتياطي / التعافي من الكوارث" } },
  { value: "cross-border-data-transfer", labels: { en: "Cross-border data transfer", zh: "跨境数据传输", ar: "نقل البيانات عبر الحدود" } },
];

export const vendorCriticalityLevelValues = ["low", "moderate", "high", "mission-critical"] as const;

export type VendorCriticalityLevel = (typeof vendorCriticalityLevelValues)[number];

export const vendorCriticalityLevelOptions: ReadonlyArray<VendorOption<VendorCriticalityLevel>> = [
  { value: "low", labels: { en: "Low", zh: "低", ar: "منخفض" } },
  { value: "moderate", labels: { en: "Moderate", zh: "中", ar: "متوسط" } },
  { value: "high", labels: { en: "High", zh: "高", ar: "مرتفع" } },
  { value: "mission-critical", labels: { en: "Mission critical", zh: "关键核心", ar: "حرج للغاية" } },
];

export const vendorRiskTierValues = [
  "tier-1-critical",
  "tier-2-high",
  "tier-3-moderate",
  "tier-4-low",
] as const;

export type VendorRiskTier = (typeof vendorRiskTierValues)[number];

export const vendorRiskTierOptions: ReadonlyArray<VendorOption<VendorRiskTier>> = [
  { value: "tier-1-critical", labels: { en: "Tier 1 - Critical", zh: "一级 - 关键", ar: "المستوى 1 - حرج" } },
  { value: "tier-2-high", labels: { en: "Tier 2 - High", zh: "二级 - 高", ar: "المستوى 2 - مرتفع" } },
  { value: "tier-3-moderate", labels: { en: "Tier 3 - Moderate", zh: "三级 - 中", ar: "المستوى 3 - متوسط" } },
  { value: "tier-4-low", labels: { en: "Tier 4 - Low", zh: "四级 - 低", ar: "المستوى 4 - منخفض" } },
];

export const vendorDependencyLevelValues = ["none", "limited", "material", "extensive"] as const;

export type VendorDependencyLevel = (typeof vendorDependencyLevelValues)[number];

export const vendorDependencyLevelOptions: ReadonlyArray<VendorOption<VendorDependencyLevel>> = [
  { value: "none", labels: { en: "None", zh: "无", ar: "لا يوجد" } },
  { value: "limited", labels: { en: "Limited", zh: "有限", ar: "محدود" } },
  { value: "material", labels: { en: "Material", zh: "重要", ar: "جوهري" } },
  { value: "extensive", labels: { en: "Extensive", zh: "广泛", ar: "واسع" } },
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
    zh: "公司信息",
    ar: "معلومات الشركة",
  },
  sectionCompanyHint: {
    en: "Capture the supplier's legal identity and organizational context.",
    zh: "记录供应商的法律身份与组织背景。",
    ar: "سجّل الهوية القانونية والسياق المؤسسي للمورّد.",
  },
  sectionService: {
    en: "Service & Infrastructure",
    zh: "服务与基础设施",
    ar: "الخدمة والبنية التحتية",
  },
  sectionServiceHint: {
    en: "Define what the vendor delivers, where it runs, and which jurisdictions it affects.",
    zh: "定义供应商提供的服务、运行环境以及影响到的法域。",
    ar: "حدّد ما يقدمه المورّد وأين يعمل وما هي الولايات القضائية المتأثرة.",
  },
  sectionCompliance: {
    en: "Security & Compliance",
    zh: "安全与合规",
    ar: "الأمن والامتثال",
  },
  sectionComplianceHint: {
    en: "Record control attestations, data handling patterns, and regulatory exposure.",
    zh: "记录控制认证、数据处理模式和监管暴露面。",
    ar: "سجّل الاعتمادات الرقابية وأنماط معالجة البيانات والتعرض التنظيمي.",
  },
  sectionRisk: {
    en: "Risk Classification",
    zh: "风险分类",
    ar: "تصنيف المخاطر",
  },
  sectionRiskHint: {
    en: "Classify inherent risk, business criticality, and supply-chain dependency depth.",
    zh: "分类固有风险、业务关键性与供应链依赖深度。",
    ar: "صنّف المخاطر الكامنة والأهمية التشغيلية وعمق التبعية في سلسلة التوريد.",
  },
  sectionContact: {
    en: "Primary Contact",
    zh: "主要联系人",
    ar: "جهة الاتصال الرئيسية",
  },
  sectionContactHint: {
    en: "Store the accountable contact for due diligence, remediation, and evidence requests.",
    zh: "保存尽调、整改和证据请求的责任联系人。",
    ar: "احفظ جهة الاتصال المسؤولة عن العناية الواجبة والمعالجة وطلبات الأدلة.",
  },
  fieldBusinessRegistrationNumber: {
    en: "Business Registration Number",
    zh: "商业注册号",
    ar: "رقم السجل التجاري",
  },
  fieldHeadquartersLocation: {
    en: "Headquarters Location",
    zh: "总部所在地",
    ar: "موقع المقر الرئيسي",
  },
  fieldPrimaryContactName: {
    en: "Primary Contact Name",
    zh: "主要联系人姓名",
    ar: "اسم جهة الاتصال الرئيسية",
  },
  fieldPrimaryContactEmail: {
    en: "Primary Contact Email",
    zh: "主要联系人邮箱",
    ar: "البريد الإلكتروني لجهة الاتصال الرئيسية",
  },
  fieldPrimaryContactRole: {
    en: "Primary Contact Role",
    zh: "主要联系人角色",
    ar: "دور جهة الاتصال الرئيسية",
  },
  fieldPrimaryContactPhone: {
    en: "Primary Contact Phone",
    zh: "主要联系人电话",
    ar: "هاتف جهة الاتصال الرئيسية",
  },
  fieldServiceType: {
    en: "Service Type",
    zh: "服务类型",
    ar: "نوع الخدمة",
  },
  fieldServiceScope: {
    en: "Service Scope",
    zh: "服务范围",
    ar: "نطاق الخدمة",
  },
  fieldHostingEnvironment: {
    en: "Hosting Environment",
    zh: "托管环境",
    ar: "بيئة الاستضافة",
  },
  fieldCloudProviders: {
    en: "Cloud Providers",
    zh: "云服务商",
    ar: "مزودو السحابة",
  },
  fieldRegulatoryJurisdictions: {
    en: "Regulatory Jurisdictions",
    zh: "监管法域",
    ar: "الولايات القضائية التنظيمية",
  },
  fieldDataProcessingActivities: {
    en: "Data Processing Activities",
    zh: "数据处理活动",
    ar: "أنشطة معالجة البيانات",
  },
  fieldCriticalityLevel: {
    en: "Criticality Level",
    zh: "关键性级别",
    ar: "مستوى الأهمية",
  },
  fieldRiskTier: {
    en: "Inherent Risk Tier",
    zh: "固有风险等级",
    ar: "درجة المخاطر الكامنة",
  },
  fieldThirdPartyDependencies: {
    en: "Third-Party Dependencies",
    zh: "第三方依赖",
    ar: "اعتماديات الطرف الثالث",
  },
  fieldFourthPartyDependencies: {
    en: "Fourth-Party Dependencies",
    zh: "第四方依赖",
    ar: "اعتماديات الطرف الرابع",
  },
  fieldComplianceStandards: {
    en: "Security Certifications & Standards",
    zh: "安全认证与标准",
    ar: "الشهادات والمعايير الأمنية",
  },
  fieldCompanyProfile: {
    en: "Company Profile / Description",
    zh: "公司简介 / 描述",
    ar: "ملف الشركة / الوصف",
  },
  requiredFieldsNotice: {
    en: "Complete the required enterprise profile fields before creating or previewing the supplier.",
    zh: "请先完成必填的企业级档案字段，再创建或预览供应商。",
    ar: "أكمل الحقول الإلزامية في ملف المؤسسة قبل إنشاء المورد أو معاينته.",
  },
  requiredBadge: {
    en: "Required",
    zh: "必填",
    ar: "إلزامي",
  },
  profileCompleteness: {
    en: "Profile completeness",
    zh: "档案完整度",
    ar: "اكتمال الملف",
  },
  summaryCompany: {
    en: "Company",
    zh: "公司",
    ar: "الشركة",
  },
  summaryService: {
    en: "Service",
    zh: "服务",
    ar: "الخدمة",
  },
  summaryCompliance: {
    en: "Compliance",
    zh: "合规",
    ar: "الامتثال",
  },
  summaryRisk: {
    en: "Risk & Dependencies",
    zh: "风险与依赖",
    ar: "المخاطر والاعتماديات",
  },
  summaryContact: {
    en: "Contact",
    zh: "联系人",
    ar: "جهة الاتصال",
  },
  optionSelectPlaceholder: {
    en: "Select an option",
    zh: "请选择",
    ar: "اختر خيارا",
  },
  optionMultiSelectHint: {
    en: "Select all that apply",
    zh: "可多选",
    ar: "اختر كل ما ينطبق",
  },
  formIntro: {
    en: "Capture enterprise-grade supplier attributes used by the assessment, reporting, and governance workflows.",
    zh: "记录评估、报告与治理流程所需的企业级供应商属性。",
    ar: "سجّل خصائص المورد المؤسسية المستخدمة في التقييم والتقارير ومسارات الحوكمة.",
  },
  methodologyPoint: {
    en: "Scores now combine localization evidence with business criticality, hosting model, dependency depth, and declared regulatory exposure.",
    zh: "评分现在结合数据本地化证据、业务关键性、托管模型、依赖深度和申报监管暴露面。",
    ar: "تجمع الدرجات الآن بين أدلة التوطين والأهمية التشغيلية ونموذج الاستضافة وعمق الاعتماديات والتعرض التنظيمي المعلن.",
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

export function parseVendorMultiValue(value: string | null | undefined): string[] {
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
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean))).join(";");
}

function humanizeVendorValue(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}