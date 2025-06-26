class BlockedSitesTable {
  constructor(tableId, inputId, appendRowButtonId) {
    this.table = document.getElementById(tableId);
    this.input = document.getElementById(inputId);
    this.appendRowButton = document.getElementById(appendRowButtonId);
    this.getRules = chrome.declarativeNetRequest.getDynamicRules;
    this.updateRules = chrome.declarativeNetRequest.updateDynamicRules;
    this.init();
  }

  async appendRow() {
    const newEntry = this.input.value;
    this.input.value = "";
    const rules = await this.getRules();
    const newId = (Math.max(...(rules.map((rule) => rule["id"])), 0)) + 1;
    await this.updateRules({
      addRules: [{
        id: newId,
        priority: 1,
        action: { type: "redirect", redirect: { url: "https://google.com" } },
        condition: { urlFilter: `||${newEntry}`, resourceTypes: ["main_frame"] }
      }]
    });
    await this.reloadTable();
  }

  async removeRow(id) {
    await this.updateRules({ removeRuleIds: [id] });
    await this.reloadTable();
  }

  createRowHTTPTemplate(id, site) {
    var template = document.createElement('template');
    template.innerHTML = `<tr><th scope="row">${id}</th><td>${site}</td><td><button id="removeRow${id}">Remove</button></td></tr>`;
    return template.content.childNodes[0];
  }

  async reloadTable() {
    const rules = await this.getRules();
    this.table.innerHTML = "";
    const sortedRules = rules.sort((rule1, rule2) => rule1["id"] - rule2["id"]);
    sortedRules.forEach((rule) => {
      var rowNode = this.createRowHTTPTemplate(rule["id"], rule["condition"]["urlFilter"].replace("||", ""));
      this.table.appendChild(rowNode);
      document.getElementById(`removeRow${rule["id"]}`).addEventListener("click", async () => {
        await this.removeRow(rule["id"]);
      });
    });
  }

  init() {
    this.appendRowButton.addEventListener("click", async () => {
      await this.appendRow();
    });
    this.input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.appendRowButton.click();
      }
    });
    this.reloadTable();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BlockedSitesTable("to-block-site-list", "block-new-entry", "block-append-row");
});