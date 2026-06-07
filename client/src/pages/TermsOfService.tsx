/**
 * DJAC Terms of Service — standalone page (no DashboardLayout).
 * Route: /terms
 *
 * NOTE: This document is a structured placeholder.
 * It MUST be reviewed and approved by qualified legal counsel
 * before the platform is made publicly available.
 */
import { useLocation } from "wouter";
import type React from "react";
import { ChevronLeft, FileText } from "lucide-react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { APP_TITLE } from "@/const";

function useC() {
    const { theme } = useTheme();
    const d = theme === "dark";
    return {
        bg: d ? "#040F61" : "#F0F4FF",
        card: d ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.82)",
        border: d ? "rgba(255,255,255,0.09)" : "rgba(4,15,97,0.11)",
        text: d ? "#FFFFFF" : "#020B45",
        muted: d ? "#9CA3AF" : "rgba(2,11,69,0.55)",
        cyan: d ? "#00F7FF" : "#0284c7",
        heading: d ? "#E2E8F0" : "#1E293B",
        gridColor: d ? "rgba(255,255,255,0.04)" : "rgba(4,15,97,0.04)",
    } as const;
}

const LAST_UPDATED = "2026-03-31";

export default function TermsOfService() {
    usePageTitle("Terms of Service");
    const C = useC();
    const [, setLocation] = useLocation();
    const { direction } = useLocale();

    return (
        <div dir={direction} style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text, fontFamily: "inherit" }}>
            {/* Grid overlay */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `linear-gradient(${C.gridColor} 1px,transparent 1px),linear-gradient(90deg,${C.gridColor} 1px,transparent 1px)`, backgroundSize: "40px 40px" }} />

            {/* Nav */}
            <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 12, padding: "14px 32px", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(10px)" }}>
                <button
                    type="button"
                    onClick={() => setLocation("/")}
                    style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px" }}
                >
                    <ChevronLeft size={14} /> Back
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileText size={18} style={{ color: C.cyan }} />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{APP_TITLE} — Terms of Service</span>
                </div>
            </nav>

            {/* Content */}
            <main style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 44px", backdropFilter: "blur(12px)" }}>

                    <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px", color: C.heading }}>
                        Terms of Service
                    </h1>
                    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 36px" }}>
                        Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective: {LAST_UPDATED}
                    </p>

                    <Section title="1. Acceptance of Terms" C={C}>
                        <p>By creating an account or accessing the DJAC platform ("<strong>Service</strong>") operated by Yalla Hack ("<strong>Company</strong>"), you agree to be bound by these Terms of Service ("<strong>Terms</strong>"). If you do not agree, you may not use the Service.</p>
                        <p>If you are accepting on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these Terms.</p>
                    </Section>

                    <Section title="2. Description of Service" C={C}>
                        <p>DJAC is a SaaS compliance intelligence platform that provides AI-assisted analysis of regulatory requirements in the Kingdom of Saudi Arabia and the People's Republic of China, including PIPL, PDPL, NCA, CSL, DSL, and MLPS 2.0 frameworks. The Service includes document analysis, vendor risk assessments, compliance calendars, and report generation.</p>
                        <p><strong>The Service provides informational tools only. Nothing in the Service constitutes legal advice, and use of the Service does not create an attorney-client relationship.</strong> You should consult qualified legal counsel for specific legal questions.</p>
                    </Section>

                    <Section title="3. Account Registration" C={C}>
                        <p>You must provide accurate and complete information when creating your account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use of your account.</p>
                        <p>We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe pose a security or operational risk.</p>
                    </Section>

                    <Section title="4. Subscription and Billing" C={C}>
                        <p>Access to certain features requires a paid subscription. Subscriptions are billed in advance on a monthly, quarterly, bi-annual, or annual basis as selected at checkout. All fees are non-refundable except as required by applicable law or as expressly stated in a separate written agreement.</p>
                        <p>We use Stripe as our payment processor. By subscribing, you agree to Stripe's terms of service and authorize us to charge your payment method on the applicable billing cycle.</p>
                        <p>We reserve the right to change pricing with at least 30 days' notice to active subscribers.</p>
                    </Section>

                    <Section title="5. Acceptable Use" C={C}>
                        <p>You agree not to:</p>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                            <li>Use the Service for any unlawful purpose or in violation of any applicable regulation.</li>
                            <li>Attempt to gain unauthorized access to the Service or its underlying systems.</li>
                            <li>Submit malicious content, malware, or content designed to exploit vulnerabilities.</li>
                            <li>Reverse-engineer, decompile, or extract source code from the Service.</li>
                            <li>Resell or sublicense access to the Service without written permission.</li>
                            <li>Use automated tools to scrape, crawl, or data-mine the Service.</li>
                            <li>Upload data that infringes third-party intellectual property rights.</li>
                        </ul>
                    </Section>

                    <Section title="6. Intellectual Property" C={C}>
                        <p>The Service, including all software, algorithms, reports, and visual design, is the exclusive property of Yalla Hack and its licensors. Nothing in these Terms transfers ownership of any intellectual property to you.</p>
                        <p>You retain ownership of data and documents you submit to the Service ("<strong>Your Content</strong>"). By submitting Your Content, you grant us a limited, non-exclusive licence to process it solely to provide the Service.</p>
                    </Section>

                    <Section title="7. Confidentiality" C={C}>
                        <p>We treat Your Content as confidential. We will not disclose Your Content to third parties except as described in our Privacy Policy or as required by law. We implement administrative, technical, and physical safeguards appropriate to the sensitivity of the data.</p>
                    </Section>

                    <Section title="8. Disclaimers" C={C}>
                        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
                        <p>We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) AI-generated assessments are complete, accurate, or legally definitive; or (c) the Service fulfils any specific regulatory compliance obligation.</p>
                    </Section>

                    <Section title="9. Limitation of Liability" C={C}>
                        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, YALLA HACK'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
                        <p>IN NO EVENT SHALL YALLA HACK BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITY.</p>
                    </Section>

                    <Section title="10. Indemnification" C={C}>
                        <p>You agree to indemnify, defend, and hold harmless Yalla Hack and its officers, directors, and employees from and against any claims, damages, or expenses (including reasonable attorney's fees) arising out of: (a) your use of the Service in violation of these Terms; (b) Your Content; or (c) your violation of applicable law.</p>
                    </Section>

                    <Section title="11. Termination" C={C}>
                        <p>Either party may terminate the agreement at any time. Upon termination, your right to access the Service ceases immediately. Sections 6, 8, 9, 10, and 12 survive termination.</p>
                        <p>On request made within 30 days of termination, we will provide an export of Your Content in a standard format.</p>
                    </Section>

                    <Section title="12. Governing Law and Dispute Resolution" C={C}>
                        <p>These Terms are governed by the laws of the Kingdom of Saudi Arabia, without regard to conflict-of-law principles. Any dispute arising from these Terms or the Service shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in Riyadh, KSA, conducted in English and Arabic.</p>
                    </Section>

                    <Section title="13. Changes to Terms" C={C}>
                        <p>We may modify these Terms at any time. We will provide at least 30 days' notice of material changes by email or in-app notification. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.</p>
                    </Section>

                    <Section title="14. Contact" C={C}>
                        <p>For questions about these Terms:</p>
                        <p>
                            <strong>Yalla Hack</strong><br />
                            Email: legal@yallahack.com<br />
                        </p>
                    </Section>

                    <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setLocation("/privacy")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.cyan, fontSize: 13, cursor: "pointer", padding: "8px 16px" }}>
                            View Privacy Policy →
                        </button>
                        <button type="button" onClick={() => setLocation("/")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", padding: "8px 16px" }}>
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Section({ title, children, C }: { title: string; children: React.ReactNode; C: ReturnType<typeof useC> }) {
    return (
        <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.heading, margin: "0 0 12px", paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
                {title}
            </h2>
            <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.75 }}>
                {children}
            </div>
        </section>
    );
}
