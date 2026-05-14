// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCjdGn_NPL2Lf624WgXZT5-1269Gk5JXXo",
    authDomain: "ktp-website-6d9a4.firebaseapp.com",
    projectId: "ktp-website-6d9a4",
    storageBucket: "ktp-website-6d9a4.firebasestorage.app",
    messagingSenderId: "105360862232",
    appId: "1:105360862232:web:4630f68fe7fb8e2d70a76d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let members = [];
let galleryImages = [];
let currentCategory = 'All'; // Filter tana hman tur

// --- GLOBAL FUNCTIONS (WINDOW OBJECT) ---

window.showSection = function(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
}

window.toggleTheme = function() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        body.setAttribute('data-theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

window.showHruaitute = function() {
    alert("2026 HRUAITUTE:\n\nLeader: H.Lalrinkima\nSecretary: C.Lalnunthara\nTreasurer: T.Upa VL.Hmangaiha");
}

// --- ADMIN ACTIONS ---

window.login = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if(!email || !password) return alert("Email leh Password chhu lut rawh!");
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Admin-ah i lut ta!");
        window.showSection('home');
    } catch (error) {
        alert("Login error: " + error.message);
    }
}

window.logout = async function() {
    await signOut(auth);
    alert("I chhuak ta!");
    location.reload();
}

window.addMember = async function() {
    const name = document.getElementById('nameInput').value.trim();
    const section = document.getElementById('sectionInput').value;
    if(!name) return alert("Hming ziak rawh!");
    try {
        await addDoc(collection(db, "members"), { name, section, createdAt: Date.now() });
        document.getElementById('nameInput').value = "";
    } catch (e) { alert("Admin login a ngai a ni."); }
}

// --- EDIT MEMBER (THAR) ---
window.editMember = async function(id, oldName) {
    const newName = prompt("Hming thar tur ziak rawh:", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        try {
            await updateDoc(doc(db, "members", id), { name: newName.trim() });
        } catch (e) { alert("Update failed."); }
    }
}

window.deleteMember = async function(id) {
    if(confirm("I delete duh tak tak em?")) {
        try { await deleteDoc(doc(db, "members", id)); } 
        catch (e) { alert("Permission denied."); }
    }
}

// --- GALLERY CATEGORY FILTER (THAR) ---
window.setCategory = function(cat) {
    currentCategory = cat;
    renderGallery();
}

// --- GALLERY UPLOAD (FOLDER HMING TELIN) ---

window.uploadImage = async function() {
    const fileInput = document.getElementById('imageInput');
    const customCatInput = document.getElementById('customCategoryInput');
    const file = fileInput.files[0];
    const category = customCatInput.value.trim() || "General"; // Folder hming i type kha
    const status = document.getElementById('uploadStatus');
    
    if(!file) return alert("Thlalak thlang hmasa rawh!");

    status.innerText = "Uploading to '" + category + "'... Lo nghak lawk rawh.";
    try {
        const storageRef = ref(storage, `gallery/${category}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        await addDoc(collection(db, "gallery"), { url, category, createdAt: Date.now() });
        status.innerText = "Upload Hlawhtling!";
        fileInput.value = "";
        customCatInput.value = "";
    } catch (e) {
        alert("Upload failed: " + e.message);
        status.innerText = "";
    }
}

// --- RENDERING ---

function renderMembers() {
    const listTable = document.getElementById('memberListTable');
    if (!listTable) return;
    listTable.innerHTML = "";
    members.forEach((m, index) => {
        listTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${m.name}</td>
                <td>${m.section}</td>
                <td>
                    <button class="admin-only" onclick="editMember('${m.id}', '${m.name}')" style="color:orange; background:none; border:none; cursor:pointer; display:${auth.currentUser ? 'inline-block' : 'none'}; margin-right: 10px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-only" onclick="deleteMember('${m.id}')" style="color:red; background:none; border:none; cursor:pointer; display:${auth.currentUser ? 'inline-block' : 'none'};">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
    document.getElementById('memberCount').innerText = members.length;
    document.getElementById('progressBar').style.width = Math.min((members.length / 100) * 100, 100) + "%";
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const filterContainer = document.getElementById('folderFilters');
    if(!grid || !filterContainer) return;

    // 1. Folder Buttons siam (Mahni duh duh Category-a lo awm turin)
    const allCategories = ['All', ...new Set(galleryImages.map(img => img.category || 'General'))];
    filterContainer.innerHTML = allCategories.map(cat => `
        <button class="btn" onclick="setCategory('${cat}')" style="font-size: 12px; padding: 5px 12px; ${currentCategory === cat ? 'background: #007bff; color: white;' : ''}">
            ${cat}
        </button>
    `).join('');

    // 2. Thlalak Filtered display
    grid.innerHTML = "";
    const filtered = currentCategory === 'All' ? galleryImages : galleryImages.filter(img => (img.category || 'General') === currentCategory);

    filtered.forEach(img => {
        grid.innerHTML += `
            <div class="gallery-card" style="margin-bottom: 20px; text-align: center; border: 1px solid #eee; padding: 10px; border-radius: 10px;">
                <p style="font-size: 10px; color: gray; margin: 0 0 5px 0;">Folder: ${img.category || 'General'}</p>
                <img src="${img.url}" alt="KTP Pic" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <br>
                <a href="${img.url}" target="_blank" download class="btn" style="display: inline-block; margin-top: 10px; padding: 5px 15px; font-size: 13px; text-decoration: none;">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>`;
    });
}

function updateAdminUI(user) {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = user ? 'block' : 'none';
        if(el.tagName === 'BUTTON') el.style.display = user ? 'inline-block' : 'none';
    });
    renderMembers(); // Re-render to show/hide edit/delete icons
}

// --- FIREBASE LISTENERS ---

onSnapshot(collection(db, "members"), (snapshot) => {
    members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMembers();
});

onSnapshot(collection(db, "gallery"), (snapshot) => {
    galleryImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderGallery();
});

onAuthStateChanged(auth, updateAdminUI);
