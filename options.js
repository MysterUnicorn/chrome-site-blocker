const getRules = chrome.declarativeNetRequest.getDynamicRules;
const updateRules = chrome.declarativeNetRequest.updateDynamicRules;


async function addNewRow() {
  const newEntry = document.getElementById("new-entry").value
  document.getElementById("new-entry").value = ""
  rules = await getRules()
  newId = (Math.max( ...(rules.map((rule) => {return rule["id"]})), 0 ))+ 1
  console.log(newId)
  console.log(typeof(newId))
  await updateRules({addRules: [{
    "id": newId,
    "priority": 1,
    "action": { "type": "redirect", "redirect": { "url": "https://google.com" } },
    "condition": { "urlFilter": `||${newEntry}`, "resourceTypes": ["main_frame"] }
  }]})
  await fillTable();
}

async function removeRow(id) {
  updateRules({removeRuleIds: [id]})
  fillTable()
}

function templateRow(id, site) {
  var template = document.createElement('template');
  console.log("a")
  template.innerHTML = `<tr><th scope="row">${id}</th><td>${site}</td><td><button id="removeRow${id}">Remove</button></td></tr>`;
  return template.content.childNodes[0]
}

async function fillTable() {
  const table = document.getElementById("to-block-site-list");
  
  const rules = await getRules()
  table.innerHTML = ""
  const sortedRules = rules.sort((rule1, rule2) => {return rule1["id"]-rule2["id"]})
  sortedRules.forEach(
    (rule) => {
      var rowNode = templateRow(rule["id"], rule["condition"]["urlFilter"].replace("||", ""))
      table.appendChild(rowNode);
      document.getElementById(`removeRow${rule["id"]}`).addEventListener("click", async () =>{
        await removeRow(rule["id"])
      })
    })
}

document.addEventListener("DOMContentLoaded", () => {
    const addButton = document.getElementById("addNewRow");
    addButton.addEventListener("click", async () => {
        await addNewRow();
    });
  });

document.getElementById("new-entry").addEventListener('keypress', function(event) {
    const addButton = document.getElementById("addNewRow");
    if (event.key === 'Enter') {
        addButton.click(); // This triggers the button
    }
});

fillTable()