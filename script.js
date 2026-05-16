// 1. Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
let hruaituteList = []; // Hruaitute data khawmna tur array thar
let currentCategory = 'All'; // Gallery filter
let currentGroupFilter = 'All'; // Member Group filter

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
    const group = document.getElementById('groupInput').value;
    
    if(!name) return alert("Hming ziak rawh!");
    try {
        await addDoc(collection(db, "members"), { name, section, group, createdAt: Date.now() });
        document.getElementById('nameInput').value = "";
    } catch (e) { alert("Admin login a ngai a ni."); }
}

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

window.setGroupFilter = function(groupName) {
    currentGroupFilter = groupName;
    const buttons = document.querySelectorAll('#groupFilters .btn');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(`'${groupName}'`)) {
            btn.style.background = "#007bff";
            btn.style.color = "white";
        } else {
            btn.style.background = "";
            btn.style.color = "";
        }
    });
    renderMembers();
}

window.setCategory = function(cat) {
    currentCategory = cat;
    renderGallery();
}

// --- GALLERY UPLOAD (SUPER FAST WITH PROGRESS TRACKER) ---
window.uploadImage = async function() {
    const fileInput = document.getElementById('imageInput');
    const customCatInput = document.getElementById('customCategoryInput');
    const file = fileInput.files[0];
    const category = customCatInput.value.trim() || "General";
    const status = document.getElementById('uploadStatus');
    
    if(!file) return alert("Thlalak thlang hmasa rawh!");

    try {
        status.innerText = "Thlalak kan tite (compress) mek e...";
        // GALLERY OPTIMIZATION: Max 600px leh 60% quality ah hian visual quality a hloi chuang lo, mahse a zang phut thung
        const compressedBlob = await compressImage(file, 600, 600, 0.6);
        
        status.innerText = "Firebase-ah kan thawn tan mek e...";
        const storageRef = ref(storage, `gallery/${category}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                status.innerText = `Uploading: ${Math.round(progress)}% lo nghak lawk rawh...`;
            }, 
            (error) => {
                alert("Upload failed: " + error.message);
                status.innerText = "";
            }, 
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, "gallery"), { url, category, createdAt: Date.now() });
                status.innerText = "Upload Hlawhtling Tlat!";
                fileInput.value = "";
                customCatInput.value = "";
            }
        );
    } catch (e) {
        alert("Error: " + e.message);
        status.innerText = "";
    }
}

// --- DYNAMIC HRUAITU UPLOAD / UPDATE FUNCTION (SUPER FAST WITH PROGRESS TRACKER) ---
window.saveHruaitu = async function() {
    const name = document.getElementById('hruaituName').value.trim();
    const role = document.getElementById('hruaituRole').value;
    const fileInput = document.getElementById('hruaituImage');
    const status = document.getElementById('hruaituStatus');
    const file = fileInput.files[0];

    if(!name) return alert("Hruaitu hming chhu lut rawh!");

    try {
        let imageUrl = "";
        if(file) {
            status.innerText = "Thlalak kan tite mek...";
            // HRUAITUTE PROFILE: Avatar circular anih dawn avangin 350px width hi a chi tawk viau
            const compressedBlob = await compressImage(file, 350, 350, 0.6);

            status.innerText = "Firebase-ah kan dah mek...";
            const storageRef = ref(storage, `hruaitute/${role}_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        status.innerText = `Uploading: ${Math.round(progress)}%...`;
                    },
                    (err) => reject(err),
                    async () => {
                        imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve();
                    }
                );
            });
        } else {
            const existing = hruaituteList.find(h => h.role === role);
            imageUrl = existing ? existing.imageUrl : "https://via.placeholder.com/150";
        }

        // Role zawn apiang dawt zela a in-overwrite tawh nan setDoc hman a ni
        await setDoc(doc(db, "hruaitute", role), {
            name: name,
            role: role,
            imageUrl: imageUrl,
            updatedAt: Date.now()
        });

        status.innerText = role + " data thlak hlawhtling a ni ta!";
        document.getElementById('hruaituName').value = "";
        fileInput.value = "";
    } catch (e) {
        alert("Error: " + e.message);
        status.innerText = "";
    }
}

// --- BRANCH COMMITTEE ACTIONS (MODIFIED TO USE MEMBERS COLLECTION) ---
window.addCommittee = async function() {
    const name = document.getElementById('comNameInput').value.trim();
    const group = document.getElementById('comGroupInput').value;
    
    if(!name) return alert("Committee member hming ziak rawh!");
    try {
        // Heta 'members' collection chhungah hian isCommittee: true thlin a va save tawh dawn a ni
        await addDoc(collection(db, "members"), { 
            name, 
            group, 
            section: "Branch Committee", 
            isCommittee: true, 
            createdAt: Date.now() 
        });
        document.getElementById('comNameInput').value = "";
    } catch (e) { alert("Admin login a ngai a ni."); }
}

window.editCommittee = async function(id, oldName) {
    const newName = prompt("Hming thar tur ziak rawh:", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        try {
            await updateDoc(doc(db, "members", id), { name: newName.trim() });
        } catch (e) { alert("Update failed."); }
    }
}

