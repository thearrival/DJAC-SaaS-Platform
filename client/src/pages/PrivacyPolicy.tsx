/**
 * DJAC Privacy Policy — standalone page (no DashboardLayout).
 * Route: /privacy
 *
 * NOTE: This document is a structured placeholder.
 * It MUST be reviewed and approved by qualified legal counsel
 * before the platform is made publicly available.
 */
import { useLocation } from "wouter";
import type React from "react";
import { ChevronLeft, Shield } from "lucide-react";
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

export default function PrivacyPolicy() {
    usePageTitle("Privacy Policy");
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
                    <Shield size={18} style={{ color: C.cyan }} />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{APP_TITLE} — Privacy Policy</span>
                </div>
            </nav>

            {/* Content */}
            <main style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "40px 44px", backdropFilter: "blur(12px)" }}>

                    <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 8px", color: C.heading }}>
                        Privacy Policy
                    </h1>
                    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 36px" }}>
                        Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective: {LAST_UPDATED}
                    </p>

                    <Section title="1. Introduction" C={C}>
                        <p>Yalla Hack ("<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") operates the DJAC (Dual Jurisdiction Compliance) platform ("<strong>Service</strong>"). This Privacy Policy explains how we collect, use, store, and protect your personal information when you access or use the Service.</p>
                        <p>By using the Service you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the Service.</p>
                    </Section>

                    <Section title="2. Information We Collect" C={C}>
                        <SubHeading C={C}>2.1 Account Information</SubHeading>
                        <p>When you register, we collect: full name, work email address, company name, job title, and a hashed password (bcrypt). We never store your password in plain text.</p>

                        <SubHeading C={C}>2.2 Usage Data</SubHeading>
                        <p>We automatically collect information about how you interact with the Service, including: pages visited, features used, compliance queries submitted, AI assessment results, session duration, and browser/device type.</p>

                        <SubHeading C={C}>2.3 Payment Information</SubHeading>
                        <p>Billing transactions are processed by Stripe, Inc. We do not store credit card numbers or payment instrument details on our servers. We receive and store only Stripe customer IDs, subscription status, and billing metadata.</p>

                        <SubHeading C={C}>2.4 Compliance Data You Upload</SubHeading>
                        <p>You may submit documents, vendor information, or business details to receive compliance assessments. This data is processed to provide the Service and is subject to the data handling commitments in Section 4.</p>
                    </Section>

                    <Section title="3. Legal Bases for Processing" C={C}>
                        <p>We process your personal data under the following legal bases (where applicable under GDPR, PIPL, and PDPL):</p>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                            <li><strong>Contract performance</strong> — to provide the Service you have subscribed to.</li>
                            <li><strong>Legitimate interests</strong> — to improve the Service, ensure security, and prevent fraud.</li>
                            <li><strong>Consent</strong> — for optional communications such as product updates.</li>
                            <li><strong>Legal obligation</strong> — to comply with applicable laws.</li>
                        </ul>
                    </Section>

                    <Section title="4. How We Use Your Information" C={C}>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                            <li>Deliver, maintain, and improve the Service.</li>
                            <li>Process payments and manage subscriptions.</li>
                            <li>Send transactional emails (password resets, billing receipts, compliance deadlines).</li>
                            <li>Generate AI-assisted compliance assessments and reports.</li>
                            <li>Monitor platform security and detect abuse.</li>
                            <li>Comply with legal and regulatory obligations.</li>
                        </ul>
                        <p>We do <strong>not</strong> sell your personal data to third parties. We do not use your compliance input data to train general-purpose AI models.</p>
                    </Section>

                    <Section title="5. Data Retention" C={C}>
                        <p>We retain your account data for as long as your account is active or as needed to provide the Service. Interaction logs and AI query history are automatically purged after <strong>90 days</strong> by default (configurable by your organization administrator). Upon account deletion, personal data is removed within 30 days subject to legal hold obligations.</p>
                    </Section>

                    <Section title="6. Data Sharing" C={C}>
                        <p>We share data only with:</p>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                            <li><strong>Stripe</strong> — payment processing (Stripe Privacy Policy: stripe.com/privacy).</li>
                            <li><strong>SMTP service provider</strong> — transactional email delivery.</li>
                            <li><strong>Law enforcement / regulators</strong> — when required by applicable law.</li>
                        </ul>
                        <p>All sub-processors are bound by data processing agreements consistent with applicable privacy regulations.</p>
                    </Section>

                    <Section title="7. Cross-Border Data Transfers" C={C}>
                        <p>The Service is designed to assist with regulatory compliance in the Kingdom of Saudi Arabia (KSA) and the People's Republic of China (PRC). Data processing may occur on servers located outside your country of residence. Where we transfer personal data internationally, we apply appropriate safeguards in accordance with Article 49 of China's PIPL and Article 26 of Saudi Arabia's PDPL.</p>
                    </Section>

                    <Section title="8. Your Rights" C={C}>
                        <p>Depending on your jurisdiction, you may have the right to:</p>
                        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
                            <li><strong>Access</strong> — request a copy of personal data we hold about you.</li>
                            <li><strong>Correction</strong> — request correction of inaccurate data.</li>
                            <li><strong>Deletion</strong> — request erasure of your personal data ("right to be forgotten").</li>
                            <li><strong>Portability</strong> — receive your data in a machine-readable format.</li>
                            <li><strong>Objection / Restriction</strong> — object to or restrict certain processing activities.</li>
                            <li><strong>Withdraw consent</strong> — where processing is based on consent.</li>
                        </ul>
                        <p>To exercise any of these rights, contact us at: <strong>privacy@yallahack.com</strong>.</p>
                    </Section>

                    <Section title="9. Security" C={C}>
                        <p>We implement industry-standard security measures including: TLS encryption in transit, bcrypt password hashing, JWT-based session tokens, HTTP security headers (CSP, HSTS, X-Frame-Options), and role-based access controls. However, no system is completely secure. You are responsible for keeping your account credentials confidential.</p>
                    </Section>

                    <Section title="10. Cookies" C={C}>
                        <p>The Service uses HTTP-only session cookies for authentication. We do not use third-party tracking or advertising cookies. You may disable cookies in your browser settings, but this will prevent you from logging in to the Service.</p>
                    </Section>

                    <Section title="11. Children's Privacy" C={C}>
                        <p>The Service is not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If we become aware of such collection, we will delete the information promptly.</p>
                    </Section>

                    <Section title="12. Changes to This Policy" C={C}>
                        <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email or prominent notice within the Service at least 30 days before the changes take effect. The "Last updated" date at the top of this page will reflect the most recent revision.</p>
                    </Section>

                    <Section title="13. Contact" C={C}>
                        <p>For privacy inquiries, data subject requests, or to reach our Data Protection Officer:</p>
                        <p>
                            <strong>Yalla Hack</strong><br />
                            Email: privacy@yallahack.com<br />
                        </p>
                    </Section>

                    <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setLocation("/terms")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.cyan, fontSize: 13, cursor: "pointer", padding: "8px 16px" }}>
                            View Terms of Service →
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

function SubHeading({ children, C }: { children: React.ReactNode; C: ReturnType<typeof useC> }) {
    return (
        <p style={{ fontWeight: 600, color: C.text, fontSize: 13.5, margin: "16px 0 6px" }}>
            {children}
        </p>
    );
}
