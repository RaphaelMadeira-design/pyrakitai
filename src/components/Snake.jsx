import { useEffect, useRef, useState, useCallback } from 'react'
import Sounds from '../components/Sounds'
import '../styles/Snake.scss'

const GRID = 20
const COLS = 20
const ROWS = 18
const W = GRID * COLS // 400px
const H = GRID * ROWS // 360px

const DIR = {
UP:    { x: 0,  y: -1 },
DOWN:  { x: 0,  y:  1 },
LEFT:  { x: -1, y:  0 },
RIGHT: { x: 1,  y:  0 },
}

const randomFood = (snake) => {
let pos
do {
pos = {
x: Math.floor(Math.random() * COLS),
y: Math.floor(Math.random() * ROWS),
}
} while (snake.some(s => s.x === pos.x && s.y === pos.y))
return pos
}

const SPEED_MAP = [
{ label: 'Facile', ms: 180 },
{ label: 'Normal', ms: 110 },
{ label: 'Rapide', ms: 65  },
]

export default function Snake() {
const canvasRef = useRef(null)
const stateRef  = useRef(null)
const loopRef   = useRef(null)

const [score, setScore]     = useState(0)
const [hiScore, setHiScore] = useState(0)
const [phase, setPhase]     = useState('menu') // menu | playing | paused | over
const [speedIdx, setSpeedIdx] = useState(1)
const [, forceRender]       = useState(0)

// ── Initialise l'état ──────────────────────────────────────────
const initState = useCallback((sIdx = speedIdx) => {
const snake = [
{ x: 10, y: 9 },
{ x: 9,  y: 9 },
{ x: 8,  y: 9 },
]
stateRef.current = {
snake,
dir:     DIR.RIGHT,
nextDir: DIR.RIGHT,
food:    randomFood(snake),
score:   0,
speed:   SPEED_MAP[sIdx].ms,
}
setScore(0)
}, [speedIdx])

// ── Rendu canvas ───────────────────────────────────────────────
const draw = useCallback(() => {
const canvas = canvasRef.current
if (!canvas || !stateRef.current) return
const ctx = canvas.getContext('2d')
const { snake, food } = stateRef.current

// fond damier style Win98
for (let row = 0; row < ROWS; row++) {
for (let col = 0; col < COLS; col++) {
ctx.fillStyle = (row + col) % 2 === 0 ? '#c0c0c0' : '#b8b8b8'
ctx.fillRect(col * GRID, row * GRID, GRID, GRID)
}
}

// nourriture rouge clignotante
const pulse = Math.floor(Date.now() / 300) % 2 === 0
ctx.fillStyle = pulse ? '#cc0000' : '#ff4444'
ctx.fillRect(food.x * GRID + 2, food.y * GRID + 2, GRID - 4, GRID - 4)
ctx.fillStyle = '#ff8888'
ctx.fillRect(food.x * GRID + 4, food.y * GRID + 4, 4, 4)

// serpent avec relief 3D Win98
snake.forEach((seg, i) => {
const isHead = i === 0
ctx.fillStyle = isHead ? '#000080' : '#0000aa'
ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2)

ctx.fillStyle = isHead ? '#4444ff' : '#2222cc'
ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, 2)
ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, 2, GRID - 2)

ctx.fillStyle = '#000040'
ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + GRID - 3, GRID - 2, 2)
ctx.fillRect(seg.x * GRID + GRID - 3, seg.y * GRID + 1, 2, GRID - 2)

// yeux sur la tête
if (isHead) {
const { dir } = stateRef.current
ctx.fillStyle = '#ffffff'
if (dir === DIR.RIGHT || dir === DIR.LEFT) {
const ex = dir === DIR.RIGHT ? seg.x * GRID + GRID - 6 : seg.x * GRID + 4
ctx.fillRect(ex, seg.y * GRID + 4, 3, 3)
ctx.fillRect(ex, seg.y * GRID + GRID - 7, 3, 3)
} else {
const ey = dir === DIR.DOWN ? seg.y * GRID + GRID - 6 : seg.y * GRID + 4
ctx.fillRect(seg.x * GRID + 4, ey, 3, 3)
ctx.fillRect(seg.x * GRID + GRID - 7, ey, 3, 3)
}
}
})
}, [])

// ── Tick logique ───────────────────────────────────────────────
const tick = useCallback(() => {
const s = stateRef.current
if (!s) return

s.dir = s.nextDir
const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

const die = () => {
if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null }
Sounds.gameOver()
setPhase('over')
}

if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
die()
return
}
if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
die()
return
}

const ateFood = head.x === s.food.x && head.y === s.food.y
const newSnake = [head, ...s.snake]
if (!ateFood) newSnake.pop()

s.snake = newSnake
if (ateFood) {
s.score += 10
s.food = randomFood(newSnake)
Sounds.gameScore()
setScore(s.score)
setHiScore(prev => Math.max(prev, s.score))
}

draw()
forceRender(n => n + 1)
}, [draw])

// ── Boucle de jeu ──────────────────────────────────────────────
const stopLoop = useCallback(() => {
if (loopRef.current) {
clearInterval(loopRef.current)
loopRef.current = null
}
}, [])

const startLoop = useCallback((sIdx = speedIdx) => {
stopLoop()
loopRef.current = setInterval(tick, SPEED_MAP[sIdx].ms)
}, [tick, speedIdx, stopLoop])

