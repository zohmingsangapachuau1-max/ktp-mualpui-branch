// Data structures
let members = JSON.parse(localStorage.getItem('ktpData')) || [];
let galleryData = JSON.parse(localStorage.getItem('ktpGalleryV2')) || { folders: ["General"], images: [] };
let currentFolder = "General";

// Theme Logic
function toggleTheme() {
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

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'member-page') renderMembers();
    if(id === 'gallery-page') { renderFolders(); renderGallery(); }
}

// --- MEMBER LOGIC ---
function addMember() {
    const name = document.getElementById('nameInput').value;
    const section = document.getElementById('sectionInput').value;
    if(!name) return alert("Hming ziak rawh!");
    members.push({ id: Date.now(), name, section });
    localStorage.setItem('ktpData', JSON.stringify(members));
    document.getElementById('nameInput').value = "";
    renderMembers();
}
function deleteMember(id) {
    if(confirm("Delete i duh tak tak em?")) {
        members = members.filter(m => m.id !== id);
        localStorage.setItem('ktpData', JSON.stringify(members));
        renderMembers();
    }
}
function renderMembers() {
    const listTable = document.getElementById('memberListTable');
    listTable.innerHTML = "";
    members.forEach((m, index) => {
        listTable.innerHTML += `
            <tr>
                <td>${index+1}</td>
                <td>${m.name}</td>
                <td>${m.section}</td>
                <td>
                    <button class="edit-btn" onclick="editMember(${m.id})" style="color: #ffc107; background:none; border:none; cursor:pointer; font-size:18px; margin-right:10px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteMember(${m.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
    document.getElementById('progressBar').style.width = Math.min((members.length / 100) * 100, 100) + "%";
    document.getElementById('memberCount').innerText = members.length;
}

// --- GALLERY LOGIC ---
function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if(!name || galleryData.folders.includes(name)) return;
    galleryData.folders.push(name);
    saveGallery();
    document.getElementById('folderNameInput').value = "";
    renderFolders();
}
function renderFolders() {
    const tabs = document.getElementById('folderTabs');
    const select = document.getElementById('uploadFolderSelect');
    tabs.innerHTML = ""; select.innerHTML = "";
    galleryData.folders.forEach(f => {
        tabs.innerHTML += `<div class="folder-tab ${f === currentFolder ? 'active' : ''}" onclick="selectFolder('${f}')">${f}</div>`;
        select.innerHTML += `<option value="${f}">${f}</option>`;
    });
}
function selectFolder(name) { currentFolder = name; renderFolders(); renderGallery(); }
function uploadImage() {
    const file = document.getElementById('imageInput').files[0];
    const folder = document.getElementById('uploadFolderSelect').value;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        galleryData.images.push({ id: Date.now(), src: e.target.result, folder: folder });
        saveGallery(); renderGallery();
    };
    reader.readAsDataURL(file);
}
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = "";
    galleryData.images.filter(img => img.folder === currentFolder).forEach(img => {
        grid.innerHTML += `<div class="gallery-item">
            <button class="del-img-btn" onclick="event.stopPropagation(); deleteImage(${img.id})">×</button>
            <img src="${img.src}" onclick="openLightbox('${img.src}')">
        </div>`;
    });
}
function deleteImage(id) { galleryData.images = galleryData.images.filter(img => img.id !== id); saveGallery(); renderGallery(); }
function openLightbox(src) { document.getElementById('lightboxImg').src = src; document.getElementById('lightbox').style.display = 'flex'; }
function saveGallery() { localStorage.setItem('ktpGalleryV2', JSON.stringify(galleryData)); }
function showHruaitute() { alert("Leader: H.Lalrinkima\nAsst. Leader: T.Upa RK Rosiamkima\nSecretary: C.Lalnunthara\nAsst.Secretary: B.Lalrinngheta\nTreasurer: T.Upa VL.Hmangaiha\nFin.Secretary: Lalzahawma"); }

// Initial Render
renderMembers();

// Hming edit-na tur function
function editMember(id) {
    // 1. Array atangin kan hming duh lai kha kan zawng chhuak ang
    const memberToEdit = members.find(m => m.id === id);
    
    // 2. Prompt box hmangin hming thar kan zawt ang
    const newName = prompt("Hming thar ziak rawh:", memberToEdit.name);
    
    // 3. User-in hming a thlak chuan kan update ang
    if (newName !== null && newName.trim() !== "") {
        memberToEdit.name = newName.trim(); // Hming kan thlak
        localStorage.setItem('ktpData', JSON.stringify(members)); // Save lehna
        renderMembers(); // Table rawn update-na
    }
}
