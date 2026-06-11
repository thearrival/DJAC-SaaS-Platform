/**
 * VendorAssessment.tsx
 * 
 * Module: Company Relocation & Market Entry Assessment
 * Purpose: Self-contained assessment tool for companies evaluating expansion to SA or China
 * Scope: Module-scoped only. No global DB/schema modifications, no shared type imports.
 * 
 * Supports:
 * - Company profile capture (HQ country, target country, size, industry)
 * - IT infrastructure assessment (cloud providers, data hosting, systems)
 * - Regulatory & cybersecurity compliance mapping
 * - Automated gap analysis (current state vs. target jurisdiction requirements)
 * - Risk & readiness scoring (Market Entry Readiness, Compliance Risk)
 * - Actionable recommendations (categorized by severity)
 * - Multilingual support (EN/ZH/AR with RTL)
 * 
 * All data/logic is client-side and form-scoped. No tRPC integration.
 */

import type React from "react";
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, X, Building2, Globe2, ShieldCheck, Sparkles, FileCheck } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useLocale } from '@/contexts/useLocale';
import { useTheme } from '@/contexts/useTheme';

// ============================================================================
// TYPE DEFINITIONS - Internal Company Assessment Model
// ============================================================================

type Locale = 'en' | 'zh' | 'ar';

interface CompanyProfile {
  companyName: string;
  hqCountry: 'SA' | 'China' | 'Other';
  targetCountry: 'SA' | 'China';
  industry: string;
  businessActivities: string[];
  companySize: 'Startup' | 'SME' | 'Enterprise' | 'Multinational';
  operationalModel: 'OnPremise' | 'Cloud' | 'Hybrid' | 'MultiCloud';
}

interface ITInfrastructure {
  currentCloudProviders: string[];
  dataHostingLocations: string[];
  coreSystems: string[];
  networkArchitecture: 'Traditional' | 'Modern' | 'Distributed' | 'Serverless';
  hostingModel: 'OnPremise' | 'Cloud' | 'Hybrid' | 'MultiCloud';
  otherCloudProviders: string[];
  otherDataHostingLocations: string[];
  otherCloudProvidersText: string;
  otherDataHostingLocationsText: string;
}

interface ComplianceProfile {
  dataResidencyStatus: 'NotApplicable' | 'Partial' | 'Full';
  crossBorderTransferMechanism: 'None' | 'StandardContractualClauses' | 'BindingCorporateRules' | 'Other';
  cybersecurityFrameworks: string[];
  encryptionStandard: 'None' | 'AES128' | 'AES256' | 'Custom';
  localRegulatoryExposure: string[];
}

interface GapItem {
  category: 'Infrastructure' | 'Compliance' | 'Security' | 'DataResidency' | 'Governance';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  finding: string;
  recommendation: string;
}

interface RiskScores {
  marketEntryReadiness: number; // 0-100
  complianceRisk: number; // 0-100
  infrastructureReadiness: number; // 0-100
}

interface AssessmentResult {
  gaps: GapItem[];
  scores: RiskScores;
  recommendations: string[];
  overallRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  readinessLevel: 'NotReady' | 'Partial' | 'Ready' | 'FullyReady';
}

// ============================================================================
// LOCALIZATION - Multilingual Copy
// ============================================================================

