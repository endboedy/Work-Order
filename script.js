
async function uploadToGitHub(file) {
  const token = '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'; // Replace with your GitHub token
  const repo = 'endboedy/Work-Order'; // Replace with your GitHub repo name
  const path = `data/${file.name}`;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  try {
    const reader = new FileReader();
    reader.onload = async function () {
      const base64Content = btoa(reader.result);
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64Content
        })
      });

      const result = await response.json();
      const statusElement = document.getElementById('uploadStatus');
      if (response.ok) {
        statusElement.innerHTML += `<div>✅ ${file.name} uploaded successfully.</div>`;
      } else {
        statusElement.innerHTML += `<div>❌ ${file.name} failed to upload: ${result.message}</div>`;
      }
    };
    reader.readAsBinaryString(file);
  } catch (error) {
    const statusElement = document.getElementById('uploadStatus');
    statusElement.innerHTML += `<div>❌ ${file.name} failed to upload: ${error.message}</div>`;
  }
}

document.getElementById('uploadButton').addEventListener('click', function () {
  const files = document.getElementById('fileInput').files;
  document.getElementById('uploadStatus').innerHTML = '';
  for (let i = 0; i < files.length; i++) {
    uploadToGitHub(files[i]);
  }
});
