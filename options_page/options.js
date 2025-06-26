import { BlockedSitesTable } from './blocked_sites_table.js';
import { CoveredElementsTable } from './covered_elements_table.js';


document.addEventListener("DOMContentLoaded", () => {
  new BlockedSitesTable("block-sites-table", "block-site-input", "block-append-row");
  new CoveredElementsTable("covered-elements-table", "cover-site-input", "cover-selector-input", "cover-append-row");
});

