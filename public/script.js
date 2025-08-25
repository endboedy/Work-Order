
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "work-order.firebaseapp.com",
  projectId: "work-order",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("workOrderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const equipment = document.getElementById("equipment").value;
  const orderNumber = document.getElementById("orderNumber").value;

  try {
    await addDoc(collection(db, "workOrders"), {
      equipment,
      orderNumber,
      timestamp: new Date()
    });
    alert("Data berhasil disimpan!");
  } catch (error) {
    console.error("Gagal simpan data:", error);
    alert("Gagal simpan data.");
  }
});