const COPY: Record<Locale, {
  title: string;
  subtitle: string;
  sections: {
    companyProfile: string;
    itInfrastructure: string;
    compliance: string;
    gapAnalysis: string;
    results: string;
  };
  fields: {
    companyName: string;
    hqCountry: string;
    targetCountry: string;
    industry: string;
    businessActivities: string;
    companySize: string;
    operationalModel: string;
    currentCloudProviders: string;
    dataHostingLocations: string;
    coreSystems: string;
    networkArchitecture: string;
    hostingModel: string;
    dataResidencyStatus: string;
    crossBorderTransferMechanism: string;
    cybersecurityFrameworks: string;
    encryptionStandard: string;
    otherCloudProviders: string;
    otherDataHostingLocations: string;
    otherCloudProvidersPlaceholder: string;
    otherDataHostingLocationsPlaceholder: string;
    add: string;
    typeAndAddHint: string;
    remove: string;
    emptyValue: string;
    duplicateValues: string;
    addedValues: string;
    removedValue: string;
    startAssessment: string;
    analyze: string;
    reset: string;
  };
  options: {
    select: string;
    sa: string;
    china: string;
    other: string;
    startup: string;
    sme: string;
    enterprise: string;
    multinational: string;
    onpremise: string;
    cloud: string;
    hybrid: string;
    multicloud: string;
    traditional: string;
    modern: string;
    distributed: string;
    serverless: string;
    aws: string;
    azure: string;
    gcp: string;
    alibaba: string;
    tencent: string;
    none: string;
    others: string;
    partial: string;
    full: string;
    scc: string;
    bcr: string;
    notApplicable: string;
    aes128: string;
    aes256: string;
    custom: string;
  };
  gaps: {
    title: string;
    noGaps: string;
    criticalCount: string;
    highCount: string;
    mediumCount: string;
    lowCount: string;
  };
  results: {
    title: string;
    marketEntryReadiness: string;
    complianceRisk: string;
    infrastructureReadiness: string;
    overallRisk: string;
    readinessLevel: string;
    recommendations: string;
    riskLevel: string;
    notReady: string;
    partial: string;
    ready: string;
    fullyReady: string;
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
}> = {
  en: {
    title: 'Company Relocation & Market Entry Assessment',
    subtitle: 'Evaluate your organization\'s readiness for expansion to Saudi Arabia or China',
    sections: {
      companyProfile: 'Company Profile',
      itInfrastructure: 'IT Infrastructure',
      compliance: 'Regulatory & Cybersecurity',
      gapAnalysis: 'Gap Analysis',
      results: 'Assessment Results',
    },
    fields: {
      companyName: 'Company Name',
      hqCountry: 'Headquarters Country',
      targetCountry: 'Target Expansion Country',
      industry: 'Industry',
      businessActivities: 'Business Activities',
      companySize: 'Company Size',
      operationalModel: 'Current Operational Model',
      currentCloudProviders: 'Current Cloud Providers',
      dataHostingLocations: 'Data Hosting Locations',
      coreSystems: 'Core Business Systems',
      networkArchitecture: 'Network Architecture',
      hostingModel: 'Hosting Model',
      dataResidencyStatus: 'Data Residency Status',
      crossBorderTransferMechanism: 'Cross-Border Transfer Mechanism',
      cybersecurityFrameworks: 'Cybersecurity Frameworks',
      encryptionStandard: 'Encryption Standard',
      otherCloudProviders: 'Other Cloud Providers',
      otherDataHostingLocations: 'Other Data Hosting Locations',
      otherCloudProvidersPlaceholder: 'Example: Oracle Cloud, Huawei Cloud',
      otherDataHostingLocationsPlaceholder: 'Example: Bahrain, UAE, Singapore',
      add: 'Add',
      typeAndAddHint: 'Type value and click Add (or press Enter). You can add multiple values separated by commas.',
      remove: 'Remove',
      emptyValue: 'Enter at least one value before adding.',
      duplicateValues: 'Already added values',
      addedValues: 'Added values',
      removedValue: 'Removed value',
      startAssessment: 'Start Assessment',
      analyze: 'Analyze & Generate Report',
      reset: 'Reset Form',
    },
    options: {
      select: 'Select an option',
      sa: 'Saudi Arabia',
      china: 'China',
      other: 'Other',
      startup: 'Startup (< 50 employees)',
      sme: 'SME (50-500 employees)',
      enterprise: 'Enterprise (500-5000 employees)',
      multinational: 'Multinational (> 5000 employees)',
      onpremise: 'On-Premise',
      cloud: 'Cloud',
      hybrid: 'Hybrid',
      multicloud: 'Multi-Cloud',
      traditional: 'Traditional (Monolithic)',
      modern: 'Modern (Microservices)',
      distributed: 'Distributed (Geo-distributed)',
      serverless: 'Serverless',
      aws: 'AWS',
      azure: 'Microsoft Azure',
      gcp: 'Google Cloud',
      alibaba: 'Alibaba Cloud',
      tencent: 'Tencent Cloud',
      none: 'None',
      others: 'Others',
      partial: 'Partial',
      full: 'Full',
      scc: 'Standard Contractual Clauses',
      bcr: 'Binding Corporate Rules',
      notApplicable: 'Not Applicable',
      aes128: 'AES-128',
      aes256: 'AES-256',
      custom: 'Custom Standard',
    },
    gaps: {
      title: 'Identified Gaps',
      noGaps: 'No critical gaps identified',
      criticalCount: 'Critical Issues',
      highCount: 'High Priority',
      mediumCount: 'Medium Priority',
      lowCount: 'Low Considerations',
    },
    results: {
      title: 'Assessment Results',
      marketEntryReadiness: 'Market Entry Readiness Score',
      complianceRisk: 'Compliance Risk Score',
      infrastructureReadiness: 'Infrastructure Readiness Score',
      overallRisk: 'Overall Risk Level',
      readinessLevel: 'Readiness Level',
      recommendations: 'Actionable Recommendations',
      riskLevel: 'Risk',
      notReady: 'Not Ready',
      partial: 'Partially Ready',
      ready: 'Ready',
      fullyReady: 'Fully Ready',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
    },
  },
  zh: {
    title: '公司搬迁与市场进入评估',
    subtitle: '评估您的组织扩展到沙特阿拉伯或中国的准备情况',
    sections: {
      companyProfile: '公司简介',
      itInfrastructure: '信息技术基础设施',
      compliance: '监管与网络安全',
      gapAnalysis: '差距分析',
      results: '评估结果',
    },
    fields: {
      companyName: '公司名称',
      hqCountry: '总部国家',
      targetCountry: '目标扩展国家',
      industry: '行业',
      businessActivities: '业务活动',
      companySize: '公司规模',
      operationalModel: '当前运营模式',
      currentCloudProviders: '当前云提供商',
      dataHostingLocations: '数据托管位置',
      coreSystems: '核心业务系统',
      networkArchitecture: '网络架构',
      hostingModel: '托管模式',
      dataResidencyStatus: '数据驻留状态',
      crossBorderTransferMechanism: '跨境转移机制',
      cybersecurityFrameworks: '网络安全框架',
      encryptionStandard: '加密标准',
      otherCloudProviders: '其他云提供商',
      otherDataHostingLocations: '其他数据托管位置',
      otherCloudProvidersPlaceholder: '例如：甲骨文云、华为云',
      otherDataHostingLocationsPlaceholder: '例如：巴林、阿联酋、新加坡',
      add: '添加',
      typeAndAddHint: '输入值后点击“添加”（或按 Enter）。可用逗号一次添加多个值。',
      remove: '移除',
      emptyValue: '请先输入至少一个值再添加。',
      duplicateValues: '以下值已存在',
      addedValues: '已添加',
      removedValue: '已移除',
      startAssessment: '开始评估',
      analyze: '分析并生成报告',
      reset: '重置表单',
    },
    options: {
      select: '选择一个选项',
      sa: '沙特阿拉伯',
      china: '中国',
      other: '其他',
      startup: '初创企业（< 50 名员工）',
      sme: '中小企业（50-500 名员工）',
      enterprise: '企业（500-5000 名员工）',
      multinational: '跨国公司（> 5000 名员工）',
      onpremise: '本地部署',
      cloud: '云',
      hybrid: '混合',
      multicloud: '多云',
      traditional: '传统（单体）',
      modern: '现代（微服务）',
      distributed: '分布式（地理分布式）',
      serverless: '无服务器',
      aws: 'AWS',
      azure: '微软 Azure',
      gcp: '谷歌云',
      alibaba: '阿里巴巴云',
      tencent: '腾讯云',
      none: '无',
      others: '其他',
      partial: '部分',
      full: '完全',
      scc: '标准合同条款',
      bcr: '约束性企业规则',
      notApplicable: '不适用',
      aes128: 'AES-128',
      aes256: 'AES-256',
      custom: '自定义标准',
    },
    gaps: {
      title: '已确定的差距',
      noGaps: '未发现关键差距',
      criticalCount: '关键问题',
      highCount: '高优先级',
      mediumCount: '中等优先级',
      lowCount: '低优先级事项',
    },
    results: {
      title: '评估结果',
      marketEntryReadiness: '市场进入准备情况得分',
      complianceRisk: '合规风险评分',
      infrastructureReadiness: '基础设施就绪得分',
      overallRisk: '总体风险等级',
      readinessLevel: '准备就绪程度',
      recommendations: '可操作建议',
      riskLevel: '风险',
      notReady: '未准备好',
      partial: '部分准备',
      ready: '已准备好',
      fullyReady: '完全准备好',
      low: '低',
      medium: '中等',
      high: '高',
      critical: '严重',
    },
  },
  ar: {
    title: 'تقييم نقل الشركة والدخول إلى السوق',
    subtitle: 'قيّم جهوزية مؤسستك للتوسع إلى المملكة العربية السعودية أو الصين',
    sections: {
      companyProfile: 'ملف تعريف الشركة',
      itInfrastructure: 'البنية التحتية لتكنولوجيا المعلومات',
      compliance: 'الامتثال والأمن السيبراني',
      gapAnalysis: 'تحليل الفجوات',
      results: 'نتائج التقييم',
    },
    fields: {
      companyName: 'اسم الشركة',
      hqCountry: 'بلد المقر الرئيسي',
      targetCountry: 'بلد التوسع المستهدف',
      industry: 'الصناعة',
      businessActivities: 'الأنشطة التجارية',
      companySize: 'حجم الشركة',
      operationalModel: 'نموذج التشغيل الحالي',
      currentCloudProviders: 'موفري الخدمات السحابية الحاليون',
      dataHostingLocations: 'مواقع استضافة البيانات',
      coreSystems: 'الأنظمة الأساسية للأعمال',
      networkArchitecture: 'معمارية الشبكة',
      hostingModel: 'نموذج الاستضافة',
      dataResidencyStatus: 'حالة إقامة البيانات',
      crossBorderTransferMechanism: 'آلية النقل عبر الحدود',
      cybersecurityFrameworks: 'أطر الأمن السيبراني',
      encryptionStandard: 'معيار التشفير',
      otherCloudProviders: 'موفرو السحابة الآخرون',
      otherDataHostingLocations: 'مواقع استضافة البيانات الأخرى',
      otherCloudProvidersPlaceholder: 'مثال: Oracle Cloud, Huawei Cloud',
      otherDataHostingLocationsPlaceholder: 'مثال: البحرين، الإمارات، سنغافورة',
      add: 'إضافة',
      typeAndAddHint: 'اكتب القيمة ثم اضغط إضافة (أو Enter). يمكنك إضافة عدة قيم مفصولة بفواصل.',
      remove: 'إزالة',
      emptyValue: 'يرجى إدخال قيمة واحدة على الأقل قبل الإضافة.',
      duplicateValues: 'قيم مضافة مسبقاً',
      addedValues: 'تمت الإضافة',
      removedValue: 'تمت الإزالة',
      startAssessment: 'بدء التقييم',
      analyze: 'تحليل وإنشاء التقرير',
      reset: 'إعادة تعيين النموذج',
    },
    options: {
      select: 'اختر خياراً',
      sa: 'المملكة العربية السعودية',
      china: 'الصين',
      other: 'آخر',
      startup: 'شركة ناشئة (< 50 موظفاً)',
      sme: 'شركة صغيرة ومتوسطة (50-500 موظفاً)',
      enterprise: 'مؤسسة (500-5000 موظفاً)',
      multinational: 'شركة متعددة الجنسيات (> 5000 موظفاً)',
      onpremise: 'محلي',
      cloud: 'سحابة',
      hybrid: 'هجين',
      multicloud: 'متعدد السحابة',
      traditional: 'تقليدي (أحادي الكتلة)',
      modern: 'حديث (الخدمات الدقيقة)',
      distributed: 'موزع (موزع جغرافياً)',
      serverless: 'بدون خادم',
      aws: 'AWS',
      azure: 'مايكروسوفت Azure',
      gcp: 'Google Cloud',
      alibaba: 'Alibaba Cloud',
      tencent: 'Tencent Cloud',
      none: 'لا شيء',
      others: 'آخر',
      partial: 'جزئي',
      full: 'كامل',
      scc: 'الشروط التعاقدية القياسية',
      bcr: 'القواعد المؤسسية الملزمة',
      notApplicable: 'غير قابل للتطبيق',
      aes128: 'AES-128',
      aes256: 'AES-256',
      custom: 'معيار مخصص',
    },
    gaps: {
      title: 'الفجوات المحددة',
      noGaps: 'لم يتم تحديد أي فجوات حرجة',
      criticalCount: 'قضايا حرجة',
      highCount: 'أولوية عالية',
      mediumCount: 'أولوية متوسطة',
      lowCount: 'اعتبارات منخفضة',
    },
    results: {
      title: 'نتائج التقييم',
      marketEntryReadiness: 'درجة جهوزية الدخول إلى السوق',
      complianceRisk: 'درجة مخاطر الامتثال',
      infrastructureReadiness: 'درجة جهوزية البنية التحتية',
      overallRisk: 'مستوى المخاطرة العام',
      readinessLevel: 'مستوى الجهوزية',
      recommendations: 'توصيات قابلة للتنفيذ',
      riskLevel: 'المخاطرة',
      notReady: 'غير جاهز',
      partial: 'جاهز جزئياً',
      ready: 'جاهز',
      fullyReady: 'جاهز تماماً',
      low: 'منخفض',
      medium: 'متوسط',
      high: 'مرتفع',
      critical: 'حرج',
    },
  },
};

const UI_TEXT: Record<Locale, {
  companyNamePlaceholder: string;
  industryPlaceholder: string;
  coreSystemsPlaceholder: string;
  requiredFieldsNotice: string;
  recommendedFrameworksTitle: string;
  recommendedFrameworksHint: string;
  applyRecommendedFrameworks: string;
  recommendationReady: string;
}> = {
  en: {
    companyNamePlaceholder: 'Acme Corporation',
    industryPlaceholder: 'Select an industry category',
    coreSystemsPlaceholder: 'ERP, CRM, HIS, e-Commerce Platform - separate by comma',
    requiredFieldsNotice: 'Complete the required fields: Company Name, Industry, and at least one Cybersecurity Framework.',
    recommendedFrameworksTitle: 'Recommended frameworks',
    recommendedFrameworksHint: 'Recommendations are generated from the selected industry, target market, and AI-related activities.',
    applyRecommendedFrameworks: 'Apply recommended frameworks',
    recommendationReady: 'Recommendations update automatically when the industry changes.',
  },
  zh: {
    companyNamePlaceholder: '例如：Acme Corporation',
    industryPlaceholder: '选择行业类别',
    coreSystemsPlaceholder: '例如：ERP、CRM、HIS、电商平台（用逗号分隔）',
    requiredFieldsNotice: '请填写必填项：公司名称、行业，以及至少一个网络安全框架。',
    recommendedFrameworksTitle: '推荐框架',
    recommendedFrameworksHint: '推荐结果会根据所选行业、目标市场以及 AI 相关业务自动生成。',
    applyRecommendedFrameworks: '应用推荐框架',
    recommendationReady: '当行业变化时，推荐结果会自动更新。',
  },
  ar: {
    companyNamePlaceholder: 'مثال: Acme Corporation',
    industryPlaceholder: 'اختر فئة الصناعة',
    coreSystemsPlaceholder: 'مثال: ERP، CRM، HIS، منصة تجارة إلكترونية (افصل بفواصل)',
    requiredFieldsNotice: 'يرجى تعبئة الحقول المطلوبة: اسم الشركة، القطاع، وإطار أمن سيبراني واحد على الأقل.',
    recommendedFrameworksTitle: 'الأطر الموصى بها',
    recommendedFrameworksHint: 'يتم إنشاء التوصيات تلقائياً بناءً على الصناعة المختارة والسوق المستهدف والأنشطة المرتبطة بالذكاء الاصطناعي.',
    applyRecommendedFrameworks: 'تطبيق الأطر الموصى بها',
    recommendationReady: 'تتحدث التوصيات تلقائياً عند تغيير الصناعة.',
  },
};

const INDUSTRY_OPTIONS: Array<{
  value: string;
  labels: Record<Locale, string>;
}> = [
    {
      value: 'Technology & Digital Services',
      labels: {
        en: 'Technology & Digital Services',
        zh: '科技与数字服务',
        ar: 'التقنية والخدمات الرقمية',
      },
    },
    {
      value: 'Financial Services & FinTech',
      labels: {
        en: 'Financial Services & FinTech',
        zh: '金融服务与金融科技',
        ar: 'الخدمات المالية والتقنية المالية',
      },
    },
    {
      value: 'Healthcare & Life Sciences',
      labels: {
        en: 'Healthcare & Life Sciences',
        zh: '医疗健康与生命科学',
        ar: 'الرعاية الصحية وعلوم الحياة',
      },
    },
    {
      value: 'Retail & E-Commerce',
      labels: {
        en: 'Retail & E-Commerce',
        zh: '零售与电子商务',
        ar: 'التجزئة والتجارة الإلكترونية',
      },
    },
    {
      value: 'Manufacturing & Industrial',
      labels: {
        en: 'Manufacturing & Industrial',
        zh: '制造与工业',
        ar: 'التصنيع والصناعة',
      },
    },
    {
      value: 'Government & Public Sector',
      labels: {
        en: 'Government & Public Sector',
        zh: '政府与公共部门',
        ar: 'الحكومة والقطاع العام',
      },
    },
    {
      value: 'Telecom & Digital Infrastructure',
      labels: {
        en: 'Telecom & Digital Infrastructure',
        zh: '电信与数字基础设施',
        ar: 'الاتصالات والبنية التحتية الرقمية',
      },
    },
    {
      value: 'Energy & Utilities',
      labels: {
        en: 'Energy & Utilities',
        zh: '能源与公用事业',
        ar: 'الطاقة والمرافق',
      },
    },
    {
      value: 'Logistics & Transportation',
      labels: {
        en: 'Logistics & Transportation',
        zh: '物流与交通运输',
        ar: 'الخدمات اللوجستية والنقل',
      },
    },
    {
      value: 'Education & Research',
      labels: {
        en: 'Education & Research',
        zh: '教育与研究',
        ar: 'التعليم والبحث',
      },
    },
  ];

const FRAMEWORK_OPTIONS = ['ISO27001', 'SOC2', 'PCI-DSS', 'NIST', 'CAC', 'CITC', 'SDAIA'] as const;

const INDUSTRY_FRAMEWORK_MAP: Record<string, Array<(typeof FRAMEWORK_OPTIONS)[number]>> = {
  'Technology & Digital Services': ['ISO27001', 'SOC2', 'NIST'],
  'Financial Services & FinTech': ['ISO27001', 'PCI-DSS', 'NIST'],
  'Healthcare & Life Sciences': ['ISO27001', 'NIST'],
  'Retail & E-Commerce': ['PCI-DSS', 'SOC2', 'ISO27001'],
  'Manufacturing & Industrial': ['ISO27001', 'NIST'],
  'Government & Public Sector': ['ISO27001', 'NIST'],
  'Telecom & Digital Infrastructure': ['ISO27001', 'NIST', 'CITC'],
  'Energy & Utilities': ['ISO27001', 'NIST'],
  'Logistics & Transportation': ['ISO27001', 'SOC2'],
  'Education & Research': ['ISO27001', 'NIST'],
};

const BUSINESS_ACTIVITY_OPTIONS: Array<{
  value: string;
  labels: Record<Locale, string>;
}> = [
    {
      value: 'Technology',
      labels: {
        en: 'Technology',
        zh: '科技',
        ar: 'التقنية',
      },
    },
    {
      value: 'Innovation',
      labels: {
        en: 'Innovation',
        zh: '创新',
        ar: 'الابتكار',
      },
    },
    {
      value: 'Finance',
      labels: {
        en: 'Finance',
        zh: '金融',
        ar: 'المالية',
      },
    },
    {
      value: 'Healthcare',
      labels: {
        en: 'Healthcare',
        zh: '医疗健康',
        ar: 'الرعاية الصحية',
      },
    },
    {
      value: 'Retail',
      labels: {
        en: 'Retail',
        zh: '零售',
        ar: 'التجزئة',
      },
    },
    {
      value: 'Manufacturing',
      labels: {
        en: 'Manufacturing',
        zh: '制造业',
        ar: 'التصنيع',
      },
    },
    {
      value: 'AI',
      labels: {
        en: 'AI',
        zh: '人工智能',
        ar: 'الذكاء الاصطناعي',
      },
    },
    {
      value: 'Cloud Services',
      labels: {
        en: 'Cloud Services',
        zh: '云服务',
        ar: 'الخدمات السحابية',
      },
    },
    {
      value: 'Critical Infrastructure',
      labels: {
        en: 'Critical Infrastructure',
        zh: '关键基础设施',
        ar: 'البنية التحتية الحيوية',
      },
    },
  ];

const DATA_LOCATION_LABELS: Record<Locale, Record<'Saudi Arabia' | 'China' | 'US' | 'EU' | 'APAC' | 'Others', string>> = {
  en: {
    'Saudi Arabia': 'Saudi Arabia',
    China: 'China',
    US: 'US',
    EU: 'EU',
    APAC: 'APAC',
    Others: 'Others',
  },
  zh: {
    'Saudi Arabia': '沙特阿拉伯',
    China: '中国',
    US: '美国',
    EU: '欧盟',
    APAC: '亚太',
    Others: '其他',
  },
  ar: {
    'Saudi Arabia': 'المملكة العربية السعودية',
    China: 'الصين',
    US: 'الولايات المتحدة',
    EU: 'الاتحاد الأوروبي',
    APAC: 'آسيا والمحيط الهادئ',
    Others: 'أخرى',
  },
};

const GAP_CATEGORY_LABELS: Record<Locale, Record<GapItem['category'], string>> = {
  en: {
    Infrastructure: 'Infrastructure',
    Compliance: 'Compliance',
    Security: 'Security',
    DataResidency: 'Data Residency',
    Governance: 'Governance',
  },
  zh: {
    Infrastructure: '基础设施',
    Compliance: '合规',
    Security: '安全',
    DataResidency: '数据驻留',
    Governance: '治理',
  },
  ar: {
    Infrastructure: 'البنية التحتية',
    Compliance: 'الامتثال',
    Security: 'الأمن',
    DataResidency: 'توطين البيانات',
    Governance: 'الحوكمة',
  },
};

const ASSESSMENT_TEXT_TRANSLATIONS: Record<Exclude<Locale, 'en'>, Record<string, string>> = {
  zh: {
    'Data not hosted in China': '数据未托管在中国境内',
    'Establish data center or use local cloud provider (Alibaba Cloud, Tencent Cloud) for data residency compliance': '建议建设中国本地数据中心，或使用本地云服务商（阿里云、腾讯云）以满足数据驻留合规要求。',
    'Foreign cloud providers may violate data sovereignty regulations': '使用境外云服务商可能违反数据主权相关规定',
    'Migrate workloads to locally-approved providers (Alibaba, Tencent) or implement local proxy infrastructure': '建议将关键工作负载迁移到本地合规云（阿里云、腾讯云），或部署本地代理架构。',
    'CAC (Cybersecurity Assessment and Certification) not implemented': '尚未满足 CAC（网络安全评估与认证）要求',
    'Pursue CAC certification from authorized assessment organizations': '建议通过授权评估机构推进 CAC 认证。',
    'No encryption standard implemented': '尚未实施统一加密标准',
    'Implement AES-256 encryption for data at rest and in transit': '建议对静态和传输数据统一采用 AES-256 加密。',
    'Data residency not fully compliant with CAC requirements': '数据驻留尚未完全符合 CAC 要求',
    'Establish full data locality compliance; establish data transfer approvals with regulatory bodies if needed': '建议完善数据本地化合规，并在必要时办理数据出境审批。',
    'CITC (Communications and Information Technology Commission) requirements not addressed': '尚未覆盖 CITC（通信和信息技术委员会）相关要求',
    'Align with CITC cybersecurity standards; consider registering as CITC-compliant entity': '建议对齐 CITC 网络安全标准，并评估完成 CITC 合规登记。',
    'SDAIA governance not documented for AI initiatives': 'AI 项目缺少 SDAIA 治理文件',
    'Implement SDAIA-compliant AI governance framework and documentation': '建议建立并落地符合 SDAIA 要求的 AI 治理框架与文档。',
    'Critical services data not hosted in Saudi Arabia': '关键业务数据未托管在沙特境内',
    'Establish Saudi Arabia data centers for critical services; use local cloud providers or data residency agreements': '建议为关键业务部署沙特本地数据中心，或采用本地云与数据驻留协议。',
    'Full data residency documentation not provided for vision 2030 initiatives': '未提供 Vision 2030 相关项目所需的完整数据驻留文件',
    'Document data residency compliance for Vision 2030 and NEOM-related operations': '建议补齐 Vision 2030 与 NEOM 相关业务的数据驻留合规文档。',
    'No cross-border data transfer mechanism established': '尚未建立跨境数据传输机制',
    'Implement Standard Contractual Clauses (SCC), Binding Corporate Rules (BCR), or equivalent mechanisms': '建议落地 SCC、BCR 或同等跨境传输机制。',
    'On-premise hosting may limit scalability for market entry': '本地部署可能限制市场进入阶段的扩展能力',
    'Consider hybrid or cloud model for faster deployment and geographic expansion': '建议采用混合云或云化模式，以提升部署速度和区域扩展能力。',
    'Traditional monolithic architecture may impact time-to-market': '传统单体架构可能影响上市/入市速度',
    'Consider microservices or modern architecture patterns for faster iteration': '建议采用微服务或现代架构模式，提高迭代效率。',
  },
  ar: {
    'Data not hosted in China': 'البيانات غير مستضافة داخل الصين',
    'Establish data center or use local cloud provider (Alibaba Cloud, Tencent Cloud) for data residency compliance': 'أنشئ مركز بيانات داخل الصين أو استخدم مزوداً محلياً (Alibaba Cloud أو Tencent Cloud) للامتثال لمتطلبات توطين البيانات.',
    'Foreign cloud providers may violate data sovereignty regulations': 'قد يؤدي استخدام مزودي سحابة أجانب إلى مخالفة متطلبات سيادة البيانات',
    'Migrate workloads to locally-approved providers (Alibaba, Tencent) or implement local proxy infrastructure': 'انقل الأحمال إلى مزودين محليين معتمدين (Alibaba أو Tencent) أو طبّق بنية وكيل محلية.',
    'CAC (Cybersecurity Assessment and Certification) not implemented': 'لم يتم تطبيق متطلبات CAC (التقييم والاعتماد السيبراني)',
    'Pursue CAC certification from authorized assessment organizations': 'ابدأ إجراءات اعتماد CAC عبر جهات تقييم معتمدة.',
    'No encryption standard implemented': 'لا يوجد معيار تشفير مطبق',
    'Implement AES-256 encryption for data at rest and in transit': 'طبّق تشفير AES-256 للبيانات المخزنة والمنقولة.',
    'Data residency not fully compliant with CAC requirements': 'امتثال توطين البيانات غير مكتمل وفق متطلبات CAC',
    'Establish full data locality compliance; establish data transfer approvals with regulatory bodies if needed': 'استكمل امتثال توطين البيانات بالكامل، واستصدر موافقات نقل البيانات من الجهات التنظيمية عند الحاجة.',
    'CITC (Communications and Information Technology Commission) requirements not addressed': 'متطلبات CITC (هيئة الاتصالات وتقنية المعلومات) غير مستوفاة',
    'Align with CITC cybersecurity standards; consider registering as CITC-compliant entity': 'واءم الضوابط مع معايير CITC وادرس التسجيل كجهة متوافقة.',
    'SDAIA governance not documented for AI initiatives': 'توثيق حوكمة SDAIA لمبادرات الذكاء الاصطناعي غير مكتمل',
    'Implement SDAIA-compliant AI governance framework and documentation': 'طبّق إطار حوكمة للذكاء الاصطناعي متوافقاً مع SDAIA مع توثيق كامل.',
    'Critical services data not hosted in Saudi Arabia': 'بيانات الخدمات الحرجة غير مستضافة داخل السعودية',
    'Establish Saudi Arabia data centers for critical services; use local cloud providers or data residency agreements': 'أنشئ استضافة محلية للخدمات الحرجة داخل السعودية أو استخدم مزودين محليين واتفاقيات توطين بيانات.',
    'Full data residency documentation not provided for vision 2030 initiatives': 'لا تتوفر وثائق كاملة لتوطين البيانات لمبادرات رؤية 2030',
    'Document data residency compliance for Vision 2030 and NEOM-related operations': 'وثّق امتثال توطين البيانات لمبادرات رؤية 2030 ومشاريع NEOM.',
    'No cross-border data transfer mechanism established': 'لا توجد آلية معتمدة لنقل البيانات عبر الحدود',
    'Implement Standard Contractual Clauses (SCC), Binding Corporate Rules (BCR), or equivalent mechanisms': 'طبّق بنود SCC أو قواعد BCR أو آليات مكافئة لنقل البيانات عبر الحدود.',
    'On-premise hosting may limit scalability for market entry': 'الاستضافة المحلية قد تحد من قابلية التوسع عند دخول السوق',
    'Consider hybrid or cloud model for faster deployment and geographic expansion': 'فكّر في نموذج سحابي أو هجين لتسريع الإطلاق والتوسع الجغرافي.',
    'Traditional monolithic architecture may impact time-to-market': 'البنية التقليدية أحادية الكتلة قد تؤخر وقت دخول السوق',
    'Consider microservices or modern architecture patterns for faster iteration': 'اعتمد بنية حديثة مثل الخدمات المصغرة لتسريع دورات التطوير.',
  },
};

function localizeAssessmentText(text: string, locale: Locale): string {
  if (locale === 'en') {
    return text;
  }

  const criticalRegex = /^CRITICAL: Address (\d+) critical compliance\/infrastructure issues immediately before market entry\.$/;
  const match = text.match(criticalRegex);
  if (match) {
    const count = match[1];
    if (locale === 'zh') {
      return `最高优先级：进入市场前请先解决 ${count} 项关键合规/基础设施问题。`;
    }
    return `أولوية قصوى: عالج ${count} من مشكلات الامتثال/البنية التحتية الحرجة قبل دخول السوق.`;
  }

  const translated = ASSESSMENT_TEXT_TRANSLATIONS[locale][text];
  return translated || text;
}

// ============================================================================
// ASSESSMENT ENGINE
// ============================================================================

function analyzeComplianceGaps(
  profile: CompanyProfile,
  infrastructure: ITInfrastructure,
  compliance: ComplianceProfile
): GapItem[] {
  const gaps: GapItem[] = [];
  const targetCountry = profile.targetCountry;

  // China-specific compliance requirements
  if (targetCountry === 'China') {
    // Data must be hosted in China
    if (!infrastructure.dataHostingLocations.includes('China')) {
      gaps.push({
        category: 'DataResidency',
        severity: 'Critical',
        finding: 'Data not hosted in China',
        recommendation: 'Establish data center or use local cloud provider (Alibaba Cloud, Tencent Cloud) for data residency compliance',
      });
    }

    // Cloud providers restrictions
    const restrictedProviders = ['aws', 'azure', 'google cloud', 'gcp'];
    const hasRestricted = infrastructure.currentCloudProviders.some(p =>
      restrictedProviders.includes(p.trim().toLowerCase())
    );
    if (hasRestricted) {
      gaps.push({
        category: 'Compliance',
        severity: 'High',
        finding: 'Foreign cloud providers may violate data sovereignty regulations',
        recommendation: 'Migrate workloads to locally-approved providers (Alibaba, Tencent) or implement local proxy infrastructure',
      });
    }

    // Cybersecurity framework - CAC mandatory
    if (!compliance.cybersecurityFrameworks.includes('CAC')) {
      gaps.push({
        category: 'Security',
        severity: 'High',
        finding: 'CAC (Cybersecurity Assessment and Certification) not implemented',
        recommendation: 'Pursue CAC certification from authorized assessment organizations',
      });
    }

    // Encryption standard
    if (compliance.encryptionStandard === 'None') {
      gaps.push({
        category: 'Security',
        severity: 'Critical',
        finding: 'No encryption standard implemented',
        recommendation: 'Implement AES-256 encryption for data at rest and in transit',
      });
    }

    // Cross-border transfer regulations
    if (compliance.dataResidencyStatus !== 'Full') {
      gaps.push({
        category: 'Compliance',
        severity: 'High',
        finding: 'Data residency not fully compliant with CAC requirements',
        recommendation: 'Establish full data locality compliance; establish data transfer approvals with regulatory bodies if needed',
      });
    }
  }

  // Saudi Arabia-specific compliance requirements
  if (targetCountry === 'SA') {
    // CITC regulations - critical
    if (!compliance.cybersecurityFrameworks.includes('CITC')) {
      gaps.push({
        category: 'Compliance',
        severity: 'High',
        finding: 'CITC (Communications and Information Technology Commission) requirements not addressed',
        recommendation: 'Align with CITC cybersecurity standards; consider registering as CITC-compliant entity',
      });
    }

    // SDAIA (Data and AI Authority) - AI-related
    if (profile.businessActivities.includes('AI') && !compliance.cybersecurityFrameworks.includes('SDAIA')) {
      gaps.push({
        category: 'Compliance',
        severity: 'Medium',
        finding: 'SDAIA governance not documented for AI initiatives',
        recommendation: 'Implement SDAIA-compliant AI governance framework and documentation',
      });
    }

    // Data localization in SA
    if (
      profile.businessActivities.some(a => {
        const normalized = a.toLowerCase();
        return normalized.includes('critical') || normalized.includes('critical infra');
      }) &&
      !infrastructure.dataHostingLocations.includes('Saudi Arabia')
    ) {
      gaps.push({
        category: 'DataResidency',
        severity: 'High',
        finding: 'Critical services data not hosted in Saudi Arabia',
        recommendation: 'Establish Saudi Arabia data centers for critical services; use local cloud providers or data residency agreements',
      });
    }

    // NEOM regulations if applicable
    if (profile.businessActivities.includes('Technology') || profile.businessActivities.includes('Innovation')) {
      if (compliance.dataResidencyStatus !== 'Full') {
        gaps.push({
          category: 'Compliance',
          severity: 'Medium',
          finding: 'Full data residency documentation not provided for vision 2030 initiatives',
          recommendation: 'Document data residency compliance for Vision 2030 and NEOM-related operations',
        });
      }
    }
  }

  // General gaps applicable to both
  if (compliance.crossBorderTransferMechanism === 'None' && profile.hqCountry !== profile.targetCountry) {
    gaps.push({
      category: 'Compliance',
      severity: 'High',
      finding: 'No cross-border data transfer mechanism established',
      recommendation: 'Implement Standard Contractual Clauses (SCC), Binding Corporate Rules (BCR), or equivalent mechanisms',
    });
  }

  if (infrastructure.hostingModel === 'OnPremise' && profile.companySize === 'Startup') {
    gaps.push({
      category: 'Infrastructure',
      severity: 'Medium',
      finding: 'On-premise hosting may limit scalability for market entry',
      recommendation: 'Consider hybrid or cloud model for faster deployment and geographic expansion',
    });
  }

  if (infrastructure.networkArchitecture === 'Traditional') {
    gaps.push({
      category: 'Infrastructure',
      severity: 'Medium',
      finding: 'Traditional monolithic architecture may impact time-to-market',
      recommendation: 'Consider microservices or modern architecture patterns for faster iteration',
    });
  }

  return gaps;
}

function calculateRiskScores(
  profile: CompanyProfile,
  infrastructure: ITInfrastructure,
  compliance: ComplianceProfile,
  gaps: GapItem[]
): RiskScores {
  // Market Entry Readiness (0-100)
  let marketEntryReadiness = 100;
  marketEntryReadiness -= gaps.filter(g => g.category === 'Infrastructure').length * 10;
  marketEntryReadiness -= gaps.filter(g => g.severity === 'Critical').length * 15;
  marketEntryReadiness = Math.max(0, Math.min(100, marketEntryReadiness));

  // Compliance Risk (0-100, where 0 = no risk, 100 = max risk)
  let complianceRisk = 0;
  complianceRisk += gaps.filter(g => g.category === 'Compliance' && g.severity === 'Critical').length * 25;
  complianceRisk += gaps.filter(g => g.category === 'Compliance' && g.severity === 'High').length * 15;
  complianceRisk += gaps.filter(g => g.category === 'Compliance' && g.severity === 'Medium').length * 5;
  complianceRisk = Math.min(100, complianceRisk);

  // Infrastructure Readiness (0-100)
  let infrastructureReadiness = 100;
  if (infrastructure.hostingModel === 'OnPremise') infrastructureReadiness -= 20;
  if (infrastructure.networkArchitecture === 'Traditional') infrastructureReadiness -= 15;
  if (profile.companySize === 'Startup') infrastructureReadiness -= 10;
  infrastructureReadiness -= gaps.filter(g => g.category === 'Infrastructure').length * 5;
  infrastructureReadiness = Math.max(0, Math.min(100, infrastructureReadiness));

  return {
    marketEntryReadiness,
    complianceRisk,
    infrastructureReadiness,
  };
}

function generateRecommendations(gaps: GapItem[]): string[] {
  const recommendations: string[] = [];
  const criticalGaps = gaps.filter(g => g.severity === 'Critical');
    const _highGaps = gaps.filter(g => g.severity === 'High');

  if (criticalGaps.length > 0) {
    recommendations.push(`CRITICAL: Address ${criticalGaps.length} critical compliance/infrastructure issues immediately before market entry.`);
  }

  // Aggregate recommendations
  const uniqueRecommendations = new Map<string, GapItem>();
  gaps.forEach(gap => {
    if (!uniqueRecommendations.has(gap.recommendation)) {
      uniqueRecommendations.set(gap.recommendation, gap);
    }
  });

  uniqueRecommendations.forEach((gap, rec) => {
    if (gap.severity === 'Critical' || gap.severity === 'High') {
      recommendations.push(rec);
    }
  });

  return recommendations.slice(0, 8);
}

function buildAssessmentResult(
  profile: CompanyProfile,
  infrastructure: ITInfrastructure,
  compliance: ComplianceProfile
): AssessmentResult {
  const gaps = analyzeComplianceGaps(profile, infrastructure, compliance);
  const scores = calculateRiskScores(profile, infrastructure, compliance, gaps);
  const recommendations = generateRecommendations(gaps);

  // Determine overall risk level
  let overallRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (scores.complianceRisk > 60 || gaps.some(g => g.severity === 'Critical')) {
    overallRiskLevel = 'Critical';
  } else if (scores.complianceRisk > 40 || gaps.some(g => g.severity === 'High')) {
    overallRiskLevel = 'High';
  } else if (scores.complianceRisk > 20) {
    overallRiskLevel = 'Medium';
  }

  // Determine readiness level
  let readinessLevel: 'NotReady' | 'Partial' | 'Ready' | 'FullyReady' = 'NotReady';
  if (scores.marketEntryReadiness > 80) {
    readinessLevel = 'FullyReady';
  } else if (scores.marketEntryReadiness > 60) {
    readinessLevel = 'Ready';
  } else if (scores.marketEntryReadiness > 40) {
    readinessLevel = 'Partial';
  }

  return {
    gaps,
    scores,
    recommendations,
    overallRiskLevel,
    readinessLevel,
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function SeverityBadge({
  severity,
  labels,
}: {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  labels: Record<'Low' | 'Medium' | 'High' | 'Critical', string>;
}) {
  const colorMap: Record<string, string> = {
    Low: 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300',
    Medium: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300',
    High: 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300',
    Critical: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300',
  };
  return <Badge className={colorMap[severity]}>{labels[severity]}</Badge>;
}

function ScoreGauge({ score, label }: { score: number; label: string; locale: Locale }) {
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className="text-center p-4">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{score}</p>
    </div>
  );
}

function RiskBadge({
  level,
  labels,
}: {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  labels: Record<'Low' | 'Medium' | 'High' | 'Critical', string>;
}) {
  const colorMap: Record<string, string> = {
    Low: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800/40',
    Medium: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800/40',
    High: 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800/40',
    Critical: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800/40',
  };
  const iconMap: Record<string, React.ReactNode> = {
    Low: <CheckCircle className="w-4 h-4" />,
    Medium: <AlertTriangle className="w-4 h-4" />,
    High: <AlertCircle className="w-4 h-4" />,
    Critical: <XCircle className="w-4 h-4" />,
  };
  return (
    <div className={`border rounded-lg p-4 flex items-center gap-3 ${colorMap[level]}`}>
      {iconMap[level]}
      <span className="font-medium">{labels[level]}</span>
    </div>
  );
}

function getExecutiveSummary(result: AssessmentResult, locale: Locale, _copy: typeof COPY[Locale]) {
  const criticalCount = result.gaps.filter(gap => gap.severity === 'Critical').length;
  const highCount = result.gaps.filter(gap => gap.severity === 'High').length;

  if (locale === 'zh') {
    if (criticalCount > 0) {
      return `存在 ${criticalCount} 项关键问题与 ${highCount} 项高优先级事项。建议在进入目标市场前先完成核心整改。`;
    }
    if (result.overallRiskLevel === 'High' || result.overallRiskLevel === 'Critical') {
      return '当前方案具备进入目标市场的基础，但在监管准备与数据治理方面仍需补齐关键控制措施。';
    }
    return '整体准备情况较好，建议将剩余改进项纳入短期执行计划并持续监控。';
  }

  if (locale === 'ar') {
    if (criticalCount > 0) {
      return `هناك ${criticalCount} من القضايا الحرجة و${highCount} من البنود عالية الأولوية. من الأفضل إغلاقها قبل دخول السوق المستهدف.`;
    }
    if (result.overallRiskLevel === 'High' || result.overallRiskLevel === 'Critical') {
      return 'الوضع الحالي يوفر أساساً جيداً لدخول السوق، لكنه ما زال يحتاج إلى ضوابط تنظيمية وحوكمية إضافية قبل التنفيذ.';
    }
    return 'مستوى الجاهزية جيد، ويُنصح بتحويل الملاحظات المتبقية إلى خطة تنفيذ قصيرة المدى مع متابعة تشغيلية مستمرة.';
  }

  if (criticalCount > 0) {
    return `The target operating model still carries ${criticalCount} critical blockers and ${highCount} high-priority gaps. Close those items before committing to market entry.`;
  }
  if (result.overallRiskLevel === 'High' || result.overallRiskLevel === 'Critical') {
    return 'The operating model is directionally viable, but regulatory preparedness and control evidence still need targeted remediation before launch.';
  }
  return 'The organization is in a credible position to proceed, with the remaining actions best handled as a near-term execution plan.';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VendorAssessment() {
  usePageTitle("Vendor Assessment");
  const { locale = 'en', direction = 'ltr' } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const localeKey = locale as Locale;
  const copy = COPY[localeKey];
  const uiText = UI_TEXT[localeKey];
  const dataLocationLabels = DATA_LOCATION_LABELS[localeKey];
  const categoryLabels = GAP_CATEGORY_LABELS[localeKey];
  const severityLabels: Record<'Low' | 'Medium' | 'High' | 'Critical', string> = {
    Low: copy.results.low,
    Medium: copy.results.medium,
    High: copy.results.high,
    Critical: copy.results.critical,
  };

  // Form state
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: '',
    hqCountry: 'SA',
    targetCountry: 'SA',
    industry: '',
    businessActivities: [],
    companySize: 'SME',
    operationalModel: 'Hybrid',
  });

  const [infrastructure, setInfrastructure] = useState<ITInfrastructure>({
    currentCloudProviders: [],
    dataHostingLocations: [],
    coreSystems: [],
    networkArchitecture: 'Modern',
    hostingModel: 'Hybrid',
    otherCloudProviders: [],
    otherDataHostingLocations: [],
    otherCloudProvidersText: '',
    otherDataHostingLocationsText: '',
  });

  const [compliance, setCompliance] = useState<ComplianceProfile>({
    dataResidencyStatus: 'Partial',
    crossBorderTransferMechanism: 'None',
    cybersecurityFrameworks: [],
    encryptionStandard: 'AES256',
    localRegulatoryExposure: [],
  });

  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [formStep, setFormStep] = useState<'input' | 'results'>('input');
  const [otherCloudProvidersError, setOtherCloudProvidersError] = useState('');
  const [otherDataHostingLocationsError, setOtherDataHostingLocationsError] = useState('');

  // Computed state
  const formComplete = useMemo(() => {
    return (
      profile.companyName.trim().length > 0 &&
      profile.industry.trim().length > 0 &&
      compliance.cybersecurityFrameworks.length > 0
    );
  }, [profile, compliance]);

  const splitInputValues = (input: string): string[] =>
    input
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);

  const mergeUniqueValues = (values: string[]): string[] => {
    const seen = new Set<string>();
    return values.filter(value => {
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  };

  const getNewAndDuplicateValues = (existing: string[], incoming: string[]) => {
    const existingNormalized = new Set(existing.map(value => value.toLowerCase()));
    const added: string[] = [];
    const duplicates: string[] = [];

    incoming.forEach(value => {
      const normalized = value.toLowerCase();
      if (existingNormalized.has(normalized)) {
        duplicates.push(value);
        return;
      }
      existingNormalized.add(normalized);
      added.push(value);
    });

    return { added, duplicates };
  };

  const recommendedFrameworks = useMemo(() => {
    const recommended = new Set<string>(INDUSTRY_FRAMEWORK_MAP[profile.industry] ?? []);

    if (profile.targetCountry === 'SA') {
      recommended.add('CITC');
      if (profile.businessActivities.includes('AI')) {
        recommended.add('SDAIA');
      }
    }

    if (profile.targetCountry === 'China') {
      recommended.add('CAC');
    }

    return FRAMEWORK_OPTIONS.filter(framework => recommended.has(framework));
  }, [profile.industry, profile.targetCountry, profile.businessActivities]);

  const applyRecommendedFrameworks = () => {
    setCompliance({
      ...compliance,
      cybersecurityFrameworks: mergeUniqueValues([
        ...compliance.cybersecurityFrameworks,
        ...recommendedFrameworks,
      ]),
    });
  };

  const completionSteps = useMemo(() => {
    const checks = [
      profile.companyName.trim().length > 0,
      profile.industry.trim().length > 0,
      profile.targetCountry.length > 0,
      compliance.cybersecurityFrameworks.length > 0,
    ];
    return checks.filter(Boolean).length;
  }, [profile.companyName, profile.industry, profile.targetCountry, compliance.cybersecurityFrameworks.length]);

  const completionPercentage = Math.round((completionSteps / 4) * 100);
  const executiveSummary = assessment ? getExecutiveSummary(assessment, localeKey, COPY[localeKey]) : '';

  const addOtherCloudProviders = () => {
    const parsed = splitInputValues(infrastructure.otherCloudProvidersText);
    if (parsed.length === 0) {
      setOtherCloudProvidersError(copy.fields.emptyValue);
      sonnerToast.info(copy.fields.emptyValue);
      return;
    }

    const { added, duplicates } = getNewAndDuplicateValues(
      infrastructure.otherCloudProviders,
      parsed
    );

    if (added.length > 0) {
      setInfrastructure({
        ...infrastructure,
        otherCloudProviders: mergeUniqueValues([
          ...infrastructure.otherCloudProviders,
          ...added,
        ]),
        otherCloudProvidersText: '',
      });
      sonnerToast.success(copy.fields.addedValues, {
        description: added.join(', '),
      });
    }

    if (duplicates.length > 0) {
      setOtherCloudProvidersError(`${copy.fields.duplicateValues}: ${duplicates.join(', ')}`);
      sonnerToast.info(copy.fields.duplicateValues, {
        description: duplicates.join(', '),
      });
    } else {
      setOtherCloudProvidersError('');
    }
  };

  const removeOtherCloudProvider = (provider: string) => {
    setInfrastructure({
      ...infrastructure,
      otherCloudProviders: infrastructure.otherCloudProviders.filter(item => item !== provider),
    });
    setOtherCloudProvidersError('');
    sonnerToast.success(copy.fields.removedValue, {
      description: provider,
    });
  };

  const addOtherDataHostingLocations = () => {
    const parsed = splitInputValues(infrastructure.otherDataHostingLocationsText);
    if (parsed.length === 0) {
      setOtherDataHostingLocationsError(copy.fields.emptyValue);
      sonnerToast.info(copy.fields.emptyValue);
      return;
    }

    const { added, duplicates } = getNewAndDuplicateValues(
      infrastructure.otherDataHostingLocations,
      parsed
    );

    if (added.length > 0) {
      setInfrastructure({
        ...infrastructure,
        otherDataHostingLocations: mergeUniqueValues([
          ...infrastructure.otherDataHostingLocations,
          ...added,
        ]),
        otherDataHostingLocationsText: '',
      });
      sonnerToast.success(copy.fields.addedValues, {
        description: added.join(', '),
      });
    }

    if (duplicates.length > 0) {
      setOtherDataHostingLocationsError(`${copy.fields.duplicateValues}: ${duplicates.join(', ')}`);
      sonnerToast.info(copy.fields.duplicateValues, {
        description: duplicates.join(', '),
      });
    } else {
      setOtherDataHostingLocationsError('');
    }
  };

  const removeOtherDataHostingLocation = (location: string) => {
    setInfrastructure({
      ...infrastructure,
      otherDataHostingLocations: infrastructure.otherDataHostingLocations.filter(item => item !== location),
    });
    setOtherDataHostingLocationsError('');
    sonnerToast.success(copy.fields.removedValue, {
      description: location,
    });
  };

  const handleStartAssessment = () => {
    if (formComplete) {
      const pendingCustomProviders = splitInputValues(infrastructure.otherCloudProvidersText);
      const pendingCustomLocations = splitInputValues(infrastructure.otherDataHostingLocationsText);

      const normalizedInfrastructure: ITInfrastructure = {
        ...infrastructure,
        currentCloudProviders: mergeUniqueValues([
          ...infrastructure.currentCloudProviders.filter(p => p !== 'Others'),
          ...infrastructure.otherCloudProviders,
          ...pendingCustomProviders,
        ]),
        dataHostingLocations: mergeUniqueValues([
          ...infrastructure.dataHostingLocations.filter(l => l !== 'Others'),
          ...infrastructure.otherDataHostingLocations,
          ...pendingCustomLocations,
        ]),
      };

      const result = buildAssessmentResult(profile, normalizedInfrastructure, compliance);
      setAssessment(result);
      setFormStep('results');
    }
  };

  const handleReset = () => {
    setProfile({
      companyName: '',
      hqCountry: 'SA',
      targetCountry: 'SA',
      industry: '',
      businessActivities: [],
      companySize: 'SME',
      operationalModel: 'Hybrid',
    });
    setInfrastructure({
      currentCloudProviders: [],
      dataHostingLocations: [],
      coreSystems: [],
      networkArchitecture: 'Modern',
      hostingModel: 'Hybrid',
      otherCloudProviders: [],
      otherDataHostingLocations: [],
      otherCloudProvidersText: '',
      otherDataHostingLocationsText: '',
    });
    setCompliance({
      dataResidencyStatus: 'Partial',
      crossBorderTransferMechanism: 'None',
      cybersecurityFrameworks: [],
      encryptionStandard: 'AES256',
      localRegulatoryExposure: [],
    });
    setAssessment(null);
    setFormStep('input');
    setOtherCloudProvidersError('');
    setOtherDataHostingLocationsError('');
  };

  const _handleToggleArray = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    path: string,
    value: string
  ) => {
    setter((prev: any) => {
      const keys = path.split('.');
      const lastKey = keys[keys.length - 1];
      const parentKey = keys[0];

      const updatedArray = (prev[parentKey][lastKey] || []).includes(value)
        ? (prev[parentKey][lastKey] || []).filter((v: string) => v !== value)
        : [...(prev[parentKey][lastKey] || []), value];

      return {
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [lastKey]: updatedArray,
        },
      };
    });
  };

  return (
    <div dir={direction} className={`djac-page ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="djac-section-1 mb-8 overflow-hidden rounded-[28px] border border-slate-200 shadow-xl" style={{ background: isDark ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #450a0a 100%)" : "linear-gradient(135deg, #1e3a5f 0%, #1e1b4b 50%, #7f1d1d 100%)", color: "#fff" }}>
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.4fr_0.8fr] md:px-8">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Strategic Assessment Workspace
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-base text-white/75 md:text-lg">{copy.subtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/70"><Building2 className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Industry</span></div>
                <p className="mt-2 text-sm font-semibold">{profile.industry || 'Not selected yet'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/70"><Globe2 className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Target Market</span></div>
                <p className="mt-2 text-sm font-semibold">{profile.targetCountry === 'SA' ? copy.options.sa : copy.options.china}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white/70"><ShieldCheck className="h-4 w-4" /><span className="text-xs uppercase tracking-[0.18em]">Frameworks</span></div>
                <p className="mt-2 text-sm font-semibold">{compliance.cybersecurityFrameworks.length} selected</p>
              </div>
            </div>
          </div>
        </div>

        {formStep === 'input' ? (
          // ================================================================
          // INPUT FORM
          // ================================================================
          <div className="djac-section-2 space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assessment completion</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Build a complete market-entry profile before running the risk model.</p>
                  </div>
                  <Badge variant="outline" className="text-sm">{completionPercentage}%</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" style={{ width: `${completionPercentage}%` }} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Company', complete: profile.companyName.trim().length > 0 },
                    { label: 'Industry', complete: profile.industry.trim().length > 0 },
                    { label: 'Jurisdiction', complete: profile.targetCountry.length > 0 },
                    { label: 'Frameworks', complete: compliance.cybersecurityFrameworks.length > 0 },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl border px-3 py-3 ${item.complete ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {item.complete ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <FileCheck className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold">Insight preview</p>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li>Recommended frameworks adapt to the chosen industry and jurisdiction.</li>
                  <li>Results separate infrastructure readiness from pure compliance exposure.</li>
                  <li>The final output prioritizes immediate blockers before lower-severity actions.</li>
                </ul>
              </div>
            </div>

            {/* Company Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.sections.companyProfile}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.companyName} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profile.companyName}
                      onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                      placeholder={uiText.companyNamePlaceholder}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.industry} <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={profile.industry}
                      onValueChange={value => setProfile({ ...profile, industry: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={uiText.industryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map(industry => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.labels[localeKey]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.hqCountry}
                    </label>
                    <Select value={profile.hqCountry} onValueChange={v => setProfile({ ...profile, hqCountry: v as 'SA' | 'China' | 'Other' })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SA">{copy.options.sa}</SelectItem>
                        <SelectItem value="China">{copy.options.china}</SelectItem>
                        <SelectItem value="Other">{copy.options.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.targetCountry} <span className="text-red-500">*</span>
                    </label>
                    <Select value={profile.targetCountry} onValueChange={v => setProfile({ ...profile, targetCountry: v as 'SA' | 'China' })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SA">{copy.options.sa}</SelectItem>
                        <SelectItem value="China">{copy.options.china}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.companySize}
                    </label>
                    <Select value={profile.companySize} onValueChange={v => setProfile({ ...profile, companySize: v as CompanyProfile['companySize'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Startup">{copy.options.startup}</SelectItem>
                        <SelectItem value="SME">{copy.options.sme}</SelectItem>
                        <SelectItem value="Enterprise">{copy.options.enterprise}</SelectItem>
                        <SelectItem value="Multinational">{copy.options.multinational}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.operationalModel}
                    </label>
                    <Select value={profile.operationalModel} onValueChange={v => setProfile({ ...profile, operationalModel: v as CompanyProfile['operationalModel'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OnPremise">{copy.options.onpremise}</SelectItem>
                        <SelectItem value="Cloud">{copy.options.cloud}</SelectItem>
                        <SelectItem value="Hybrid">{copy.options.hybrid}</SelectItem>
                        <SelectItem value="MultiCloud">{copy.options.multicloud}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {copy.fields.businessActivities}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {BUSINESS_ACTIVITY_OPTIONS.map(activity => (
                      <div key={activity.value} className="flex items-center gap-2">
                        <Checkbox
                          checked={profile.businessActivities.includes(activity.value)}
                          onCheckedChange={() => {
                            const updated = profile.businessActivities.includes(activity.value)
                              ? profile.businessActivities.filter(a => a !== activity.value)
                              : [...profile.businessActivities, activity.value];
                            setProfile({ ...profile, businessActivities: updated });
                          }}
                        />
                        <label className="text-sm cursor-pointer">{activity.labels[localeKey]}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IT Infrastructure Section */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.sections.itInfrastructure}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.networkArchitecture}
                    </label>
                    <Select value={infrastructure.networkArchitecture} onValueChange={v => setInfrastructure({ ...infrastructure, networkArchitecture: v as ITInfrastructure['networkArchitecture'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Traditional">{copy.options.traditional}</SelectItem>
                        <SelectItem value="Modern">{copy.options.modern}</SelectItem>
                        <SelectItem value="Distributed">{copy.options.distributed}</SelectItem>
                        <SelectItem value="Serverless">{copy.options.serverless}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.hostingModel}
                    </label>
                    <Select value={infrastructure.hostingModel} onValueChange={v => setInfrastructure({ ...infrastructure, hostingModel: v as ITInfrastructure['hostingModel'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OnPremise">{copy.options.onpremise}</SelectItem>
                        <SelectItem value="Cloud">{copy.options.cloud}</SelectItem>
                        <SelectItem value="Hybrid">{copy.options.hybrid}</SelectItem>
                        <SelectItem value="MultiCloud">{copy.options.multicloud}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {copy.fields.currentCloudProviders}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['AWS', 'Azure', 'GCP', 'Alibaba', 'Tencent', 'Others'].map(provider => (
                      <div key={provider} className="flex items-center gap-2">
                        <Checkbox
                          checked={infrastructure.currentCloudProviders.includes(provider)}
                          onCheckedChange={() => {
                            const isSelected = infrastructure.currentCloudProviders.includes(provider);
                            const updated = isSelected
                              ? infrastructure.currentCloudProviders.filter(p => p !== provider)
                              : [...infrastructure.currentCloudProviders, provider];

                            if (provider === 'Others' && isSelected) {
                              setOtherCloudProvidersError('');
                              setInfrastructure({
                                ...infrastructure,
                                currentCloudProviders: updated,
                                otherCloudProviders: [],
                                otherCloudProvidersText: '',
                              });
                              return;
                            }

                            setInfrastructure({ ...infrastructure, currentCloudProviders: updated });
                          }}
                        />
                        <label className="text-sm cursor-pointer">
                          {provider === 'AWS' ? copy.options.aws : provider === 'Azure' ? copy.options.azure : provider === 'GCP' ? copy.options.gcp : provider === 'Alibaba' ? copy.options.alibaba : provider === 'Tencent' ? copy.options.tencent : copy.options.others}
                        </label>
                      </div>
                    ))}
                  </div>
                  {infrastructure.currentCloudProviders.includes('Others') && (
                    <div className="mt-3 space-y-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {copy.fields.otherCloudProviders}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={infrastructure.otherCloudProvidersText}
                          onChange={e => {
                            setInfrastructure({ ...infrastructure, otherCloudProvidersText: e.target.value });
                            if (otherCloudProvidersError) {
                              setOtherCloudProvidersError('');
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOtherCloudProviders();
                            }
                          }}
                          placeholder={copy.fields.otherCloudProvidersPlaceholder}
                          className="w-full"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addOtherCloudProviders}
                          className="w-full sm:w-auto"
                        >
                          {copy.fields.add}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{copy.fields.typeAndAddHint}</p>
                      {otherCloudProvidersError && (
                        <p className="text-xs text-red-600">{otherCloudProvidersError}</p>
                      )}
                      {infrastructure.otherCloudProviders.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {infrastructure.otherCloudProviders.map(provider => (
                            <Badge key={`cloud-provider-${provider}`} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 gap-1 pr-1">
                              <span>{provider}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`${copy.fields.remove}: ${provider}`}
                                    onClick={() => removeOtherCloudProvider(provider)}
                                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                                  >
                                    <X className="h-3 w-3" aria-hidden="true" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{`${copy.fields.remove}: ${provider}`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {copy.fields.dataHostingLocations}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(['Saudi Arabia', 'China', 'US', 'EU', 'APAC', 'Others'] as const).map(locationKey => (
                      <div key={locationKey} className="flex items-center gap-2">
                        <Checkbox
                          checked={infrastructure.dataHostingLocations.includes(locationKey)}
                          onCheckedChange={() => {
                            const isSelected = infrastructure.dataHostingLocations.includes(locationKey);
                            const updated = isSelected
                              ? infrastructure.dataHostingLocations.filter(l => l !== locationKey)
                              : [...infrastructure.dataHostingLocations, locationKey];

                            if (locationKey === 'Others' && isSelected) {
                              setOtherDataHostingLocationsError('');
                              setInfrastructure({
                                ...infrastructure,
                                dataHostingLocations: updated,
                                otherDataHostingLocations: [],
                                otherDataHostingLocationsText: '',
                              });
                              return;
                            }

                            setInfrastructure({ ...infrastructure, dataHostingLocations: updated });
                          }}
                        />
                        <label className="text-sm cursor-pointer">{dataLocationLabels[locationKey]}</label>
                      </div>
                    ))}
                  </div>
                  {infrastructure.dataHostingLocations.includes('Others') && (
                    <div className="mt-3 space-y-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {copy.fields.otherDataHostingLocations}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={infrastructure.otherDataHostingLocationsText}
                          onChange={e => {
                            setInfrastructure({ ...infrastructure, otherDataHostingLocationsText: e.target.value });
                            if (otherDataHostingLocationsError) {
                              setOtherDataHostingLocationsError('');
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOtherDataHostingLocations();
                            }
                          }}
                          placeholder={copy.fields.otherDataHostingLocationsPlaceholder}
                          className="w-full"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addOtherDataHostingLocations}
                          className="w-full sm:w-auto"
                        >
                          {copy.fields.add}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{copy.fields.typeAndAddHint}</p>
                      {otherDataHostingLocationsError && (
                        <p className="text-xs text-red-600">{otherDataHostingLocationsError}</p>
                      )}
                      {infrastructure.otherDataHostingLocations.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {infrastructure.otherDataHostingLocations.map(location => (
                            <Badge key={`hosting-location-${location}`} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 gap-1 pr-1">
                              <span>{location}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`${copy.fields.remove}: ${location}`}
                                    onClick={() => removeOtherDataHostingLocation(location)}
                                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                                  >
                                    <X className="h-3 w-3" aria-hidden="true" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{`${copy.fields.remove}: ${location}`}</p>
                                </TooltipContent>
                              </Tooltip>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {copy.fields.coreSystems}
                  </label>
                  <Textarea
                    value={infrastructure.coreSystems.join(', ')}
                    onChange={e => setInfrastructure({ ...infrastructure, coreSystems: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                    placeholder={uiText.coreSystemsPlaceholder}
                    className="w-full"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Compliance & Cybersecurity Section */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.sections.compliance}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.dataResidencyStatus}
                    </label>
                    <Select value={compliance.dataResidencyStatus} onValueChange={v => setCompliance({ ...compliance, dataResidencyStatus: v as ComplianceProfile['dataResidencyStatus'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NotApplicable">{copy.options.notApplicable}</SelectItem>
                        <SelectItem value="Partial">{copy.options.partial}</SelectItem>
                        <SelectItem value="Full">{copy.options.full}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      {copy.fields.crossBorderTransferMechanism}
                    </label>
                    <Select value={compliance.crossBorderTransferMechanism} onValueChange={v => setCompliance({ ...compliance, crossBorderTransferMechanism: v as ComplianceProfile['crossBorderTransferMechanism'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">{copy.options.none}</SelectItem>
                        <SelectItem value="StandardContractualClauses">{copy.options.scc}</SelectItem>
                        <SelectItem value="BindingCorporateRules">{copy.options.bcr}</SelectItem>
                        <SelectItem value="Other">{copy.options.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      {uiText.recommendedFrameworksTitle}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyRecommendedFrameworks}
                      disabled={recommendedFrameworks.length === 0}
                    >
                      {uiText.applyRecommendedFrameworks}
                    </Button>
                  </div>
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{uiText.recommendedFrameworksHint}</p>
                  <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3">
                    {recommendedFrameworks.length > 0 ? recommendedFrameworks.map(framework => {
                      const isSelected = compliance.cybersecurityFrameworks.includes(framework);
                      return (
                        <Badge
                          key={`recommended-${framework}`}
                          className={isSelected ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' : 'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50'}
                        >
                          {framework}
                        </Badge>
                      );
                    }) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">{uiText.recommendationReady}</span>
                    )}
                  </div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {copy.fields.cybersecurityFrameworks} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FRAMEWORK_OPTIONS.map(framework => (
                      <div key={framework} className="flex items-center gap-2">
                        <Checkbox
                          checked={compliance.cybersecurityFrameworks.includes(framework)}
                          onCheckedChange={() => {
                            const updated = compliance.cybersecurityFrameworks.includes(framework)
                              ? compliance.cybersecurityFrameworks.filter(f => f !== framework)
                              : [...compliance.cybersecurityFrameworks, framework];
                            setCompliance({ ...compliance, cybersecurityFrameworks: updated });
                          }}
                        />
                        <label className="text-sm cursor-pointer font-mono">{framework}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {copy.fields.encryptionStandard}
                  </label>
                  <Select value={compliance.encryptionStandard} onValueChange={v => setCompliance({ ...compliance, encryptionStandard: v as ComplianceProfile['encryptionStandard'] })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">{copy.options.none}</SelectItem>
                      <SelectItem value="AES128">{copy.options.aes128}</SelectItem>
                      <SelectItem value="AES256">{copy.options.aes256}</SelectItem>
                      <SelectItem value="Custom">{copy.options.custom}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Required Fields Notice */}
            {!formComplete && (
              <div className="rounded-lg border-l-4 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 p-4" role="alert">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-yellow-800 dark:text-yellow-300">
                    {uiText.requiredFieldsNotice}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleStartAssessment}
                disabled={!formComplete}
                className="px-8"
              >
                {copy.fields.analyze}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
              >
                {copy.fields.reset}
              </Button>
            </div>
          </div>
        ) : assessment ? (
          // ================================================================
          // RESULTS VIEW
          // ================================================================
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white via-slate-50 to-red-50 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/30 shadow-sm">
              <CardHeader>
                <CardTitle>{copy.results.title}</CardTitle>
                <CardDescription>{executiveSummary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Target jurisdiction</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{profile.targetCountry === 'SA' ? copy.options.sa : copy.options.china}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Selected frameworks</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{compliance.cybersecurityFrameworks.join(', ') || 'None'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Primary focus</p>
                    <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{assessment.gaps[0] ? localizeAssessmentText(assessment.gaps[0].finding, localeKey) : copy.gaps.noGaps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{copy.results.marketEntryReadiness}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={assessment.scores.marketEntryReadiness} label="0-100" locale={locale} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{copy.results.infrastructureReadiness}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={assessment.scores.infrastructureReadiness} label="0-100" locale={locale} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{copy.results.complianceRisk}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScoreGauge score={assessment.scores.complianceRisk} label={`${copy.results.riskLevel}: 0-100`} locale={locale} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{copy.results.readinessLevel}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <Badge className="text-lg px-4 py-2">
                    {assessment.readinessLevel === 'NotReady' && copy.results.notReady}
                    {assessment.readinessLevel === 'Partial' && copy.results.partial}
                    {assessment.readinessLevel === 'Ready' && copy.results.ready}
                    {assessment.readinessLevel === 'FullyReady' && copy.results.fullyReady}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Overall Risk */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.results.overallRisk}</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskBadge level={assessment.overallRiskLevel} labels={severityLabels} />
              </CardContent>
            </Card>

            {/* Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.gaps.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {assessment.gaps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    ✓ {copy.gaps.noGaps}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{assessment.gaps.filter(g => g.severity === 'Critical').length}</p>
                        <p className="text-xs text-red-700 dark:text-red-400">{copy.gaps.criticalCount}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{assessment.gaps.filter(g => g.severity === 'High').length}</p>
                        <p className="text-xs text-orange-700 dark:text-orange-400">{copy.gaps.highCount}</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{assessment.gaps.filter(g => g.severity === 'Medium').length}</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">{copy.gaps.mediumCount}</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assessment.gaps.filter(g => g.severity === 'Low').length}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">{copy.gaps.lowCount}</p>
                      </div>
                    </div>

                    {assessment.gaps.map((gap, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <SeverityBadge severity={gap.severity} labels={severityLabels} />
                          <Badge variant="outline" className="text-xs">{categoryLabels[gap.category]}</Badge>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{localizeAssessmentText(gap.finding, localeKey)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{localizeAssessmentText(gap.recommendation, localeKey)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>{copy.results.recommendations}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {assessment.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 dark:text-gray-300">{localizeAssessmentText(rec, localeKey)}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleReset}
                className="px-8"
              >
                {copy.fields.reset}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
