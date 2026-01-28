# PerfectWalk

**Route planning for walking and running — with optional AI discovery.**

PerfectWalk is a modern web application that helps you plan, visualize, and save custom walking or running routes. Built with Google Maps integration and designed for a seamless user experience.

---

## What This Project Does

PerfectWalk is a client-side route planner with 3 main areas (after you select an area/region to work in):

### Route Builder (implemented)
- **Set Start / End / Stops** by clicking the map or searching places
- **Multi-stop routes** with drag & drop stop reordering
- **Walking directions** via Google Directions API, with total distance + ETA
- **AI route generation (V2.0)**: describe a walk → preview a full route → apply to the map
- **Area jump** (city/region selector) to quickly move the map

### Discover (AI) (implemented, early-stage)
- **Google Places-powered recommendations** for coffee / parks / food with real ratings, photos, and coordinates
- **Gemini-powered trails + chat** for natural language requests and route ideas
- **Add-to-route** inserts stops using precise coordinates (Places), with best-effort resolution for Gemini suggestions

### Saved Routes (implemented)
- **Save routes locally** (no account) and reload/delete them later

---

## Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Map** | Google Maps with custom dark mode styling |
| 🔍 **Location Search** | Find any place by name or address |
| 📍 **Flexible Waypoints** | Start, end, and unlimited stops |
| 🔄 **Drag & Drop** | Reorder stops with ease |
| 📊 **Route Stats** | Distance and estimated walking time |
| 💾 **Local Storage** | Save routes without an account (localStorage) |
| 🌙 **Dark Mode** | Beautiful themes for day and night |
| ✨ **Discover (Hybrid)** | Places for real POIs + Gemini for trails/chat |
| 🤖 **AI Route Generation** | Natural language prompt → complete start/stops/end route (with map preview) |
| 🌍 **Area Jump** | Jump to a city/region to explore and plan there |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom glassmorphism
- **Maps**: Google Maps JavaScript API
- **Storage**: localStorage (current)
- **AI**: Gemini API (optional / experimental)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Cloud account with Maps API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AIPerfectWalk.git
cd AIPerfectWalk

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Google Maps API key (and optional Gemini key) to .env

# Start development server
npm run dev
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable these APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
   - Places API
4. Create an API key and add to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```

### Gemini API Setup (optional)

1. Get an API key from Google AI Studio
2. Add to `.env`:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```

---

## Usage Guide

### Creating a Route

1. **Set Start** - Click the green button, then click the map or search
2. **Set End** - Click the red button, then select destination
3. **Add Stops** - Click the amber button to add waypoints
4. **Reorder** - Drag stops in the sidebar to rearrange
5. **Save** - Give your route a name for later

### Discover (Hybrid)

1. Select an **Area**
2. Open the **Discover** tab and choose a category
3. Click **Add to Route** to insert a suggested stop
4. Use **Chat** for natural-language requests (Gemini required)

### AI Route Generator (V2.0)

1. Select an **Area** (or allow location access)
2. In the **Build** tab, enter a prompt or tap a template
3. Click **Generate** to preview a full route
4. Review the dashed route preview on the map, then click **Use This Route**

Example prompts:
- “Plan a 5km scenic walk through parks with one coffee stop”
- “Create a park hopping route visiting 3-4 parks and viewpoints”
- “Make a historic walk with landmarks and a bakery stop”

### Tips
- Use the search box to quickly find locations
- The route will update automatically as you add/move points
- Toggle dark mode for night planning sessions
- If Gemini is not configured, Discover will prompt you to add `VITE_GEMINI_API_KEY`

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Map.jsx             # Google Maps display
│   ├── SearchBox.jsx       # Location autocomplete
│   ├── RouteBuilder.jsx    # Route creation controls
│   ├── RouteGenerator.jsx  # AI route generation UI (V2.0)
│   ├── SavedRoutes.jsx     # Saved routes list
│   ├── AIRecommendations.jsx# Discover tab UI
│   ├── AreaSelector.jsx     # City/region jump
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useRoute.js         # Route state management
│   ├── useRouteGenerator.js# AI route generation state
│   └── useLocalStorage.js  # Persistence helper
├── data/
│   └── routeTemplates.js   # Quick prompt templates for AI generation
├── context/             # React contexts
│   └── ThemeContext.jsx    # Dark/light mode
├── services/
│   └── geminiService.js     # Gemini calls + caching/fallbacks
└── utils/               # Helper functions
```

---

## Roadmap

- [x] V1.0 - Core route building
- [x] V1.5 - Search + Premium UI
- [x] V1.6 - Discover tab (Gemini recommendations)
- [x] V2.0 - AI route generation (natural language → full route)
- [ ] V2.5 - Weather + best-time suggestions
- [ ] V3.0 - User accounts + cloud sync

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

No license file is currently included in this repository.

---

<p align="center">
  <strong>Plan your perfect route, one step at a time.</strong>
</p>
