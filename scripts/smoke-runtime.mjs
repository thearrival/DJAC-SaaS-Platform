const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const mode = process.env.SMOKE_EXPECT_MODE || "permissive"; // permissive | strict
const checkEmail = process.env.SMOKE_CHECK_REPORT_EMAIL === "true";

const log = (...args) => console.log("[smoke-runtime]", ...args);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function asText(response) {
    const text = await response.text();
    return {
        status: response.status,
        text,
        setCookie: response.headers.get("set-cookie") || "",
    };
}

async function postTrpc(path, payload, headers = {}) {
    const response = await fetchWithHint(`${baseUrl}/api/trpc/${path}`,
        `Unable to reach ${baseUrl}. Start the app server before running smoke checks.`
        , {
            method: "POST",
            headers: {
                "content-type": "application/json",
                ...headers,
            },
            body: JSON.stringify({ json: payload }),
        });
    return asText(response);
}

async function fetchWithHint(url, hint, init) {
    try {
        return await fetch(url, init);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${hint} Request: ${url}. Root cause: ${message}`, { cause: error });
    }
}

async function run() {
    log(`Base URL: ${baseUrl}`);
    log(`Expectation mode: ${mode}`);

    const health = await fetchWithHint(
        `${baseUrl}/api/healthz`,
        `Unable to reach ${baseUrl}. Start the app server before running smoke checks.`
    );
    const healthBody = await health.text();
    log("healthz", health.status, healthBody);
    assert(health.ok, "healthz endpoint is not healthy");

    const ready = await fetchWithHint(
        `${baseUrl}/api/readyz`,
        `Unable to reach ${baseUrl}. Start the app server before running smoke checks.`
    );
    const readyBody = await ready.text();
    log("readyz", ready.status, readyBody);

    const rnd = Math.floor(Math.random() * 1_000_000);
    const email = `smoke${rnd}@example.com`;

    const register = await postTrpc("localAuth.register", {
        userType: "visitor",
        name: "Smoke Runtime",
        email,
        password: "Abcd1234",
    });
    log("register", register.status, register.text.slice(0, 220));

    const access = await postTrpc("portal.submitAccessRequest", {
        fullName: "Smoke Runtime",
        email,
        organizationName: "Smoke Org",
        useCase: "Smoke validation",
    });
    log("access", access.status, access.text.slice(0, 220));

    const consultation = await postTrpc("portal.submitConsultationRequest", {
        contactName: "Smoke Runtime",
        contactEmail: email,
        organizationName: "Smoke Org",
        topic: "Market entry readiness",
        jurisdictions: ["China"],
        summary:
            "This smoke test verifies consultation submission persistence and validation flow for runtime checks.",
    });
    log("consultation", consultation.status, consultation.text.slice(0, 220));

    if (mode === "strict") {
        assert(register.status >= 500, "register should fail in strict mode without DB");
        assert(access.status >= 500, "access request should fail in strict mode without DB");
        assert(
            consultation.status >= 500,
            "consultation request should fail in strict mode without DB"
        );
        log("Strict-mode checks passed");
        return;
    }

    assert(register.status === 200, "register should succeed in permissive mode");
    assert(access.status === 200, "access request should succeed in permissive mode");
    assert(
        consultation.status === 200,
        "consultation request should succeed in permissive mode"
    );

    const registerBody = JSON.parse(register.text);
    const needsVerification = registerBody?.result?.data?.json?.pendingVerification === true;

    if (needsVerification) {
        // OTP/verification flow: no session cookie until verified
        log("register", "pendingVerification=true (OTP flow — no session cookie expected)");
    } else {
        const cookiePair = (register.setCookie.split(";")[0] || "").trim();
        assert(cookiePair.startsWith("djac_local_session="), "register should set local auth cookie");

        const me = await fetchWithHint(
            `${baseUrl}/api/trpc/localAuth.me`,
            "Unable to resolve session lookup. Ensure server is running and cookie handling is enabled.",
            { headers: { cookie: cookiePair } }
        );
        const meBody = await me.text();
        log("me", me.status, meBody.slice(0, 220));
        assert(me.status === 200, "localAuth.me should return success");
        assert(meBody.includes(`"email":"${email}"`), "localAuth.me should include the new user");
    }

    const login = await postTrpc("localAuth.login", {
        email,
        password: "Abcd1234",
    });
    log("login", login.status, login.text.slice(0, 220));
    assert(login.status === 200, "localAuth.login should succeed with valid credentials");

    const sessionCookie = (login.setCookie || register.setCookie || "").split(";")[0].trim();

    const report = await postTrpc(
        "compliance.report",
        { jurisdiction: "both", locale: "en" },
        { cookie: sessionCookie }
    );
    log("report", report.status, report.text.slice(0, 220));

    const reportPdf = await postTrpc(
        "compliance.reportPdf",
        { jurisdiction: "both", locale: "en" },
        { cookie: sessionCookie }
    );
    log("reportPdf", reportPdf.status, reportPdf.text.slice(0, 220));

    const reportDocx = await postTrpc(
        "compliance.reportDocx",
        { jurisdiction: "both", locale: "en" },
        { cookie: sessionCookie }
    );
    log("reportDocx", reportDocx.status, reportDocx.text.slice(0, 220));

    assert(report.status === 200, "compliance.report should succeed for authenticated user");
    assert(report.text.includes("markdown"), "compliance.report should return markdown payload");
    assert(reportPdf.status === 200, "compliance.reportPdf should succeed for authenticated user");
    assert(reportPdf.text.includes("application/pdf"), "compliance.reportPdf should return PDF metadata");
    assert(reportDocx.status === 200, "compliance.reportDocx should succeed for authenticated user");
    assert(reportDocx.text.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "compliance.reportDocx should return DOCX metadata");

    if (checkEmail) {
        const reportEmail = await postTrpc("compliance.emailReport", {
            jurisdiction: "both",
            locale: "en",
            recipientEmail: email,
        });
        log("emailReport", reportEmail.status, reportEmail.text.slice(0, 220));
        assert(reportEmail.status === 200, "compliance.emailReport should succeed when SMOKE_CHECK_REPORT_EMAIL=true");
    }

    log("Permissive-mode checks passed");
}

run().catch((error) => {
    console.error("[smoke-runtime] FAILED:", error);
    process.exit(1);
});
