import { useEffect, useRef, useState, useCallback } from 'react'
import Sounds from '../components/Sounds'
import '../styles/JumpGame.scss'

const W = 480
const H = 200
const GROUND_Y = 160
const GRAVITY = 0.6
const JUMP_FORCE = -7       // impulsion initiale (tap court)
const JUMP_HOLD_FORCE = 0.45 // force additionnelle par frame maintenu
const MAX_HOLD_FRAMES = 18   // durée max du maintien en frames

// Joueur
const PLAYER_W = 28
const PLAYER_H = 36
const PLAYER_X = 60

// Obstacles
const OBS_W = 18
const OBS_MIN_H = 24
const OBS_MAX_H = 52
const OBS_MIN_GAP = 260
const OBS_MAX_GAP = 480

// Nuages
const CLOUD_COUNT = 3

const makeCloud = (x) => ({
x,
y: 20 + Math.random() * 40,
w: 50 + Math.random() * 40,
speed: 0.4 + Math.random() * 0.3,
})

const makeObstacle = (x) => ({
x,
h: OBS_MIN_H + Math.floor(Math.random() * (OBS_MAX_H - OBS_MIN_H)),
passed: false,
})

export default function JumpGame() {
const canvasRef = useRef(null)
const stateRef  = useRef(null)
const rafRef    = useRef(null)
const lastRef   = useRef(null)

const [score, setScore]     = useState(0)
const [hiScore, setHiScore] = useState(0)
const [phase, setPhase]     = useState('menu') // menu | playing | paused | over
const phaseRef              = useRef('menu')

const setPhaseSync = (p) => {
phaseRef.current = p
setPhase(p)
}

// ── Init ─────────────────────────────────────────────────────────
const initState = useCallback(() => {
stateRef.current = {
player: {
y: GROUND_Y - PLAYER_H,
vy: 0,
grounded: true,
frame: 1,       // animation marche
frameTick: 0,
jumpHeld: false,   // ← ajouter
jumpTime: 0,       // ← ajouter
},
obstacles: [
makeObstacle(W + 100),
makeObstacle(W + 100 + OBS_MIN_GAP + Math.random() * (OBS_MAX_GAP - OBS_MIN_GAP)),
],
clouds: Array.from({ length: CLOUD_COUNT }, (_, i) =>
makeCloud(80 + i * (W / CLOUD_COUNT))
),
speed: 4,
score: 0,
dist: 0,
}
setScore(0)
}, [])

// ── Dessin ───────────────────────────────────────────────────────
const draw = useCallback(() => {
const canvas = canvasRef.current
const s = stateRef.current
if (!canvas || !s) return
const ctx = canvas.getContext('2d')

// Fond ciel blanc
ctx.fillStyle = '#ffffff'
ctx.fillRect(0, 0, W, H)

// Nuages pixel
s.clouds.forEach(c => {
ctx.fillStyle = '#d0d0d0'
ctx.fillRect(c.x, c.y, c.w, 12)
ctx.fillRect(c.x + 8, c.y - 8, c.w - 16, 10)
})

// Sol
ctx.fillStyle = '#808080'
ctx.fillRect(0, GROUND_Y, W, 2)
// texture sol
ctx.fillStyle = '#a0a0a0'
for (let x = (s.dist % 40) * -1; x < W; x += 40) {
ctx.fillRect(x, GROUND_Y + 4, 20, 2)
}

// Obstacles (cactus pixelisé)
s.obstacles.forEach(obs => {
const ox = obs.x
const oy = GROUND_Y - obs.h
const oh = obs.h

// Tronc principal
ctx.fillStyle = '#006400'
ctx.fillRect(ox + 4, oy, OBS_W - 8, oh)

// Bras gauche
const armY = oy + Math.floor(oh * 0.35)
ctx.fillRect(ox, armY, 8, 14)
ctx.fillRect(ox, armY - 10, 8, 10)

// Bras droit
ctx.fillRect(ox + OBS_W - 8, armY + 6, 8, 14)
ctx.fillRect(ox + OBS_W - 8, armY - 4, 8, 10)

// Épines (pixel blanc)
ctx.fillStyle = '#90ee90'
ctx.fillRect(ox + 4, oy, 2, 4)
ctx.fillRect(ox + OBS_W - 6, oy, 2, 4)
})

// Joueur (personnage pixelisé)
const px = PLAYER_X
const py = s.player.y
const leg = s.player.grounded
? (Math.floor(s.player.frameTick / 6) % 2 === 0 ? 0 : 1)
: 0

// Corps
ctx.fillStyle = '#000080'
ctx.fillRect(px + 4, py + 10, PLAYER_W - 8, PLAYER_H - 18)

// Tête
ctx.fillStyle = '#ffcc99'
ctx.fillRect(px + 6, py, PLAYER_W - 12, 12)

// Yeux
ctx.fillStyle = '#000000'
ctx.fillRect(px + 10, py + 3, 2, 2)
ctx.fillRect(px + 16, py + 3, 2, 2)

// Bouche
ctx.fillRect(px + 11, py + 8, 6, 1)

// Cheveux
ctx.fillStyle = '#4a2c00'
ctx.fillRect(px + 6, py, PLAYER_W - 12, 3)

// Bras
ctx.fillStyle = '#000080'
if (!s.player.grounded) {
ctx.fillRect(px, py + 12, 6, 10)
ctx.fillRect(px + PLAYER_W - 6, py + 12, 6, 10)
} else {
ctx.fillRect(px + 2, py + 13, 4, 8)
ctx.fillRect(px + PLAYER_W - 6, py + 13, 4, 8)
}

// Jambes
ctx.fillStyle = '#1a1a3a'
if (leg === 0 || !s.player.grounded) {
ctx.fillRect(px + 6,  py + PLAYER_H - 10, 7, 10)
ctx.fillRect(px + 15, py + PLAYER_H - 10, 7, 10)
} else {
ctx.fillRect(px + 6,  py + PLAYER_H - 14, 7, 14)
ctx.fillRect(px + 15, py + PLAYER_H - 6,  7, 6)
}

// Chaussures
ctx.fillStyle = '#000000'
ctx.fillRect(px + 5,  py + PLAYER_H - 3, 9, 3)
ctx.fillRect(px + 14, py + PLAYER_H - 3, 9, 3)

// Score en jeu (coin supérieur droit)
ctx.fillStyle = '#808080'
ctx.font = '11px "MS Sans Serif", Tahoma, sans-serif'
ctx.textAlign = 'right'
ctx.fillText(`${String(Math.floor(s.score)).padStart(5, '0')}`, W - 8, 18)
ctx.fillText(`HI ${String(hiScore).padStart(5, '0')}`, W - 8, 32)
ctx.textAlign = 'left'
}, [hiScore])

// ── Boucle de jeu ────────────────────────────────────────────────
const gameLoop = useCallback((ts) => {
if (phaseRef.current !== 'playing') return
const s = stateRef.current
if (!s) return

const dt = lastRef.current ? Math.min((ts - lastRef.current) / 16.67, 3) : 1
lastRef.current = ts

// Accélération progressive
s.speed = Math.min(4 + s.score / 150, 12)

// Joueur — physique
s.player.vy += GRAVITY * dt
if (s.player.jumpHeld && s.player.vy < 0 && s.player.jumpTime < MAX_HOLD_FRAMES) {
s.player.vy -= JUMP_HOLD_FORCE * dt
s.player.jumpTime += dt
}
s.player.y  += s.player.vy * dt

if (s.player.y >= GROUND_Y - PLAYER_H) {
s.player.y       = GROUND_Y - PLAYER_H
s.player.vy      = 0
s.player.grounded = true
} else {
s.player.grounded = false
}

if (s.player.grounded) s.player.frameTick += dt

// Distance & score
s.dist  += s.speed * dt
s.score += s.speed * 0.05 * dt
setScore(Math.floor(s.score))

// Nuages
s.clouds.forEach(c => {
c.x -= c.speed * dt
if (c.x + c.w < 0) c.x = W + 20
})

// Obstacles
s.obstacles.forEach(obs => {
obs.x -= s.speed * dt
})

// Recycler obstacle sorti de l'écran
if (s.obstacles[0].x + OBS_W < 0) {
const lastX = Math.max(s.obstacles[0].x, s.obstacles[1].x)
s.obstacles.shift()
s.obstacles.push(
makeObstacle(lastX + OBS_MIN_GAP + Math.random() * (OBS_MAX_GAP - OBS_MIN_GAP))
)
}

// Collision AABB avec marge
const margin = 5
const px1 = PLAYER_X + margin
const py1 = s.player.y + margin
const px2 = PLAYER_X + PLAYER_W - margin
const py2 = s.player.y + PLAYER_H - margin

for (const obs of s.obstacles) {
const ox1 = obs.x + 4
const oy1 = GROUND_Y - obs.h
const ox2 = obs.x + OBS_W - 4
const oy2 = GROUND_Y

if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) {
Sounds.gameOver()
setHiScore(prev => Math.max(prev, Math.floor(s.score)))
setPhaseSync('over')
return
}
}

draw()
rafRef.current = requestAnimationFrame(gameLoop)
}, [draw])

