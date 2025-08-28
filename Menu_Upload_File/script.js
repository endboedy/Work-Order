
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const previewArea = document.getElementById("preview");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          previewArea.textContent = JSON.stringify(jsonData, null, 2);
        } catch (err) {
          previewArea.textContent = "Invalid JSON file.";
        }
      };
      reader.readAsText(file);
    } else {
      previewArea.textContent = "Please upload a valid JSON file.";
    }
  });
});

