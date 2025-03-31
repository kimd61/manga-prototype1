# mymangalist

a responsive web application for tracking and discovering manga.

## overview

mymangalist is a platform that allows users to discover, track, and share their manga reading experiences. the application features a clean, dark-themed ui optimized for manga enthusiasts.

## features

- responsive design that works on desktop and mobile devices
- track your manga reading progress
- discover top manga based on popularity, favorites, or rank
- personalized statistics and reading trends
- cross-platform compatibility (ios, android, macos, windows)

## technical details

### api integration

the application uses the jikan api (an unofficial myanimelist api) to fetch manga data:
- fetches top manga with pagination support
- displays manga images, scores, types, and volume information
- handles api rate limiting with automatic retries

### file structure

- `index.html`: main html structure and content
- `style.css`: styling including responsive design elements
- `script.js`: javascript for api interactions and dynamic content

### design elements

- dark theme optimized for reading comfort
- responsive layout using css grid and flexbox
- interactive elements with hover effects
- loading states for improved user experience

## browser compatibility

supports all modern browsers including:
- chrome/edge (chromium)
- firefox
- safari

## development

to run this project locally:

1. clone the repository
2. open `index.html` in your browser
3. no build process required as this is vanilla html/css/js

## future enhancements

- user authentication system
- personal manga lists (reading, completed, on-hold, etc.)
- expanded manga details with synopsis and character information
- community features including reviews and recommendations
