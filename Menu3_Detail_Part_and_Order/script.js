
document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("../../data_sources/Data1.json").then(res => res.json()),
    fetch("../../data_sources/Data2.json").then(res => res.json())
  ])
  .then(([data1, data2]) => {
    const table = document.getElementById("detailTable");
    [...data1, ...data2].forEach(item => {
      const row = table.insertRow();
      Object.values(item).forEach(val => {
        const cell = row.insertCell();
        cell.textContent = val;
      });
    });
  })
  .catch(err => console.error("Error loading detail data:", err));
});

