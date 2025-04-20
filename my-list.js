// Constants
const LOCAL_STORAGE_KEY = 'myMangaList';
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';

// DOM Elements
const emptyListMessage = document.getElementById('empty-list');
const mangaListTable = document.getElementById('manga-list-table');
const listTableBody = document.getElementById('list-table-body');
const statusFilter = document.getElementById('status-filter');
const sortFilter = document.getElementById('sort-filter');
const editModal = document.getElementById('edit-modal');
const closeModalBtn = document.getElementById('close-modal');
const saveChangesBtn = document.getElementById('save-changes');
const deleteMangaBtn = document.getElementById('delete-manga');
const editMangaInfo = document.getElementById('edit-manga-info');
const editStatusSelect = document.getElementById('edit-status');
const editScoreSelect = document.getElementById('edit-score');
const editProgressInput = document.getElementById('edit-progress');
const totalChaptersSpan = document.getElementById('total-chapters');
const editNotesTextarea = document.getElementById('edit-notes');

// Navigation search bar elements
const navSearchInput = document.querySelector('header .search-bar input');
const navSearchButton = document.querySelector('header .search-bar button');
const userProfileIcon = document.querySelector('.user-profile i');

// State variables
let myList = [];
let currentFilter = 'all';
let currentSort = 'title';
let currentEditingManga = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation search bar
    if (navSearchInput && navSearchButton) {
        navSearchButton.addEventListener('click', handleNavSearch);
        navSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleNavSearch();
            }
        });
    }

    // Set up user profile icon click
    if (userProfileIcon) {
        userProfileIcon.addEventListener('click', () => {
            window.location.href = 'my-list.html';
        });
    }

    // Load manga list from localStorage
    loadMyList();
    
    // Set up filter and sort changes
    statusFilter.addEventListener('change', () => {
        currentFilter = statusFilter.value;
        renderMyList();
    });
    
    sortFilter.addEventListener('change', () => {
        currentSort = sortFilter.value;
        renderMyList();
    });
    
    // Modal event listeners
    closeModalBtn.addEventListener('click', closeModal);
    saveChangesBtn.addEventListener('click', saveChanges);
    deleteMangaBtn.addEventListener('click', deleteManga);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeModal();
        }
    });
});

// Handle navigation search
function handleNavSearch() {
    const searchQuery = navSearchInput.value.trim();
    if (searchQuery) {
        // Redirect to browse page with search query
        window.location.href = `browse.html?search=${encodeURIComponent(searchQuery)}`;
    }
}

// Load manga list from localStorage
function loadMyList() {
    const savedList = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedList) {
        myList = JSON.parse(savedList);
        renderMyList();
    } else {
        // No saved list, show empty state
        myList = [];
        showEmptyState();
    }
}

// Save manga list to localStorage
function saveMyList() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(myList));
}

// Render the manga list based on current filter and sort
function renderMyList() {
    // Check if list is empty
    if (myList.length === 0) {
        showEmptyState();
        return;
    }
    
    // List is not empty, hide empty state and show table
    emptyListMessage.style.display = 'none';
    mangaListTable.style.display = 'block';
    
    // Clear the list
    listTableBody.innerHTML = '';
    
    // Filter the list
    let filteredList = myList;
    if (currentFilter !== 'all') {
        filteredList = myList.filter(manga => manga.status === currentFilter);
    }
    
    // If filtered list is empty, show a message
    if (filteredList.length === 0) {
        const emptyFilterMessage = document.createElement('div');
        emptyFilterMessage.className = 'empty-filter-message';
        emptyFilterMessage.innerHTML = `
            <p>No manga found with the selected filter. Try changing your filter or add more manga to your list.</p>
        `;
        listTableBody.appendChild(emptyFilterMessage);
        return;
    }
    
    // Sort the list
    filteredList.sort((a, b) => {
        switch (currentSort) {
            case 'title':
                return a.title.localeCompare(b.title);
            case 'score':
                return (b.score || 0) - (a.score || 0);
            case 'progress':
                return (b.progress || 0) - (a.progress || 0);
            case 'date-added':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            default:
                return 0;
        }
    });
    
    // Render each manga item
    filteredList.forEach((manga, index) => {
        const item = createMangaListItem(manga, index + 1);
        listTableBody.appendChild(item);
    });
}