window.deleteCommittee = async function(id) {
    if(confirm("I delete duh tak tak em?")) {
        try { await deleteDoc(doc(db, "members", id)); } 
        catch (e) { alert("Permission denied."); }
    }
}

// --- RENDERING ---

function renderMembers() {
    const listTable = document.getElementById('memberListTable');
    if (!listTable) return;
    listTable.innerHTML = "";
    
    // Committee ho lo lang lo turin kan thiar chhuak hmasa phawt ang
    const normalMembers = members.filter(m => m.isCommittee !== true);
    
    const filteredMembers = currentGroupFilter === 'All' 
        ? normalMembers 
        : normalMembers.filter(m => m.group === currentGroupFilter);

    filteredMembers.forEach((m, index) => {
        listTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${m.name}</td>
                <td>${m.section}</td>
                <td>${m.group || 'Group Neilo'}</td>
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
    
    document.getElementById('memberCount').innerText = filteredMembers.length;
    document.getElementById('progressBar').style.width = Math.min((filteredMembers.length / 1000) * 100, 100) + "%";
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    const filterContainer = document.getElementById('folderFilters');
    if(!grid || !filterContainer) return;

    const allCategories = ['All', ...new Set(galleryImages.map(img => img.category || 'General'))];
    filterContainer.innerHTML = allCategories.map(cat => `
        <button class="btn" onclick="setCategory('${cat}')" style="font-size: 12px; padding: 5px 12px; ${currentCategory === cat ? 'background: #007bff; color: white;' : ''}">
            ${cat}
        </button>
    `).join('');

    grid.innerHTML = "";
    const filtered = currentCategory === 'All' ? galleryImages : galleryImages.filter(img => (img.category || 'General') === currentCategory);

    filtered.forEach(img => {
        grid.innerHTML += `
            <div class="gallery-card" style="margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color); padding: 10px; border-radius: 10px; background: var(--card-bg);">
                <p style="font-size: 10px; color: gray; margin: 0 0 5px 0;">Folder: ${img.category || 'General'}</p>
                <img src="${img.url}" alt="KTP Pic" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <br>
                <a href="${img.url}" target="_blank" download class="btn" style="display: inline-block; margin-top: 10px; padding: 5px 15px; font-size: 13px; text-decoration: none;">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>`;
    });
}

// --- RENDERING HRUAITUTE DYNAMIC CARDS (THAR) ---
function renderHruaitute() {
    const grid = document.getElementById('hruaituteGrid');
    if(!grid) return;
    grid.innerHTML = "";

    const roleOrder = ["Leader", "Asst. Leader", "Secretary", "Asst. Secretary", "Treasurer", "Fin. Secretary"];
    
    roleOrder.forEach(role => {
        const hruaitu = hruaituteList.find(h => h.role === role);
        if(hruaitu) {
            grid.innerHTML += `
                <div class="hruaitu-card" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <img src="${hruaitu.imageUrl}" alt="${hruaitu.name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 3px solid #1e73be;">
                    <h3 style="margin: 5px 0; font-size: 18px; color: var(--text-color);">${hruaitu.name}</h3>
                    <p style="color: #1e73be; font-weight: bold; font-size: 14px; margin: 5px 0;">${hruaitu.role}</p>
                </div>`;
        }
    });
}

// --- RENDERING COMMITTEE MEMBERS LIST (MODIFIED TO FILTER FROM MEMBERS) ---
function renderCommittee() {
    const listTable = document.getElementById('committeeListTable');
    if (!listTable) return;
    listTable.innerHTML = "";

    // Members array atang khan isCommittee == true ho chiah kan thlang chhuak ang
    const committeeList = members.filter(m => m.isCommittee === true);

    committeeList.forEach((c, index) => {
        listTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${c.name}</td>
                <td>${c.group || 'Group Neilo'}</td>
                <td>
                    <button class="admin-only" onclick="editCommittee('${c.id}', '${c.name}')" style="color:orange; background:none; border:none; cursor:pointer; display:${auth.currentUser ? 'inline-block' : 'none'}; margin-right: 10px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-only" onclick="deleteCommittee('${c.id}')" style="color:red; background:none; border:none; cursor:pointer; display:${auth.currentUser ? 'inline-block' : 'none'};">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

function updateAdminUI(user) {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if(el.tagName === 'TH' || el.tagName === 'TD') {
            el.style.display = user ? 'table-cell' : 'none';
        } else if(el.tagName === 'BUTTON') {
            el.style.display = user ? 'inline-block' : 'none';
        } else {
            el.style.display = user ? 'block' : 'none';
        }
    });
    renderMembers(); 
    renderCommittee(); 
}

// --- NEW FLEXIBLE IMAGE COMPRESSION FUNCTION ---
function compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality); 
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

// --- FIREBASE LISTENERS ---

// Hemi snapshot pakhat hian normal members leh committee members a rawn update dun vek tawh dawn a ni
onSnapshot(collection(db, "members"), (snapshot) => {
    members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMembers();
    renderCommittee();
});

onSnapshot(collection(db, "gallery"), (snapshot) => {
    galleryImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderGallery();
});

onSnapshot(collection(db, "hruaitute"), (snapshot) => {
    hruaituteList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderHruaitute();
});

onAuthStateChanged(auth, updateAdminUI);
