
document.addEventListener("DOMContentLoaded", () => {
  fetch("../../data_sources/IW39.json")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("dataTable");
      data.forEach(item => {
        const row = table.insertRow();
        Object.values(item).forEach(val => {
          const cell = row.insertCell();
          cell.textContent = val;
        });
      });
    })
    .catch(err => console.error("Error loading IW39.json:", err));
});

