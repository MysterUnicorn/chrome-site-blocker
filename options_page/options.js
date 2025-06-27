import { BlockedSitesTable } from './blocked_sites_table.js';
import { ConcealedElementsTable } from './concealed_elements_table.js';


document.addEventListener("DOMContentLoaded", () => {
  new BlockedSitesTable("block-sites-table", "block-site-input", "block-append-row");
  new ConcealedElementsTable("concealed-elements-table", "conceal-site-input", "conceal-selector-input", "conceal-append-row");
});