// ── Saut ─────────────────────────────────────────────────────────
const jump = useCallback(() => {
const s = stateRef.current
if (!s) return
if (s.player.grounded) {
Sounds.gameJump()
s.player.vy        = JUMP_FORCE
s.player.grounded  = false
s.player.jumpHeld  = true   // ← démarre le maintien
s.player.jumpTime  = 0
}
}, [])

// ── Contrôles ────────────────────────────────────────────────────
useEffect(() => {
const onKey = (e) => {
if ([' ', 'ArrowUp', 'Escape'].includes(e.key)) {
e.preventDefault()
e.stopPropagation()
}
if (phaseRef.current === 'playing') {
if (e.key === ' ' || e.key === 'ArrowUp') jump()
if (e.key === 'Escape') {
cancelAnimationFrame(rafRef.current)
setPhaseSync('paused')
}
} else if (phaseRef.current === 'paused') {
if (e.key === ' ' || e.key === 'Escape') {
lastRef.current = null
setPhaseSync('playing')
rafRef.current = requestAnimationFrame(gameLoop)
}
}
}
const onKeyUp = (e) => {
if (e.key === ' ' || e.key === 'ArrowUp') {
const s = stateRef.current
if (s) s.player.jumpHeld = false
}
}
window.addEventListener('keydown', onKey)
window.addEventListener('keyup', onKeyUp)
return () => {
window.removeEventListener('keydown', onKey)
window.removeEventListener('keyup', onKeyUp)
}
}, [jump, gameLoop])