// Create a manga list item element
function createMangaListItem(manga, index) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.setAttribute('data-id', manga.id);
    
    // Format status for display
    const statusMap = {
        'reading': { class: 'status-reading', text: 'Reading' },
        'completed': { class: 'status-completed', text: 'Completed' },
        'on-hold': { class: 'status-on-hold', text: 'On Hold' },
        'dropped': { class: 'status-dropped', text: 'Dropped' },
        'plan-to-read': { class: 'status-plan-to-read', text: 'Plan to Read' }
    };
    
    const statusInfo = statusMap[manga.status] || { class: '', text: manga.status };
    
    // Progress display
    const progressText = manga.totalChapters 
        ? `${manga.progress || 0} / ${manga.totalChapters} chapters`
        : `${manga.progress || 0} chapters`;
    
    item.innerHTML = `
        <div class="list-cell cell-cover">
            <div class="manga-cover-small">
                <img src="${manga.imageUrl}" alt="${manga.title}" loading="lazy">
            </div>
        </div>
        <div class="list-cell cell-title">
            <div class="manga-title-main">${manga.title}</div>
            <div class="manga-title-details">${manga.type} · ${manga.year || 'Unknown'}</div>
        </div>
        <div class="list-cell cell-score" data-label="Score:">
            <div class="score-value">${manga.score ? manga.score : '-'}</div>
        </div>
        <div class="list-cell cell-progress" data-label="Progress:">
            ${progressText}
        </div>
        <div class="list-cell cell-status" data-label="Status:">
            <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
        </div>
        <div class="list-cell cell-actions">
            <div class="action-icon edit-action" title="Edit">
                <i class="fas fa-edit"></i>
            </div>
            <div class="action-icon view-action" title="View Details">
                <i class="fas fa-eye"></i>
            </div>
        </div>
    `;
    
    // Add event listeners to action buttons
    const editAction = item.querySelector('.edit-action');
    const viewAction = item.querySelector('.view-action');
    
    editAction.addEventListener('click', () => openEditModal(manga));
    viewAction.addEventListener('click', () => window.location.href = `manga-detail.html?id=${manga.id}`);
    
    return item;
}

// Show empty state
function showEmptyState() {
    emptyListMessage.style.display = 'block';
    mangaListTable.style.display = 'none';
}

// Open the edit modal for a manga
function openEditModal(manga) {
    currentEditingManga = manga;
    
    // Populate manga info
    editMangaInfo.innerHTML = `
        <div class="edit-manga-cover">
            <img src="${manga.imageUrl}" alt="${manga.title}">
        </div>
        <div class="edit-manga-details">
            <div class="edit-manga-title">${manga.title}</div>
            <div class="edit-manga-subtitle">${manga.type} · ${manga.year || 'Unknown'}</div>
        </div>
    `;
    
    // Set form values
    editStatusSelect.value = manga.status || 'plan-to-read';
    editScoreSelect.value = manga.score || '0';
    editProgressInput.value = manga.progress || 0;
    totalChaptersSpan.textContent = manga.totalChapters || '?';
    editNotesTextarea.value = manga.notes || '';
    
    // Show the modal
    editModal.style.display = 'flex';
}

// Close the edit modal
function closeModal() {
    editModal.style.display = 'none';
    currentEditingManga = null;
}

// Save changes from the edit modal
function saveChanges() {
    if (!currentEditingManga) return;
    
    // Find manga in the list
    const index = myList.findIndex(m => m.id === currentEditingManga.id);
    if (index === -1) return;
    
    // Update manga data
    myList[index].status = editStatusSelect.value;
    myList[index].score = parseInt(editScoreSelect.value) || 0;
    myList[index].progress = parseInt(editProgressInput.value) || 0;
    myList[index].notes = editNotesTextarea.value;
    
    // Save and render the updated list
    saveMyList();
    renderMyList();
    
    // Close the modal
    closeModal();
}

// Delete manga from the list
function deleteManga() {
    if (!currentEditingManga) return;
    
    // Confirm deletion
    if (confirm(`Are you sure you want to remove "${currentEditingManga.title}" from your list?`)) {
        // Find and remove the manga
        myList = myList.filter(manga => manga.id !== currentEditingManga.id);
        
        // Save and render the updated list
        saveMyList();
        renderMyList();
        
        // Close the modal
        closeModal();
    }
}