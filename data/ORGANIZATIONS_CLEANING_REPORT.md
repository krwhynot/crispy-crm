# Organizations CSV Cleaning Report

**Generated:** 2025-10-24 12:10:04

## Summary

- **Total records processed:** 1757
- **Organization types fixed:** 0
- **Encoding issues fixed:** 24
- **Duplicate names found:** 5
- **Notes fields merged:** 1296
- **Errors encountered:** 0

## Character Encoding Fixes

| Row | Field & Original | Fixed |
|-----|------------------|-------|
| 3 | name: Allen County School�S Food Service | Allen County School's Food Service |
| 97 | name: Moxie Coffee Caf� Catering | Moxie Coffee Café Catering |
| 107 | name: Paulie�S | Paulie's |
| 111 | name: Belva� | Belva |
| 117 | name: C K O S - Catered Events� | C K O S - Catered Events |
| 142 | name: Mrs C�S Grilled Cheese | Mrs C's Grilled Cheese |
| 192 | name: West Carroll Middle School� | West Carroll Middle School' |
| 194 | name: Zel�S Great Roast Beef | Zel's Great Roast Beef |
| 315 | name: Barley�S Brewing Company Ale House #1 | Barley's Brewing Company Ale House #1 |
| 403 | name: Carson�S Ribs | Carson's Ribs |
| 775 | name: Kathryn�S Place | Kathryn's Place |
| 808 | name: Leona�S Pizzeria | Leona's Pizzeria |
| 986 | name: Paulie Gee�S | Paulie Gee's |
| 1212 | name: Surf�S Up Franchising Corporation | Surf's Up Franchising Corporation |
| 1268 | name: Tiger Lily Caf� (Buys From Gfs) | Tiger Lily Café (Buys From Gfs) |
| 1269 | name: Tilly�S Tea Room | Tilly'S Tea Room |
| 1274 | name: Tony�S Tacos | Tony'S Tacos |
| 1281 | name: Trini�S Tasty Pastries | Trini'S Tasty Pastries |
| 1396 | name: Cascade Hills Country Club� 18682e | Cascade Hills Country Club' 18682e |
| 1402 | name: Crowes Nest Caf� | Crowes Nest Café |
| 1535 | name: Ritchie�S Food Service | Ritchie'S Food Service |
| 1650 | name: Artisan� Pizza Cafe | Artisan' Pizza Cafe |
| 1684 | name: O�callaghan'S | O'callaghan'S |
| 1686 | name: Trail�S Edge Brewing Co | Trail'S Edge Brewing Co |

## Duplicate Organization Names ⚠️

**Action Required:** Review these duplicates to determine if they should be:
- Merged (same entity)
- Differentiated (add location/identifier)
- Kept separate (legitimately different entities)

| Name | Occurrences | Row Numbers |
|------|-------------|-------------|
| sysco | 2 | 24, 1631 |
| gordon food service | 2 | 199, 637 |
| girl in the goat2 | 2 | 201, 216 |
| bobcat bonnies | 2 | 204, 206 |
| sysco - chicago dc | 2 | 223, 1221 |

## Next Steps

1. **Review duplicates** listed above and manually resolve
2. **Validate cleaned CSV** by opening in spreadsheet software
3. **Test migration** on local database:
   ```bash
   npm run db:local:reset
   # Run migration script with organizations_cleaned.csv
   ```
4. **Verify data quality** with SQL queries
5. **Document resolution** of duplicates in this report

## Data Quality Metrics

- **Ready for migration:** ⚠️ REVIEW REQUIRED - 5 duplicate(s) need manual review

**Cleaned CSV location:** `data/csv-files/organizations_cleaned.csv`

