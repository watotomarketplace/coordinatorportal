/**
 * import-formation-groups.js
 *
 * ONE-TIME SCRIPT — Creates all formation groups from the WL101 Notion/Tally data.
 *
 * Usage (from project root):
 *   node scripts/import-formation-groups.js
 *
 * Safe to re-run — skips groups that already exist.
 * After running, go to Settings → Notion Integration → Save & Restart Sync.
 *
 * All typo codes (e.g. "WCG03", "NT 07", "Group 55") are handled in notion-sync.js
 * via CODE_ALIASES — this script only creates the canonical target groups.
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = join(__dirname, '..', 'server', 'db', 'users.sqlite')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// ─── Canonical group list ─────────────────────────────────────────
// Only canonical, correctly-coded groups. All typo aliases are in
// notion-sync.js CODE_ALIASES and get mapped to these on sync.
//
// Corrections applied vs raw CSV:
//   WBB24         → Bbira (WBB prefix, was wrongly filed under Bweyogerere)
//   WCG03/08/10   → WGU03/08/10 (Gulu; C was extra character)
//   WCG23         → WBG23 (Bugolobi; C→B typo — alias only, group exists)
//   All NT##      → WNT## (Ntinda; missing W prefix)
//   All ON#       → WON0# (Online; missing W prefix)
//   WJL2/3/9      → WJB02/03/09 (Juba; L→B typo)
//   WNT27         → created from "WNT28&27" split
//   WKY18         → created from "WKY08 AND WKY18" split
//   WDT06         → created from WTGP6/WTD06 (Florence Wamaniala, Downtown)
//   Group 3/6/12/13/15/31/55/57 → correct campus codes (see below)
const GROUPS = [

    // ── BBIRA (WBB) ────────────────────────────────────────────────
    { group_code: "WBB02", celebration_point: "Bbira" },
    { group_code: "WBB03", celebration_point: "Bbira" },
    { group_code: "WBB04", celebration_point: "Bbira" },
    { group_code: "WBB06", celebration_point: "Bbira" },
    { group_code: "WBB07", celebration_point: "Bbira" },
    { group_code: "WBB10", celebration_point: "Bbira" },
    { group_code: "WBB11", celebration_point: "Bbira" },
    { group_code: "WBB12", celebration_point: "Bbira" },
    { group_code: "WBB24", celebration_point: "Bbira" }, // fixed: was Bweyogerere

    // ── BUGOLOBI (WBG) ─────────────────────────────────────────────
    { group_code: "WBG02", celebration_point: "Bugolobi" },
    { group_code: "WBG06", celebration_point: "Bugolobi" },
    { group_code: "WBG08", celebration_point: "Bugolobi" },
    { group_code: "WBG09", celebration_point: "Bugolobi" },
    { group_code: "WBG11", celebration_point: "Bugolobi" },
    { group_code: "WBG12", celebration_point: "Bugolobi" },
    { group_code: "WBG15", celebration_point: "Bugolobi" },
    { group_code: "WBG16", celebration_point: "Bugolobi" },
    { group_code: "WBG19", celebration_point: "Bugolobi" },
    { group_code: "WBG20", celebration_point: "Bugolobi" },
    { group_code: "WBG21", celebration_point: "Bugolobi" },
    { group_code: "WBG22", celebration_point: "Bugolobi" },
    { group_code: "WBG23", celebration_point: "Bugolobi" }, // WCG23 alias
    { group_code: "WBG24", celebration_point: "Bugolobi" },
    { group_code: "WBG25", celebration_point: "Bugolobi" },
    { group_code: "WBG26", celebration_point: "Bugolobi" },
    { group_code: "WBG27", celebration_point: "Bugolobi" },
    { group_code: "WBG28", celebration_point: "Bugolobi" },
    { group_code: "WBG29", celebration_point: "Bugolobi" },

    // ── BWEYOGERERE (WBW) ──────────────────────────────────────────
    { group_code: "WBW01", celebration_point: "Bweyogerere" },
    { group_code: "WBW02", celebration_point: "Bweyogerere" },
    { group_code: "WBW03", celebration_point: "Bweyogerere" },
    { group_code: "WBW04", celebration_point: "Bweyogerere" },
    { group_code: "WBW05", celebration_point: "Bweyogerere" },
    { group_code: "WBW06", celebration_point: "Bweyogerere" },
    { group_code: "WBW07", celebration_point: "Bweyogerere" },
    { group_code: "WBW08", celebration_point: "Bweyogerere" },
    { group_code: "WBW09", celebration_point: "Bweyogerere" },
    { group_code: "WBW10", celebration_point: "Bweyogerere" },
    { group_code: "WBW11", celebration_point: "Bweyogerere" },
    { group_code: "WBW12", celebration_point: "Bweyogerere" },
    { group_code: "WBW13", celebration_point: "Bweyogerere" },
    { group_code: "WBW14", celebration_point: "Bweyogerere" },
    { group_code: "WBW15", celebration_point: "Bweyogerere" },
    { group_code: "WBW16", celebration_point: "Bweyogerere" }, // WBW016 alias
    { group_code: "WBW17", celebration_point: "Bweyogerere" },
    { group_code: "WBW18", celebration_point: "Bweyogerere" }, // WBW-18 alias
    { group_code: "WBW19", celebration_point: "Bweyogerere" },
    { group_code: "WBW20", celebration_point: "Bweyogerere" },
    { group_code: "WBW21", celebration_point: "Bweyogerere" },
    { group_code: "WBW22", celebration_point: "Bweyogerere" },
    { group_code: "WBW23", celebration_point: "Bweyogerere" },
    { group_code: "WBW24", celebration_point: "Bweyogerere" },
    { group_code: "WBW25", celebration_point: "Bweyogerere" },
    { group_code: "WBW26", celebration_point: "Bweyogerere" },

    // ── DOWNTOWN (WDT) ─────────────────────────────────────────────
    { group_code: "WDT01", celebration_point: "Downtown" },
    { group_code: "WDT02", celebration_point: "Downtown" },
    { group_code: "WDT03", celebration_point: "Downtown" }, // new — from "Group 3"
    { group_code: "WDT04", celebration_point: "Downtown" },
    { group_code: "WDT05", celebration_point: "Downtown" },
    { group_code: "WDT06", celebration_point: "Downtown" }, // new — from WTD06/WTGP6
    { group_code: "WDT07", celebration_point: "Downtown" }, // WDT7 / DT-W101 7
    { group_code: "WDT08", celebration_point: "Downtown" }, // WDT8
    { group_code: "WDT09", celebration_point: "Downtown" },
    { group_code: "WDT10", celebration_point: "Downtown" },
    { group_code: "WDT11", celebration_point: "Downtown" },
    { group_code: "WDT12", celebration_point: "Downtown" }, // "Group12" alias
    { group_code: "WDT13", celebration_point: "Downtown" },
    { group_code: "WDT14", celebration_point: "Downtown" }, // WL14 alias
    { group_code: "WDT15", celebration_point: "Downtown" },
    { group_code: "WDT16", celebration_point: "Downtown" },
    { group_code: "WDT17", celebration_point: "Downtown" },
    { group_code: "WDT18", celebration_point: "Downtown" },
    { group_code: "WDT19", celebration_point: "Downtown" },
    { group_code: "WDT20", celebration_point: "Downtown" },
    { group_code: "WDT21", celebration_point: "Downtown" },
    { group_code: "WDT22", celebration_point: "Downtown" },
    { group_code: "WDT23", celebration_point: "Downtown" },
    { group_code: "WDT24", celebration_point: "Downtown" },
    { group_code: "WDT25", celebration_point: "Downtown" }, // WL101 GROUP-25 alias

    // ── ENTEBBE (WEN) ──────────────────────────────────────────────
    { group_code: "WEN03", celebration_point: "Entebbe" },
    { group_code: "WEN05", celebration_point: "Entebbe" },
    { group_code: "WEN06", celebration_point: "Entebbe" },
    { group_code: "WEN08", celebration_point: "Entebbe" },
    { group_code: "WEN11", celebration_point: "Entebbe" },
    { group_code: "WEN13", celebration_point: "Entebbe" }, // WEN013 alias
    { group_code: "WEN14", celebration_point: "Entebbe" },
    { group_code: "WEN15", celebration_point: "Entebbe" },
    { group_code: "WEN16", celebration_point: "Entebbe" },

    // ── GULU (WGU) ─────────────────────────────────────────────────
    { group_code: "WGU03", celebration_point: "Gulu" }, // new — from WCG03
    { group_code: "WGU06", celebration_point: "Gulu" }, // new — from "Group 6"
    { group_code: "WGU08", celebration_point: "Gulu" }, // new — from WCG08
    { group_code: "WGU10", celebration_point: "Gulu" }, // new — from WCG10

    // ── JINJA (WJJ) ────────────────────────────────────────────────
    { group_code: "WJJ01", celebration_point: "Jinja" },
    { group_code: "WJJ02", celebration_point: "Jinja" },
    { group_code: "WJJ03", celebration_point: "Jinja" },
    { group_code: "WJJ04", celebration_point: "Jinja" },
    { group_code: "WJJ05", celebration_point: "Jinja" },
    { group_code: "WJJ06", celebration_point: "Jinja" },
    { group_code: "WJJ07", celebration_point: "Jinja" },
    { group_code: "WJJ08", celebration_point: "Jinja" },

    // ── JUBA (WJB) ─────────────────────────────────────────────────
    // WJL2/3/9 → WJB02/03/09 (L→B typo); WBJ17 → WJB17 (letters swapped)
    { group_code: "WJB01", celebration_point: "Juba" }, // WJB1 alias
    { group_code: "WJB02", celebration_point: "Juba" }, // WJL2 alias
    { group_code: "WJB03", celebration_point: "Juba" }, // WJL3 / WJB03 alias
    { group_code: "WJB04", celebration_point: "Juba" },
    { group_code: "WJB06", celebration_point: "Juba" }, // WJB6 alias
    { group_code: "WJB07", celebration_point: "Juba" }, // WJB7 alias
    { group_code: "WJB09", celebration_point: "Juba" }, // WJL9 / WJB09 alias
    { group_code: "WJB10", celebration_point: "Juba" },
    { group_code: "WJB11", celebration_point: "Juba" },
    { group_code: "WJB12", celebration_point: "Juba" },
    { group_code: "WJB13", celebration_point: "Juba" },
    { group_code: "WJB15", celebration_point: "Juba" },
    { group_code: "WJB16", celebration_point: "Juba" },
    { group_code: "WJB17", celebration_point: "Juba" }, // WBJ17 alias
    { group_code: "WJB19", celebration_point: "Juba" }, // WJB019 alias

    // ── KYENGERA (WKY) ─────────────────────────────────────────────
    // WCK02 → WKY02, WCKY 004 → WKY04, WCKY12 → WKY12
    // WK06 → WKY06, WK-Group C → WKY03
    { group_code: "WKY01", celebration_point: "Kyengera" },
    { group_code: "WKY02", celebration_point: "Kyengera" },
    { group_code: "WKY03", celebration_point: "Kyengera" }, // WK-Group C
    { group_code: "WKY04", celebration_point: "Kyengera" },
    { group_code: "WKY05", celebration_point: "Kyengera" },
    { group_code: "WKY06", celebration_point: "Kyengera" },
    { group_code: "WKY07", celebration_point: "Kyengera" },
    { group_code: "WKY08", celebration_point: "Kyengera" },
    { group_code: "WKY09", celebration_point: "Kyengera" },
    { group_code: "WKY10", celebration_point: "Kyengera" },
    { group_code: "WKY11", celebration_point: "Kyengera" },
    { group_code: "WKY12", celebration_point: "Kyengera" },
    { group_code: "WKY13", celebration_point: "Kyengera" },
    { group_code: "WKY14", celebration_point: "Kyengera" },
    { group_code: "WKY15", celebration_point: "Kyengera" },
    { group_code: "WKY16", celebration_point: "Kyengera" },
    { group_code: "WKY18", celebration_point: "Kyengera" }, // split from WKY08 AND WKY18

    // ── LUBOWA (WLB) ───────────────────────────────────────────────
    { group_code: "WLB01", celebration_point: "Lubowa" },
    { group_code: "WLB02", celebration_point: "Lubowa" }, // Group 2 101 (WLB02)
    { group_code: "WLB03", celebration_point: "Lubowa" },
    { group_code: "WLB04", celebration_point: "Lubowa" }, // WL B04 alias
    { group_code: "WLB05", celebration_point: "Lubowa" },
    { group_code: "WLB07", celebration_point: "Lubowa" },
    { group_code: "WLB08", celebration_point: "Lubowa" }, // new — WL101 Group 8 / WLBO8
    { group_code: "WLB09", celebration_point: "Lubowa" },
    { group_code: "WLB11", celebration_point: "Lubowa" }, // new — WL101-B11
    { group_code: "WLB12", celebration_point: "Lubowa" },
    { group_code: "WLB13", celebration_point: "Lubowa" }, // WLB 13 alias
    { group_code: "WLB14", celebration_point: "Lubowa" }, // new — B14
    { group_code: "WLB16", celebration_point: "Lubowa" },
    { group_code: "WLB17", celebration_point: "Lubowa" },
    { group_code: "WLB18", celebration_point: "Lubowa" },

    // ── MBARARA (WMB) ──────────────────────────────────────────────
    { group_code: "WMB03", celebration_point: "Mbarara" },
    { group_code: "WMB11", celebration_point: "Mbarara" },

    // ── MUKONO (WMK) ───────────────────────────────────────────────
    // WCM10 → WMK10, WC MK 01 → WMK01
    { group_code: "WMK01", celebration_point: "Mukono" },
    { group_code: "WMK02", celebration_point: "Mukono" },
    { group_code: "WMK03", celebration_point: "Mukono" },
    { group_code: "WMK04", celebration_point: "Mukono" },
    { group_code: "WMK07", celebration_point: "Mukono" },
    { group_code: "WMK08", celebration_point: "Mukono" },
    { group_code: "WMK09", celebration_point: "Mukono" },
    { group_code: "WMK10", celebration_point: "Mukono" },
    { group_code: "WMK11", celebration_point: "Mukono" },
    { group_code: "WMK12", celebration_point: "Mukono" },
    { group_code: "WMK14", celebration_point: "Mukono" }, // WMK014 alias
    { group_code: "WMK15", celebration_point: "Mukono" }, // WMK 15 alias
    { group_code: "WMK16", celebration_point: "Mukono" },

    // ── NANSANA (WNW) ──────────────────────────────────────────────
    // WNW-01, WNW 02 etc. are all aliases → WNW01, WNW02, etc.
    // WN3G2 → Irene Plan self-corrected to WNW13 next week, so no new group needed
    { group_code: "WNW01", celebration_point: "Nansana" },
    { group_code: "WNW02", celebration_point: "Nansana" },
    { group_code: "WNW03", celebration_point: "Nansana" }, // WNW:03(9-11am) alias
    { group_code: "WNW04", celebration_point: "Nansana" },
    { group_code: "WNW05", celebration_point: "Nansana" },
    { group_code: "WNW06", celebration_point: "Nansana" },
    { group_code: "WNW08", celebration_point: "Nansana" },
    { group_code: "WNW09", celebration_point: "Nansana" },
    { group_code: "WNW10", celebration_point: "Nansana" },
    { group_code: "WNW11", celebration_point: "Nansana" },
    { group_code: "WNW12", celebration_point: "Nansana" },
    { group_code: "WNW13", celebration_point: "Nansana" }, // WN3G2 self-corrected here
    { group_code: "WNW14", celebration_point: "Nansana" },

    // ── NTINDA (WNT) ───────────────────────────────────────────────
    // NT## → WNT## (missing W prefix); WCN58 → WNT58; WD 28 → WNT28
    // WNT27 from "WNT28&27" split; Group 55 → WNT55 (new)
    { group_code: "WNT01", celebration_point: "Ntinda" },
    { group_code: "WNT03", celebration_point: "Ntinda" },
    { group_code: "WNT04", celebration_point: "Ntinda" },
    { group_code: "WNT06", celebration_point: "Ntinda" },
    { group_code: "WNT07", celebration_point: "Ntinda" }, // new — NT 07
    { group_code: "WNT10", celebration_point: "Ntinda" },
    { group_code: "WNT11", celebration_point: "Ntinda" }, // new — NT11
    { group_code: "WNT13", celebration_point: "Ntinda" }, // Group 13 alias
    { group_code: "WNT14", celebration_point: "Ntinda" }, // new — NT14
    { group_code: "WNT16", celebration_point: "Ntinda" },
    { group_code: "WNT17", celebration_point: "Ntinda" },
    { group_code: "WNT18", celebration_point: "Ntinda" }, // "18" alias
    { group_code: "WNT19", celebration_point: "Ntinda" }, // WN GROUP 19 alias
    { group_code: "WNT21", celebration_point: "Ntinda" },
    { group_code: "WNT22", celebration_point: "Ntinda" },
    { group_code: "WNT25", celebration_point: "Ntinda" }, // new — NT25
    { group_code: "WNT26", celebration_point: "Ntinda" }, // NT26 alias
    { group_code: "WNT27", celebration_point: "Ntinda" }, // split from WNT28&27
    { group_code: "WNT28", celebration_point: "Ntinda" }, // split from WNT28&27; WD 28 alias
    { group_code: "WNT29", celebration_point: "Ntinda" }, // new — from "29"
    { group_code: "WNT30", celebration_point: "Ntinda" }, // new — NT 30
    { group_code: "WNT31", celebration_point: "Ntinda" }, // Group 31 alias
    { group_code: "WNT32", celebration_point: "Ntinda" },
    { group_code: "WNT33", celebration_point: "Ntinda" }, // new — NT33
    { group_code: "WNT37", celebration_point: "Ntinda" }, // new — WN37 (no prior WNT37)
    { group_code: "WNT40", celebration_point: "Ntinda" },
    { group_code: "WNT41", celebration_point: "Ntinda" },
    { group_code: "WNT42", celebration_point: "Ntinda" },
    { group_code: "WNT43", celebration_point: "Ntinda" },
    { group_code: "WNT44", celebration_point: "Ntinda" },
    { group_code: "WNT46", celebration_point: "Ntinda" }, // NT46 alias
    { group_code: "WNT48", celebration_point: "Ntinda" }, // WN48 alias
    { group_code: "WNT50", celebration_point: "Ntinda" }, // WNL101-Group 50 alias
    { group_code: "WNT52", celebration_point: "Ntinda" },
    { group_code: "WNT53", celebration_point: "Ntinda" }, // NT53 alias
    { group_code: "WNT54", celebration_point: "Ntinda" }, // new — W101N Group 54
    { group_code: "WNT55", celebration_point: "Ntinda" }, // new — Group 55
    { group_code: "WNT56", celebration_point: "Ntinda" },
    { group_code: "WNT57", celebration_point: "Ntinda" }, // Group 57 alias
    { group_code: "WNT58", celebration_point: "Ntinda" }, // WCN58 alias
    { group_code: "WNT59", celebration_point: "Ntinda" }, // NT 59 / "59" alias
    { group_code: "WNT62", celebration_point: "Ntinda" },

    // ── ONLINE (WON) ───────────────────────────────────────────────
    // ON1 → WON01, ON3 → WON03, WONO3 → WON03
    { group_code: "WON01", celebration_point: "Online" },
    { group_code: "WON02", celebration_point: "Online" },
    { group_code: "WON03", celebration_point: "Online" }, // ON3 / WONO3 alias
    { group_code: "WON06", celebration_point: "Online" },
    { group_code: "WON07", celebration_point: "Online" },

    // ── SUUBI (WSU) ────────────────────────────────────────────────
    { group_code: "WSU03", celebration_point: "Suubi" },
    { group_code: "WSU06", celebration_point: "Suubi" },
]

// ─── Insert helpers ───────────────────────────────────────────────
const checkExists = db.prepare(`SELECT id FROM formation_groups WHERE group_code = ?`)
const insert = db.prepare(`
    INSERT INTO formation_groups (group_code, name, celebration_point, cohort, active, created_at)
    VALUES (?, ?, ?, '2026', 1, CURRENT_TIMESTAMP)
`)

let created = 0, skipped = 0, errors = 0

console.log(`\n🚀 Importing ${GROUPS.length} canonical formation groups...\n`)

const run = db.transaction(() => {
    for (const g of GROUPS) {
        try {
            if (checkExists.get(g.group_code)) {
                skipped++
            } else {
                insert.run(g.group_code, g.group_code, g.celebration_point)
                created++
            }
        } catch (err) {
            console.error(`  ❌ ${g.group_code}: ${err.message}`)
            errors++
        }
    }
})

run()

// Summary by campus
const byCampus = db.prepare(`
    SELECT celebration_point, COUNT(*) as n
    FROM formation_groups WHERE cohort = '2026' AND active = 1
    GROUP BY celebration_point ORDER BY celebration_point
`).all()

console.log('Groups by campus:')
let total = 0
for (const row of byCampus) {
    console.log(`  ${row.celebration_point}: ${row.n}`)
    total += row.n
}
console.log(`  ${'─'.repeat(42)}`)
console.log(`  Total: ${total}`)

console.log('\n═══════════════════════════════════════')
console.log(`✅ Created : ${created}`)
console.log(`⏭️  Skipped : ${skipped} (already existed)`)
console.log(`❌ Errors  : ${errors}`)
console.log('═══════════════════════════════════════')
console.log('\nNow go to Settings → Notion → Save & Restart Sync.\n')

db.close()
