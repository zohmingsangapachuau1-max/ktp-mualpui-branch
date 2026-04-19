let members = JSON.parse(localStorage.getItem('ktpData')) || [];
let galleryData = JSON.parse(localStorage.getItem('ktpGalleryV2')) || { folders: ["General"], images: [] };
let currentFolder = "General";
let editId = null;
let currentRole = "user";
const ADMIN_PASSWORD = "123";

function toggleTheme() {
    const body = document.body;
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}

function openLogin() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeLogin() { document.getElementById('loginModal').classList.add('hidden'); document.getElementById('loginError').innerText = ""; }

function checkPassword() {
    if (document.getElementById('passwordInput').value === ADMIN_PASSWORD) {
        currentRole = "admin";
        document.getElementById('adminStatus').innerText = "Mode: Administrator (Full Access)";
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        closeLogin(); applyPermissions();
    } else { document.getElementById('loginError').innerText = "A dik lo!"; }
}

function logout() {
    currentRole = "user";
    document.getElementById('adminStatus').innerText = "Mode: Member (View Only)";
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    applyPermissions();
}

function applyPermissions() {
    document.querySelectorAll('.admin-only').forEach(el => {
        currentRole === 'admin' ? el.classList.remove('hidden') : el.classList.add('hidden');
    });
    renderMembers(); renderGallery();
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function addMember() {
    const name = document.getElementById('nameInput').value;
    const section = document.getElementById('sectionInput').value;
    if(!name) return;
    members.push({ id: Date.now(), name, section });
    localStorage.setItem('ktpData', JSON.stringify(members));
    document.getElementById('nameInput').value = "";
    renderMembers();
}

function deleteMember(id) {
    members = members.filter(m => m.id !== id);
    localStorage.setItem('ktpData', JSON.stringify(members));
    renderMembers();
}

function renderMembers() {
    const table = document.getElementById('memberListTable');
    table.innerHTML = "";
    members.forEach((m, i) => {
        let actions = currentRole === 'admin' ? `<button onclick="deleteMember(${m.id})">🗑️</button>` : "View Only";
        table.innerHTML += `<tr><td>${i+1}</td><td>${m.name}</td><td>${m.section}</td><td>${actions}</td></tr>`;
    });
}

function createFolder() {
    const name = document.getElementById('folderNameInput').value;
    if(name) { galleryData.folders.push(name); saveGallery(); renderGallery(); }
}

function uploadImage() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        galleryData.images.push({ id: Date.now(), src: e.target.result, folder: currentFolder });
        saveGallery(); renderGallery();
    };
    reader.readAsDataURL(file);
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = "";
    galleryData.images.filter(img => img.folder === currentFolder).forEach(img => {
        let del = currentRole === 'admin' ? `<button class="del-img-btn" onclick="deleteImage(${img.id})">×</button>` : "";
        grid.innerHTML += `<div class="gallery-item">${del}<img src="${img.src}"></div>`;
    });
}

function deleteImage(id) { galleryData.images = galleryData.images.filter(i => i.id !== id); saveGallery(); renderGallery(); }
function saveGallery() { localStorage.setItem('ktpGalleryV2', JSON.stringify(galleryData)); }
function showHruaitute() { alert("Leader: H.Lalrinkima\nSecretary: C.Lalnunthara"); }

window.onload = applyPermissions;