// Nettoyage
useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

// ── Handlers ─────────────────────────────────────────────────────
const handleStart = () => {
Sounds.gameStart()
initState()
setPhaseSync('playing')
lastRef.current = null
setTimeout(() => {
rafRef.current = requestAnimationFrame(gameLoop)
}, 50)
}

const handleRestart = () => {
Sounds.gameStart()
cancelAnimationFrame(rafRef.current)
initState()
setPhaseSync('playing')
lastRef.current = null
setTimeout(() => {
rafRef.current = requestAnimationFrame(gameLoop)
}, 50)
}

const handleResume = () => {
lastRef.current = null
setPhaseSync('playing')
rafRef.current = requestAnimationFrame(gameLoop)
}

// ── Render ───────────────────────────────────────────────────────
return (
<div className="jump-game">

{/* Barre de score */}
<div className="jump-game__score-bar">
<span className="jump-game__score-bar-item">
Score : <b>{Math.floor(score)}</b>
</span>
<span className="jump-game__score-bar-item">
Meilleur : <b>{hiScore}</b>
</span>
{phase === 'playing' && (
<span className="jump-game__score-bar-item jump-game__score-bar-item--playing">
▶ EN JEU
</span>
)}
{phase === 'paused' && (
<span className="jump-game__score-bar-item jump-game__score-bar-item--paused">
⏸ PAUSE
</span>
)}
</div>

{/* Zone de jeu */}
<div
className="jump-game__canvas-wrapper"
onMouseDown={phase === 'playing' ? jump : undefined}
onMouseUp={() => { if (stateRef.current) stateRef.current.player.jumpHeld = false }}
>
<canvas
ref={canvasRef}
width={W}
height={H}
className="jump-game__canvas"
data-testid="jump-canvas"
/>

{/* Menu */}
{phase === 'menu' && (
<div className="jump-game__overlay">
<div className="jump-game__dialog">
<div className="jump-game__dialog-title">
JUMP.exe
</div>
<div className="jump-game__dialog-body">
<p className="jump-game__dialog-text">
Appuyez sur <b>Espace</b> ou <b>Flèche Haut</b> pour sauter.<br />
Cliquez aussi sur le jeu pour sauter.<br />
<b>Échap</b> pour mettre en pause.
</p>
<button
className="jump-game__btn jump-game__btn--primary"
onClick={handleStart}
data-testid="jump-start-btn"
>
Nouvelle partie
</button>
</div>
</div>
</div>
)}

{/* Game Over */}
{phase === 'over' && (
<div className="jump-game__overlay">
<div className="jump-game__dialog">
<div className="jump-game__dialog-title jump-game__dialog-title--danger">
GAME OVER
</div>
<div className="jump-game__dialog-body">
<p className="jump-game__dialog-text">
Score final : <b>{Math.floor(score)}</b>
{Math.floor(score) >= hiScore && score > 0 && (
<span className="jump-game__dialog-record"> — Nouveau record !</span>
)}
</p>
<div className="jump-game__btn-row">
<button
className="jump-game__btn jump-game__btn--primary"
onClick={handleRestart}
data-testid="jump-restart-btn"
>
Rejouer
</button>
<button
className="jump-game__btn"
onClick={() => { cancelAnimationFrame(rafRef.current); setPhaseSync('menu'); }}
data-testid="jump-menu-btn"
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
<div className="jump-game__overlay">
<div className="jump-game__dialog">
<div className="jump-game__dialog-title">PAUSE</div>
<div className="jump-game__dialog-body">
<p className="jump-game__dialog-text">Jeu en pause.</p>
<div className="jump-game__btn-row">
<button
className="jump-game__btn jump-game__btn--primary"
onClick={handleResume}
data-testid="jump-resume-btn"
>
Reprendre
</button>
<button
className="jump-game__btn"
onClick={() => { cancelAnimationFrame(rafRef.current); setPhaseSync('menu'); }}
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
<div className="jump-game__status-bar">
<span>
{phase === 'playing' ? `Vitesse : ${stateRef.current?.speed?.toFixed(1) ?? '4.0'}` : 'Prêt'}
</span>
<span>JUMP v1.0</span>
</div>

</div>
)
}