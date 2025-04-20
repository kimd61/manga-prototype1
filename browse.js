// Constants
const JIKAN_API_BASE = 'https://api.jikan.moe/v4';
const MANGA_PER_PAGE = 24;

// DOM Elements for browse page
const browseMangaGrid = document.getElementById('browse-manga-grid');
const browseLoadingIndicator = document.getElementById('loading');
const loadMoreBrowseButton = document.getElementById('load-more-browse');
const countDisplay = document.getElementById('count-number');
const searchInput = document.getElementById('manga-search');
const genreFilter = document.getElementById('genre-filter');
const yearFilter = document.getElementById('year-filter');
const seasonFilter = document.getElementById('season-filter');
const formatFilter = document.getElementById('format-filter');
const statusFilter = document.getElementById('status-filter');
const sortFilter = document.getElementById('sort-filter');
const applyFiltersButton = document.getElementById('apply-filters');
const resetFiltersButton = document.getElementById('reset-filters');
const searchButton = document.getElementById('search-button');

// Navigation search bar elements
const navSearchInput = document.querySelector('header .search-bar input');
const navSearchButton = document.querySelector('header .search-bar button');

// State management for browse page
let browseCurrentPage = 1;
let totalResults = 0;
let isBrowseLoading = false;
let currentFilters = {
    q: '',
    genres: '',
    start_date: '',
    end_date: '',
    season: '',
    type: '',
    status: '',
    order_by: 'score',
    sort: 'desc'
};

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
    
    // Set up user profile icon click
    const userProfileIcon = document.querySelector('.user-profile i');
    if (userProfileIcon) {
        userProfileIcon.addEventListener('click', () => {
            window.location.href = 'my-list.html';
        });
    }
    
    // Check for search query in URL and populate search box
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        searchInput.value = searchQuery;
        currentFilters.q = searchQuery;
        resetBrowseMangaGrid();
        fetchBrowseManga();
    } else {
        // Initial load without filters
        fetchBrowseManga();
    }
    
    // Load more button
    loadMoreBrowseButton.addEventListener('click', () => {
        browseCurrentPage++;
        fetchBrowseManga(false);
    });
    
    // Apply filters button
    applyFiltersButton.addEventListener('click', () => {
        updateFilters();
        resetBrowseMangaGrid();
        fetchBrowseManga();
    });
    
    // Reset filters button
    resetFiltersButton.addEventListener('click', () => {
        resetFilters();
        resetBrowseMangaGrid();
        fetchBrowseManga();
    });
    
    // Search button
    searchButton.addEventListener('click', () => {
        currentFilters.q = searchInput.value.trim();
        resetBrowseMangaGrid();
        fetchBrowseManga();
    });
    
    // Enter key in search field
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            currentFilters.q = searchInput.value.trim();
            resetBrowseMangaGrid();
            fetchBrowseManga();
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

// Update filters based on user selections
function updateFilters() {
    currentFilters.q = searchInput.value.trim();
    currentFilters.genres = genreFilter.value;
    
    // Handle year filter
    if (yearFilter.value.includes('_')) {
        const [startYear, endYear] = yearFilter.value.split('_');
        // Format dates as YYYY-MM-DD for the API
        currentFilters.start_date = startYear + '-01-01'; // First day of start year
        currentFilters.end_date = endYear + '-12-31';    // Last day of end year
    } else if (yearFilter.value) {
        // If it's a single year, set start date to first day and end date to last day
        currentFilters.start_date = yearFilter.value + '-01-01'; // First day of the year
        currentFilters.end_date = yearFilter.value + '-12-31';   // Last day of the year
    } else {
        currentFilters.start_date = '';
        currentFilters.end_date = '';
    }
    
    currentFilters.season = seasonFilter.value;
    currentFilters.type = formatFilter.value;
    currentFilters.status = statusFilter.value;
    
    // Handle sort filter
    const sortOption = sortFilter.value;
    currentFilters.order_by = sortOption;
    currentFilters.sort = 'desc'; // Default to descending
}

// Reset all filters to default
function resetFilters() {
    searchInput.value = '';
    genreFilter.value = '';
    yearFilter.value = '';
    seasonFilter.value = '';
    formatFilter.value = '';
    statusFilter.value = '';
    sortFilter.value = 'score';
    
    currentFilters = {
        q: '',
        genres: '',
        start_date: '',
        end_date: '',
        season: '',
        type: '',
        status: '',
        order_by: 'score',
        sort: 'desc'
    };
}

// Reset manga grid for new search
function resetBrowseMangaGrid() {
    browseMangaGrid.innerHTML = '';
    browseCurrentPage = 1;
    totalResults = 0;
    updateResultCount(0);
}

// Update the result count display
function updateResultCount(count) {
    totalResults = count;
    countDisplay.textContent = count;
}

// Main function to fetch manga data with filters
async function fetchBrowseManga(showLoading = true) {
    if (isBrowseLoading) return;
    
    isBrowseLoading = true;
    
    if (showLoading) {
        browseLoadingIndicator.style.display = 'flex';
        browseMangaGrid.style.display = 'none';
    }
    
    loadMoreBrowseButton.disabled = true;
    
    try {
        // Build the API URL with filters
        let apiUrl = `${JIKAN_API_BASE}/manga?page=${browseCurrentPage}&limit=${MANGA_PER_PAGE}`;
        
        // Add filters to the URL
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) {
                apiUrl += `&${key}=${encodeURIComponent(value)}`;
            }
        });
        
        const response = await fetch(apiUrl);
        
        // Handle rate limiting
        if (response.status === 429) {
            console.log('Rate limited, retrying in 1 second...');
            setTimeout(() => fetchBrowseManga(showLoading), 1000);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update results count on first page
        if (browseCurrentPage === 1) {
            updateResultCount(data.pagination.items.total);
        }
        
        renderBrowseMangaCards(data.data);
        
        // Handle pagination
        if (data.pagination.has_next_page) {
            loadMoreBrowseButton.style.display = 'block';
        } else {
            loadMoreBrowseButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error fetching manga:', error);
        displayBrowseError('Failed to load manga. Please try again later.');
    } finally {
        if (showLoading) {
            browseLoadingIndicator.style.display = 'none';
            browseMangaGrid.style.display = 'grid';
        }
        
        loadMoreBrowseButton.disabled = false;
        isBrowseLoading = false;
    }
}

// Create and append manga cards to the grid
function renderBrowseMangaCards(mangaList) {
    mangaList.forEach(manga => {
        const card = createMangaCard(manga);
        browseMangaGrid.appendChild(card);
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
function displayBrowseError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    browseMangaGrid.innerHTML = '';
    browseMangaGrid.appendChild(errorElement);
    browseMangaGrid.style.display = 'block';
    
    updateResultCount(0);
}