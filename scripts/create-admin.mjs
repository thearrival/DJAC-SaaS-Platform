/**
 * create-admin.mjs
 *
 * Bootstrap utility — creates a local `admin` account in the localUsers table.
 * Run once after applying migration 0005_local_auth_users.sql.
 *
 * Usage:
 *   node scripts/create-admin.mjs --name "Admin" --email admin@example.com --password "ChangeMe1!"
 *
 * Reads DATABASE_URL from .env (or environment).
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ─── Parse CLI args ────────────────────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const get = (flag) => {
        const i = args.indexOf(flag);
        return i !== -1 && args[i + 1] ? args[i + 1] : null;
    };
    return {
        name: get("--name"),
        email: get("--email"),
        password: get("--password"),
    };
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const { name, email, password } = parseArgs();

    if (!name || !email || !password) {
        console.error(
            "Usage: node scripts/create-admin.mjs --name <name> --email <email> --password <password>"
        );
        process.exit(1);
    }

    const emailNorm = email.trim().toLowerCase();

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        console.error(
            "Password must be at least 8 characters and contain an uppercase letter and a number."
        );
        process.exit(1);
    }

    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error("DATABASE_URL is not set. Add it to .env or export it before running.");
        process.exit(1);
    }

    const conn = await mysql.createConnection(DATABASE_URL);

    // Check for existing account
    const [existing] = await conn.execute(
        "SELECT id FROM localUsers WHERE email = ? LIMIT 1",
        [emailNorm]
    );
    if (existing.length > 0) {
        console.error(`An account with email "${emailNorm}" already exists (id=${existing[0].id}).`);
        await conn.end();
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await conn.execute(
        `INSERT INTO localUsers (name, email, passwordHash, userType, preferredLocale, status)
         VALUES (?, ?, ?, 'admin', 'en', 'active')`,
        [name.trim(), emailNorm, passwordHash]
    );

    const [rows] = await conn.execute(
        "SELECT id, name, email, userType, status, createdAt FROM localUsers WHERE email = ? LIMIT 1",
        [emailNorm]
    );
    await conn.end();

    console.log("\n✅  Admin account created successfully:");
    console.table(rows);
    console.log(
        "\nYou can now sign in at /login with this email and password.\n"
    );
}

main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
});