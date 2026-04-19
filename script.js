let members = JSON.parse(localStorage.getItem('ktpData')) || [];
let galleryData = JSON.parse(localStorage.getItem('ktpGalleryV2')) || { folders: ["General"], images: [] };
let currentFolder = "General";
let editId = null;
let currentRole = "user"; // A tirah user mode-ah a awm ang

function toggleRole() {
    currentRole = document.getElementById('roleSelector').value;
    applyPermissions();
}

function applyPermissions() {
    // Admin elements (add inputs, etc.) thupna leh lanchhuahtirna
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (currentRole === 'admin') {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
    // Table-a Edit/Delete button-te update nan
    renderMembers();
    renderGallery();
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    applyPermissions();
}

function renderMembers() {
    const listTable = document.getElementById('memberListTable');
    listTable.innerHTML = "";
    members.forEach((m, index) => {
        let actionCell = (currentRole === 'admin') ? 
            `<button class="delete-btn" onclick="editMember(${m.id})"><i class="fas fa-edit"></i></button>
             <button class="delete-btn" onclick="deleteMember(${m.id})"><i class="fas fa-trash"></i></button>` : 
            `<span style="color:gray; font-size:12px;">View Only</span>`;

        listTable.innerHTML += `<tr>
            <td>${index+1}</td>
            <td>${m.name}</td>
            <td>${m.section}</td>
            <td>${actionCell}</td>
        </tr>`;
    });
}

// Gallery render nan
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if(!grid) return;
    grid.innerHTML = "";
    galleryData.images.filter(img => img.folder === currentFolder).forEach(img => {
        let delBtn = (currentRole === 'admin') ? `<button class="del-img-btn" onclick="deleteImage(${img.id})">×</button>` : "";
        grid.innerHTML += `<div class="gallery-item">${delBtn}<img src="${img.src}"></div>`;
    });
}

// A dang (addMember, deleteMember, etc.) kha chu a hma ami kha hmet zawm tawp rawh..
// ... (code dangte kha va dah belh leh mai rawh)

window.onload = applyPermissions;
