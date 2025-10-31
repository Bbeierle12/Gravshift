# 🌌 Gravshift

**Master Gravity. Absorb Everything.**

A fast-paced 3D gravity-based game where you control a gravitational entity, absorbing debris to grow in mass and power. Progress through difficulty tiers, complete missions, and unlock achievements as you navigate the cosmic void.

## ✨ Features

### 🎮 Core Gameplay
- **Absorption Mechanics**: Absorb smaller debris to grow in mass
- **Progressive Difficulty**: 8 tier system with smoother progression curve
- **Physics-Based Movement**: Smooth controls with boost mechanics
- **Recycle System**: Convert mass into points strategically
- **Smart Difficulty Scaling**: Adapts based on player power (70%) and time (30%)

### 🎯 Game Structure
- **Mission System**: 9 progressive objectives for bonus points
- **Achievement System**: 10+ achievements to unlock
- **Leaderboard**: Track high scores with persistent storage
- **Dynamic Difficulty**: Scales intelligently with player power and tier

### 🎨 Visual Feedback
- **Particle Effects**: Stunning absorption, tier-up, and recycling effects
- **Screen Shake**: Dynamic camera shake for impactful moments
- **Glow Effects**: Player and debris glow based on mass/tier
- **Camera Centering**: Smooth follow camera focused on player
- **Debug Overlay**: Press F3 for performance stats

### 🖥️ Improved UX
- **Collapsible Sidebar**: Access missions, achievements, hotkeys, and stats (Tab to toggle)
- **Global Hotkeys**: F3 for debug, Tab for sidebar, number keys reserved for future features
- **Real-time Stats**: Track debris absorbed, time played, difficulty multiplier
- **Responsive Design**: Smooth animations and transitions

### 🎵 Audio System
- **Procedural Audio**: Web Audio API-based sound synthesis
- **Event Sounds**: Absorption, tier-up, recycling, boost, collision sounds
- **Achievement Chimes**: Satisfying audio feedback for accomplishments
- **Ambient Background**: Subtle atmospheric hum

### ⚡ Performance Optimizations
- **Object Pooling**: Efficient memory management for debris and particles
- **Incremental Updates**: No full scene rebuilds
- **Consolidated Update Loop**: Single pass for all entities
- **Modular Architecture**: Separated rendering, input, and UI systems
- **Optimized Rendering**: High-performance Three.js configuration
- **Bundled Three.js**: Local dependency for faster loading

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W / ↑** | Move Forward |
| **S / ↓** | Move Backward |
| **A / ←** | Move Left |
| **D / →** | Move Right |
| **Q / Shift** | Ascend (Move Up) |
| **E / Ctrl** | Descend (Move Down) |
| **Space** | Boost |
| **R** | Recycle (Convert mass to points) |
| **B** | Toggle Build Mode |
| **1-3** | Select Building (in Build Mode) |
| **Tab** | Toggle Sidebar |
| **F3** | Toggle Debug Info |
| **ESC** | Pause |

## 🎯 Game Mechanics

### Mass & Tiers
- Absorb debris to gain mass
- Higher mass = larger size and gravitational pull
- **8 Tiers with smoother progression**: 3, 8, 18, 35, 60, 100, 150, 250 mass
- Each tier increases difficulty and spawn rates
- Tier progress bar shows advancement to next tier

### 🏗️ Building System (NEW!)
- **Press B** to enter build mode
- **Collect Resources** from absorbed debris:
  - 🔷 **Plastic**: Common material
  - ⚙️ **Metal**: Structural component
  - 🌿 **Organic**: Living matter
  - 🌱 **Seeds**: For planting trees
  - 💨 **Oxygen**: Life support (drains over time)

### Available Buildings
1. **Recycler** (Cost: 10 Plastic, 5 Metal)
   - Converts nearby debris into seeds
   - Passive resource generation
   - Press **1** to select

2. **Tree** (Cost: 1 Seed, 5 Organic)
   - Generates oxygen constantly
   - Improves environmental health
   - Press **2** to select

3. **Oxygen Generator** (Cost: 20 Metal, 10 Plastic)
   - High-output oxygen production
   - Sustains life in harsh zones
   - Press **3** to select

### Environmental Zones
- Colored zones indicate environmental health
- **Red** → **Yellow** → **Green** as health improves
- Trees within zones improve their health
- Healthy zones support better resource generation

### Missions
- Complete objectives for bonus points
- Missions scale with your current tier
- New missions unlock progressively

### Achievements
- Persistent unlocks across game sessions
- Bonus points for each achievement
- Track your accomplishments

### Strategy Tips
- **Balance Growth**: More mass = slower movement
- **Use Recycle**: Convert mass to points when overwhelmed
- **Boost Wisely**: Space bar for quick escapes or pursuits
- **Watch Your Size**: Only absorb debris smaller than you

## 🏗️ Architecture

### Project Structure
```
Gravshift/
├── index.html              # Main HTML file with sidebar UI
├── styles/
│   └── main.css           # All styling and animations
├── src/
│   ├── main.js            # Game initialization and loop (refactored)
│   ├── GameEngine.js      # Three.js rendering & object pooling
│   ├── GameStateManager.js # Missions, achievements, scoring
│   ├── EffectsManager.js  # Visual effects system
│   ├── AudioManager.js    # Procedural audio system
│   ├── UIManager.js       # HUD, sidebar, and menu management
│   ├── RenderManager.js   # Separated rendering logic
│   └── InputManager.js    # Consolidated input handling
├── package.json           # Dependencies
└── vite.config.js        # Build configuration
```

### Key Systems

#### Modular Architecture (NEW!)
- **RenderManager**: Separated rendering logic with debug stats
- **InputManager**: Centralized keyboard/mouse handling with hotkey system
- **Consolidated Update Loop**: Single-pass entity updates for better performance

#### Object Pooling
- Pre-allocated debris and particle pools
- Efficient acquire/release pattern
- Prevents garbage collection lag

#### Incremental Updates
- Only active objects are updated
- No full scene rebuilds
- Delta-time based physics

#### Event-Driven Architecture
- Custom events for game state changes
- Decoupled systems for maintainability

## 🎨 Customization

### Adjust Difficulty
In `src/main.js`, modify:
- `debrisSpawnInterval`: Time between debris spawns
- `maxDebris`: Maximum concurrent debris
- `boundarySize`: Play area size

### Add Achievements
In `src/GameStateManager.js`, add to `initializeAchievements()`:
```javascript
{
    id: 'your_achievement',
    title: 'Achievement Title',
    description: 'Description',
    icon: '🏆',
    unlocked: false,
    condition: () => /* your condition */
}
```

### Create Missions
In `src/GameStateManager.js`, add to `getMissionsList()`:
```javascript
{
    id: 'mission_id',
    title: 'Mission Title',
    description: 'Objective',
    difficulty: 1,  // Tier requirement
    reward: 100,
    condition: () => /* completion check */
}
```

## 🐛 Known Issues & Future Enhancements

### Potential Improvements
- [ ] Mobile touch controls
- [ ] Gamepad support
- [ ] More particle variety
- [ ] Power-ups and special abilities
- [ ] Multiplayer mode
- [ ] Additional game modes (survival, time attack)

## 📜 License

MIT License - Feel free to use and modify!

## 🙏 Credits

- Built with [Three.js](https://threejs.org/)
- Bundled with [Vite](https://vitejs.dev/)
- Audio via Web Audio API

---

**Enjoy mastering gravity!** 🌌✨
