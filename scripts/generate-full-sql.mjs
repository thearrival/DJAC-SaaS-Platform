import { readFileSync, writeFileSync } from "fs";

// Read the Drizzle schema file
const schema = readFileSync("./drizzle/schema.ts", "utf-8");

// Extract all pgTable declarations to get table names
const tableRegex = /export const (\w+) = pgTable\("(\w+)"/g;
const tables = [];
let match;
while ((match = tableRegex.exec(schema)) !== null) {
  tables.push({ varName: match[1], tableName: match[2] });
}

console.log(`Found ${tables.length} tables`);
tables.forEach((t) => console.log(`  ${t.varName} -> "${t.tableName}"`));

// Generate CREATE TABLE SQL for each table
// (This is a simplified version - in reality you'd use Drizzle's push function)
writeFileSync("./drizzle/all-tables.txt", tables.map((t) => t.tableName).join("\n"));

console.log("\nTable list written to drizzle/all-tables.txt");
