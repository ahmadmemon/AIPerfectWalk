# PerfectWalk 🚶‍♂️

**AI-powered route planning for walking and running enthusiasts.**

PerfectWalk is a modern web application that helps you plan, visualize, and save custom walking or running routes. Built with Google Maps integration and designed for a seamless user experience.

---

## 🎯 What We're Building

PerfectWalk aims to be the ultimate route planner for walkers and runners:

### Current (V1.5) ✅
- **Interactive route creation** - Click on the map or search locations
- **Multi-stop routes** - Add checkpoints along your path
- **Real-time directions** - Walking routes with distance and time estimates
- **Save & manage routes** - Store favorites locally for quick access
- **Premium UI** - Glassmorphism design with dark/light modes

### Coming Soon (V2) 🚀
- **AI-powered suggestions** - Gemini integration for smart route recommendations
- **Natural language** - "Find me a 5K route through parks with coffee stops"
- **Weather integration** - Best times to walk based on forecasts
- **User accounts** - Cloud sync across devices

### Future Vision 🌟
- Mobile apps (React Native)
- Social features (share routes, community paths)
- Fitness tracking integration
- Offline maps support

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Map** | Google Maps with custom dark mode styling |
| 🔍 **Location Search** | Find any place by name or address |
| 📍 **Flexible Waypoints** | Start, end, and unlimited stops |
| 🔄 **Drag & Drop** | Reorder stops with ease |
| 📊 **Route Stats** | Distance and estimated walking time |
| 💾 **Local Storage** | Save routes without an account |
| 🌙 **Dark Mode** | Beautiful themes for day and night |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom glassmorphism
- **Maps**: Google Maps JavaScript API
- **Storage**: localStorage (V1), PostgreSQL (planned)
- **AI**: Gemini API (V2)

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
# Add your Google Maps API key to .env

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

---

## 📖 Usage Guide

### Creating a Route

1. **Set Start** - Click the green button, then click the map or search
2. **Set End** - Click the red button, then select destination
3. **Add Stops** - Click the amber button to add waypoints
4. **Reorder** - Drag stops in the sidebar to rearrange
5. **Save** - Give your route a name for later

### Tips
- Use the search box to quickly find locations
- The route will update automatically as you add/move points
- Toggle dark mode for night planning sessions

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Map.jsx             # Google Maps display
│   ├── SearchBox.jsx       # Location autocomplete
│   ├── RouteBuilder.jsx    # Route creation controls
│   ├── SavedRoutes.jsx     # Saved routes list
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useRoute.js         # Route state management
│   └── useLocalStorage.js  # Persistence helper
├── context/             # React contexts
│   └── ThemeContext.jsx    # Dark/light mode
└── utils/               # Helper functions
```

---

## 🗺️ Roadmap

- [x] V1.0 - Core route building
- [x] V1.5 - Search + Premium UI
- [ ] V2.0 - Gemini AI integration
- [ ] V2.5 - Weather + Time suggestions
- [ ] V3.0 - User accounts + Cloud sync

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Plan your perfect route, one step at a time.</strong>
</p>
