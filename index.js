// Constants
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';
const MANGA_PER_PAGE = 24;

// DOM Elements
const mangaGrid = document.getElementById('manga-grid');
const loadingIndicator = document.getElementById('loading');
const loadMoreButton = document.getElementById('load-more');
const filterType = document.getElementById('filter-type');

// Navigation search bar elements
const navSearchInput = document.querySelector('header .search-bar input');
const navSearchButton = document.querySelector('header .search-bar button');

// State management
let currentPage = 1;
let currentFilter = 'bypopularity';
let isLoading = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation search bar functionality
    if (navSearchInput && navSearchButton) {
        navSearchButton.addEventListener('click', handleNavSearch);
        navSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleNavSearch();
            }
        });
    }
    
    fetchTopManga();
    
    loadMoreButton.addEventListener('click', () => {
        currentPage++;
        fetchTopManga(false);
    });
    
    filterType.addEventListener('change', () => {
        currentFilter = filterType.value;
        resetMangaGrid();
        fetchTopManga();
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

// Reset grid when changing filters
function resetMangaGrid() {
    mangaGrid.innerHTML = '';
    currentPage = 1;
}

// Main function to fetch manga data
async function fetchTopManga(showLoading = true) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (showLoading) {
        loadingIndicator.style.display = 'flex';
        mangaGrid.style.display = 'none';
    }
    
    loadMoreButton.disabled = true;
    
    try {
        // Build the API URL based on the selected filter
        let apiUrl = `${JIKAN_API_BASE}/top/manga?page=${currentPage}&limit=${MANGA_PER_PAGE}`;
        
        // Only add the filter parameter for 'bypopularity' as it's a valid parameter
        // For 'score' (which we've renamed from 'rank'), we don't send a filter parameter
        // This will use the default API sorting which is by score
        if (currentFilter === 'bypopularity') {
            apiUrl += `&filter=${currentFilter}`;
        }
        
        const response = await fetch(apiUrl);
        
        // Handle rate limiting (Jikan has a rate limit)
        if (response.status === 429) {
            console.log('Rate limited, retrying in 1 second...');
            setTimeout(() => fetchTopManga(showLoading), 1000);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (showLoading) {
            mangaGrid.innerHTML = '';
        }
        
        renderMangaCards(data.data);
        
        // Handle pagination
        if (data.pagination.has_next_page) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching manga:', error);
        displayError('Failed to load manga. Please try again later.');
    } finally {
        if (showLoading) {
            loadingIndicator.style.display = 'none';
            mangaGrid.style.display = 'grid';
        }
        
        loadMoreButton.disabled = false;
        isLoading = false;
    }
}

// Create and append manga cards to the grid
function renderMangaCards(mangaList) {
    mangaList.forEach(manga => {
        const card = createMangaCard(manga);
        mangaGrid.appendChild(card);
    });
}

// Create a single manga card element
function createMangaCard(manga) {
    const card = document.createElement('div');
    card.className = 'manga-card';
    
    // Format manga data
    const title = manga.title || 'Unknown Title';
    const imageUrl = manga.images.jpg.image_url || '';
    const score = manga.score || 'N/A';
    const type = manga.type || 'Unknown';
    const volumes = manga.volumes ? `${manga.volumes} vols` : 'Unknown volumes';
    
    card.innerHTML = `
        <div class="manga-cover">
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <div class="manga-rating">
                <i class="fas fa-star"></i> ${score}
            </div>
        </div>
        <div class="manga-info">
            <div class="manga-title" title="${title}">${title}</div>
            <div class="manga-details">
                <span>${type}</span>
                <span>${volumes}</span>
            </div>
        </div>
    `;
    
    // Add click event to navigate to the manga detail page
    card.addEventListener('click', () => {
        window.location.href = `manga-detail.html?id=${manga.mal_id}`;
    });
    
    return card;
}

// Display error message
function displayError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    mangaGrid.innerHTML = '';
    mangaGrid.appendChild(errorElement);
    mangaGrid.style.display = 'block';
}