// ── Contrôles clavier ──────────────────────────────────────────
useEffect(() => {
const onKey = (e) => {
if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(e.key)) {
e.preventDefault()
e.stopPropagation()
}
const s = stateRef.current
if (!s) return

const dirMap = {
ArrowUp:    DIR.UP,
ArrowDown:  DIR.DOWN,
ArrowLeft:  DIR.LEFT,
ArrowRight: DIR.RIGHT,
}
if (dirMap[e.key]) {
const d = dirMap[e.key]
if (d.x !== -s.dir.x || d.y !== -s.dir.y) s.nextDir = d
}
if (e.key === ' ') {
setPhase(prev => {
if (prev === 'playing') { stopLoop(); return 'paused'; }
if (prev === 'paused')  { startLoop(); return 'playing'; }
return prev
})
}
if (e.key === 'Escape') {
stopLoop()
setPhase('menu')
}
}
window.addEventListener('keydown', onKey)
return () => window.removeEventListener('keydown', onKey)
}, [startLoop, stopLoop])

// ── Dessin initial quand le jeu démarre ────────────────────────
useEffect(() => {
if (phase === 'playing') draw()
}, [phase, draw])

// ── Nettoyage ──────────────────────────────────────────────────
useEffect(() => () => stopLoop(), [stopLoop])

// ── Handlers ──────────────────────────────────────────────────
const handleStart = () => {
Sounds.gameStart()
initState(speedIdx)
setPhase('playing')
setTimeout(() => startLoop(speedIdx), 50)
}

const handleRestart = () => {
Sounds.gameStart()
stopLoop()
initState(speedIdx)
setPhase('playing')
setTimeout(() => startLoop(speedIdx), 50)
}

// ── Render ────────────────────────────────────────────────────
return (
<div className="snake-game">

{/* Barre de score */}
<div className="snake-game__score-bar">
<span className="snake-game__score-bar-item">
Score : <b>{score}</b>
</span>
<span className="snake-game__score-bar-item">
Meilleur : <b>{hiScore}</b>
</span>
<span className="snake-game__score-bar-item">
Vitesse : <b>{SPEED_MAP[speedIdx].label}</b>
</span>
{phase === 'playing' && (
<span className="snake-game__score-bar-item snake-game__score-bar-item--playing">
▶ EN JEU
</span>
)}
{phase === 'paused' && (
<span className="snake-game__score-bar-item snake-game__score-bar-item--paused">
⏸ PAUSE
</span>
)}
</div>

{/* Zone de jeu */}
<div className="snake-game__canvas-wrapper">
<canvas
ref={canvasRef}
width={W}
height={H}
className="snake-game__canvas"
data-testid="snake-canvas"
/>

{/* Menu principal */}
{phase === 'menu' && (
<div className="snake-game__overlay">
<div className="snake-game__dialog">
<div className="snake-game__dialog-title">
SNAKE.exe
</div>
<div className="snake-game__dialog-body">
<p className="snake-game__dialog-text">
Utilisez les <b>flèches directionnelles</b> pour diriger le serpent.<br />
<b>Espace</b> pour pause · <b>Échap</b> pour quitter
</p>
<div className="snake-game__speed-row">
<label>Difficulté :</label>
{SPEED_MAP.map((s, i) => (
<button
key={s.label}
className={`snake-game__btn${speedIdx === i ? ' snake-game__btn--active' : ''}`}
onClick={() => setSpeedIdx(i)}
data-testid={`snake-speed-${i}`}
>
{s.label}
</button>
))}
</div>
<button
className="snake-game__btn snake-game__btn--primary"
onClick={handleStart}
data-testid="snake-start-btn"
>
Nouvelle partie
</button>
</div>
</div>
</div>
)}

{/* Game Over */}
{phase === 'over' && (
<div className="snake-game__overlay">
<div className="snake-game__dialog">
<div className="snake-game__dialog-title snake-game__dialog-title--danger">
GAME OVER
</div>
<div className="snake-game__dialog-body">
<p className="snake-game__dialog-text">
Score final : <b>{score}</b>
{score === hiScore && score > 0 && (
<span className="snake-game__dialog-record"> — Nouveau record !</span>
)}
</p>
<div className="snake-game__btn-row">
<button
className="snake-game__btn snake-game__btn--primary"
onClick={handleRestart}
data-testid="snake-restart-btn"
>
Rejouer
</button>
<button
className="snake-game__btn"
onClick={() => { stopLoop(); setPhase('menu'); }}
data-testid="snake-menu-btn"
>
Menu
</button>
</div>
</div>
</div>
</div>
)}

{/* Pause */}
{phase === 'paused' && (
<div className="snake-game__overlay">
<div className="snake-game__dialog">
<div className="snake-game__dialog-title">PAUSE</div>
<div className="snake-game__dialog-body">
<p className="snake-game__dialog-text">Jeu en pause.</p>
<div className="snake-game__btn-row">
<button
className="snake-game__btn snake-game__btn--primary"
onClick={() => { startLoop(); setPhase('playing'); }}
data-testid="snake-resume-btn"
>
Reprendre
</button>
<button
className="snake-game__btn"
onClick={() => { stopLoop(); setPhase('menu'); }}
>
Menu
</button>
</div>
</div>
</div>
</div>
)}
</div>

{/* Barre de statut */}
<div className="snake-game__status-bar">
<span>
{phase === 'playing'
? `Longueur : ${stateRef.current?.snake?.length ?? 3}`
: 'Prêt'}
</span>
<span>SNAKE v1.0</span>
</div>

</div>
)
}