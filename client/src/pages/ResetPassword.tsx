/**
 * DJAC Reset Password page — redirects to ForgotPassword.
 * OTP-based password reset is now handled entirely in /forgot-password.
 * Route: /reset-password
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ResetPassword() {
    usePageTitle("Reset Password — DJAC");
    const [, navigate] = useLocation();

    useEffect(() => {
        navigate("/forgot-password", { replace: true });
    }, [navigate]);

    return null;
}
