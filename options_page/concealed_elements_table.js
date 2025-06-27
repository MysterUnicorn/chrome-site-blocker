function getFromStorage(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}
function setToStorage(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export class ConcealedElementsTable {
  constructor(tableId, siteInputId, selectorInputId, appendRowButtonId) {
    this.table = document.getElementById(tableId);
    this.siteInput = document.getElementById(siteInputId);
    this.selectorInput = document.getElementById(selectorInputId);
    this.appendRowButton = document.getElementById(appendRowButtonId);
    this.getRules = async () => {return (await getFromStorage("concealedElements")) || {}};
    this.updateRules = async (rules) => {
      return await setToStorage("concealedElements", rules);
    };
    this.init();
  }

  async appendRow() {
    const site = this.siteInput.value;
    const selector = this.selectorInput.value;
    this.siteInput.value = "";
    this.selectorInput.value = "";
    
    const rules = await this.getRules();
    const newId = (Math.max(...Object.keys(rules).map(Number), 0)) + 1;
    
    rules[newId] = { site, selector };
    await this.updateRules(rules);
    await this.reloadTable();
  }

  async removeRow(id) {
    const rules = await this.getRules();
    delete rules[id];
    await this.updateRules(rules);
    await this.reloadTable();
  }

  createRowTemplate(id, site, selector) {
    var template = document.createElement('template');
    template.innerHTML = `<tr><th scope="row">${id}</th><td>${site}</td><td>${selector}</td><td><button id="removeRowConcealedElement${id}">Remove</button></td></tr>`;
    return template.content.childNodes[0];
  }

  async reloadTable() {
    const rules = await this.getRules();
    this.table.innerHTML = "";
    const sortedKeys = Object.keys(rules).sort((a, b) => a - b);
    
    sortedKeys.forEach((key) => {
      const rule = rules[key];
      var rowNode = this.createRowTemplate(key, rule.site, rule.selector);
      this.table.appendChild(rowNode);
      document.getElementById(`removeRowConcealedElement${key}`).addEventListener("click", async () => {
        await this.removeRow(key);
      });
    });
  }

  init() {
    this.appendRowButton.addEventListener("click", async () => {
      await this.appendRow();
    });
    this.siteInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.selectorInput.focus();
      }
    });
    this.selectorInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.appendRowButton.click();
      }
    });
    this.reloadTable();
  }
}

