/**
 * Org Members Router � team management for the current organization.
 *
 * Procedures:
 *   orgMembers.myOrg         � current org details + caller's role
 *   orgMembers.list          � all active/invited members + joined user profiles
 *   orgMembers.updateRole    � change a member's role (owner/admin only)
 *   orgMembers.remove        � remove a member (owner/admin only, cannot remove owner)
 *   orgMembers.invite        � invite a new member by email
 *   orgMembers.lookupInvite  � public token lookup for the invite landing page
 *   orgMembers.acceptInvite  � accept an invite token (authenticated)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orgAdminProcedure, orgProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { ENV } from "./_core/env";
import { sendEmail } from "./email";
import { recordAuditEvent } from "./audit-logger";
import { randomBytes } from "crypto";
import {
    getMyOrg,
    listOrgMembers,
    getOrgMember,
    updateMemberRole,
    deleteMember,
    getOrgForInvite,
    countActiveMembers,
    checkDuplicateInvite,
    insertInvite,
    lookupInviteToken,
    getInviteByToken,
    activateInvite,
} from "./org-members-store";

const EDITABLE_ROLES = ["admin", "compliance_officer", "analyst"] as const;

export const orgMembersRouter = router({

    myOrg: orgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "team_members", "canView");
        return getMyOrg(ctx.organizationId, ctx.organizationRole);
    }),

    list: orgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "team_members", "canView");
        return listOrgMembers(ctx.organizationId, ctx.user?.id ?? -999);
    }),

    updateRole: orgAdminProcedure
        .input(
            z.object({
                memberId: z.number().int().positive(),
                newRole: z.enum(EDITABLE_ROLES),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "team_members", "canEdit");
            const member = await getOrgMember(ctx.organizationId, input.memberId);
            if (!member) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in this organization." });
            }
            if (member.role === "owner") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "The organization owner's role cannot be changed here.",
                });
            }
            await updateMemberRole(input.memberId, input.newRole);
            void recordAuditEvent(ctx, {
                category: "role_change",
                action: "user.role.change",
                entityType: "organizationMembers",
                entityId: input.memberId,
                payload: { newRole: input.newRole, organizationId: ctx.organizationId },
            });
            return { success: true };
        }),

    remove: orgAdminProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "team_members", "canDelete");
            const member = await getOrgMember(ctx.organizationId, input);
            if (!member) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in this organization." });
            }
            if (member.role === "owner") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "The organization owner cannot be removed. Transfer ownership first.",
                });
            }
            await deleteMember(input);
            void recordAuditEvent(ctx, {
                category: "role_change",
                action: "user.remove",
                entityType: "organizationMembers",
                entityId: input,
                payload: { organizationId: ctx.organizationId },
            });
            return { success: true };
        }),

    invite: orgAdminProcedure
        .input(
            z.object({
                email: z.string().email().max(320),
                role: z.enum(EDITABLE_ROLES),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "team_members", "canInvite");
            const inviteEmailRaw = input.email.trim();
            const inviteEmail = inviteEmailRaw.toLowerCase();
            if (ctx.organizationId < 0) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot invite members in dev-bypass mode." });
            }

            const org = await getOrgForInvite(ctx.organizationId);
            if (!org) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found." });
            }

            const activeCount = await countActiveMembers(ctx.organizationId);
            if (activeCount >= org.maxSeats) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Seat limit reached. Upgrade your plan to invite more members.",
                });
            }

            const isDuplicate = await checkDuplicateInvite(ctx.organizationId, inviteEmail);
            if (isDuplicate) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This email already has a membership or pending invite in your organization.",
                });
            }

            const inviteToken = randomBytes(32).toString("hex");
            const inviteLink = `${ENV.appUrl}/invite-accept?token=${inviteToken}`;
            const inviterName = ctx.user.name ?? "A team admin";
            const rolePretty = input.role.replace(/_/g, " ");

            await insertInvite(ctx.organizationId, input.role, inviteEmail, inviteToken, ctx.user.id);

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "user.invite",
                entityType: "organizationMembers",
                entityId: ctx.organizationId,
                payload: { inviteEmail, role: input.role },
            });

            await sendEmail({
                to: inviteEmailRaw,
                subject: `You've been invited to join ${org.name} on DJAC`,
                html: `
<div style="font-family:sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#6d28d9">You've been invited!</h2>
  <p><strong>${inviterName}</strong> has invited you to join <strong>${org.name}</strong> on <strong>DJAC Compliance Platform</strong> as <strong>${rolePretty}</strong>.</p>
  <p style="margin:24px 0">
    <a href="${inviteLink}" style="background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      Accept Invitation
    </a>
  </p>
  <p style="color:#6b7280;font-size:13px">This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
</div>`,
                text: `You've been invited to join ${org.name} on DJAC as ${rolePretty}. Accept your invitation: ${inviteLink}`,
            });

            return { success: true };
        }),

    lookupInvite: publicProcedure
        .input(z.string().min(1).max(64))
        .query(async ({ input }) => {
            const row = await lookupInviteToken(input);
            if (!row) {
                return { valid: false, expired: false, orgName: null, orgSlug: null, role: null, inviteEmail: null };
            }
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            const expired = Date.now() - new Date(row.createdAt).getTime() > SEVEN_DAYS;
            if (row.status !== "invited" || expired) {
                return { valid: false, expired, orgName: null, orgSlug: null, role: null, inviteEmail: null };
            }
            return { valid: true, expired: false, orgName: row.orgName, orgSlug: row.orgSlug, role: row.role as string, inviteEmail: row.inviteEmail };
        }),

    acceptInvite: protectedProcedure
        .input(z.string().min(1).max(64))
        .mutation(async ({ ctx, input }) => {
            const member = await getInviteByToken(input);
            if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found." });
            if (member.status !== "invited") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has already been used or was cancelled." });
            }
            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - new Date(member.createdAt).getTime() > SEVEN_DAYS) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
            }
            const userEmail = ctx.user.email?.trim().toLowerCase() ?? "";
            const inviteEmail = member.inviteEmail?.trim().toLowerCase() ?? "";
            if (!userEmail || !inviteEmail || userEmail !== inviteEmail) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This invitation is issued for a different account email.",
                });
            }
            await activateInvite(member.id, ctx.user.id);
            void recordAuditEvent(ctx, {
                category: "role_change",
                action: "user.invite.accept",
                entityType: "organizationMembers",
                entityId: member.id,
                payload: { organizationId: member.organizationId, inviteEmail },
            });
            return { success: true, organizationId: member.organizationId };
        }),
});

export type OrgMembersRouter = typeof orgMembersRouter;
