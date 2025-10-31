# 🚀 Gravshift - Quick Start Guide

## Get Running in 3 Steps

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start Development Server
```bash
npm run dev
```

### 3️⃣ Open Your Browser
The game will automatically open at: **http://localhost:3000**

---

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| **W, A, S, D** or **Arrow Keys** | Move in 4 directions |
| **Space Bar** | Boost (faster movement) |
| **R** | Recycle (convert mass to points) |
| **ESC** | Pause game |

---

## 🎯 How to Play

1. **Start Small**: You begin as a small gravitational entity
2. **Absorb Debris**: Move into smaller debris to absorb and grow
3. **Grow Bigger**: Your mass increases with each absorption
4. **Tier Up**: Reach mass thresholds to advance tiers (5, 15, 35, 70, 120, 200)
5. **Complete Missions**: Follow on-screen objectives for bonus points
6. **Unlock Achievements**: Persistent achievements across game sessions
7. **Strategic Recycle**: Press R to convert 25% of your mass into points

---

## 💡 Pro Tips

- **You can only absorb debris smaller than yourself**
- **Larger mass = slower movement** (use boost!)
- **Recycle when overwhelmed** to reduce size and gain points
- **Watch the tier progress bar** at the bottom
- **Missions scale with your tier** - complete them for big rewards

---

## 🏗️ Build for Production

```bash
npm run build
```
Output goes to `dist/` folder - ready to deploy!

---

## ✨ Features Implemented

### ✅ Core Game
- Absorption mechanics with physics
- 7-tier progression system
- Dynamic difficulty scaling
- Smooth controls with boost

### ✅ Game Structure
- 8 progressive missions
- 10 unlockable achievements
- Top 10 leaderboard with persistence
- Score tracking system

### ✅ Visual Effects
- Particle effects (absorption, tier-up, recycle, boost, collision)
- Screen shake on impacts
- Dynamic glow effects
- Smooth camera following player
- Starfield background

### ✅ Audio
- Procedural sound synthesis (no files needed!)
- Absorption, tier-up, recycle, boost sounds
- Achievement & mission complete jingles
- Ambient background hum

### ✅ Performance
- Object pooling (zero GC lag)
- Incremental scene updates
- Optimized rendering (60 FPS target)
- Bundled Three.js locally

---

## 📊 Current Status

**Server Running**: http://localhost:3000
**Status**: ✅ All critical features complete
**Lines of Code**: 2,600+
**Ready to Play**: YES! 🎉

---

Enjoy mastering gravity! 🌌✨
