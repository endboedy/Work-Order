
document.addEventListener("DOMContentLoaded", () => {
  fetch("../../data_sources/External_Job.json")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("externalJobTable");
      data.forEach(job => {
        const row = table.insertRow();
        Object.values(job).forEach(val => {
          const cell = row.insertCell();
          cell.textContent = val;
        });
      });
    })
    .catch(err => console.error("Error loading External_Job.json:", err));
});

