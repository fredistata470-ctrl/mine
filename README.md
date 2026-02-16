# 2D Football Match Engine Prototype

A Phaser 3 browser prototype that simulates a full AI-vs-AI 7v7 football match over 3 minutes with:

- Formation-based teams (1-2-2-2)
- Ball possession, movement, passing, and shooting
- Goal detection and kickoff reset
- Team power modifiers and stamina impact
- Match timer, score UI, and end-of-match stats overlay

## Requirements

- Node.js 18+
- Modern browser (Chrome, Firefox, Edge, Safari)

## Setup

```bash
npm install
npm start
```

Then open: `http://localhost:8000`

## Project Structure

```text
index.html
src/
  main.js
  scenes/MatchScene.js
  entities/Player.js
  entities/Ball.js
  config/constants.js
  config/formations.js
  utils/physics.js
  utils/stats.js
```

## Controls

- The simulation starts automatically.
- At full time, click **Restart Match** to run another match.
