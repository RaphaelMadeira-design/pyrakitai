import { useEffect, useRef, useState, useCallback } from 'react'
import '../styles/VirusSurvivors.scss'

const CANVAS_W = 700
const CANVAS_H = 500
const HUD_H    = 0
const LS_KEY   = 'virus_survivors_highscore_v1'

const BOSS_INTERVAL = 300000
const EARLY_GAME_DURATION = 240000
const EARLY_SPAWN_MULT    = 1.65
const HP_DROP_CHANCE = 0.03

const LEVEL_XP = [3, 6, 11, 17, 24, 33, 43, 55, 69, 85]
const xpForNextLevel = (lv) => {
    const idx = lv - 1
    if (idx < LEVEL_XP.length) return LEVEL_XP[idx]
    return 141 + (idx - LEVEL_XP.length + 1) * 30
}

const UPGRADES = [
    { id: 'firerate',   name: 'RAPID FIRE',      desc: '-15% de cooldown de tir', apply: (s) => { s.player.fireCooldown = Math.max(120, s.player.fireCooldown * 0.85) } },
    { id: 'multishot',  name: 'MULTI SHOT',      desc: '+1 projectile par salve', apply: (s) => { s.player.projectiles += 1 } },
    { id: 'speed',      name: 'SPEED BOOST',     desc: '+10% de vitesse',         apply: (s) => { s.player.speed *= 1.10 } },
    { id: 'damage',     name: 'SHARPER BULLETS', desc: '+1 dégât par balle',      apply: (s) => { s.player.damage += 1 } },
    { id: 'bulletspeed',name: 'HYPER ROUNDS',    desc: '+20% vitesse des balles', apply: (s) => { s.player.bulletSpeed *= 1.20 } },
    { id: 'maxhp',      name: 'REPAIR KIT',      desc: '+1 PV max et soin 1',     apply: (s) => { s.player.maxHp += 1; s.player.hp = Math.min(s.player.hp + 1, s.player.maxHp) } },
    { id: 'magnet',     name: 'MAGNET FIELD',    desc: '+20 rayon d’attraction XP', apply: (s) => { s.player.magnetRange += 20; s.player.magnetPull += 20 } },
    { id: 'pierce',     name: 'PIERCING SHOT',   desc: '+1 ennemi transpercé',    apply: (s) => { s.player.pierce += 1 } },
    { id: 'range',      name: 'LONG SIGHT',      desc: '+25% portée de tir',      apply: (s) => { s.player.attackRange *= 1.25 } },
    { id: 'ricochet',   name: 'RICOCHET',        desc: '+1 rebond sur ennemis',   apply: (s) => { s.player.ricochet += 1 } },
    { id: 'explosive',  name: 'EXPLOSIVE SHOTS', desc: 'Ennemis explosent en mourant', apply: (s) => { s.player.explosive += 1 } },
    { id: 'lifesteal',  name: 'LIFE STEAL',      desc: '+8% chance de soin par kill', apply: (s) => { s.player.lifeSteal += 1 } },
    { id: 'armor',      name: 'ARMOR PLATING',   desc: '-12% dégâts subis (cumul)', apply: (s) => { s.player.armor += 1 } },
    { id: 'regen',      name: 'AUTO-REPAIR',     desc: 'Régén +0.15 PV/sec',      apply: (s) => { s.player.regen += 1 } },
    { id: 'critchance', name: 'CRIT CHANCE',     desc: '+10% chance de coup critique', apply: (s) => { s.player.critChance += 1 } },
    { id: 'critdmg',    name: 'CRIT DAMAGE',     desc: '+50% dégâts critiques',   apply: (s) => { s.player.critMult += 1 } },
    { id: 'luck',       name: 'LUCKY FIND',      desc: '+12% chance de drops',    apply: (s) => { s.player.luck += 1 } },
    { id: 'thorns',     name: 'THORNS',          desc: 'Reflète 0.5 dégât au contact', apply: (s) => { s.player.thorns += 1 } },
    { id: 'xpboost',    name: 'XP BOOST',        desc: '+15% XP ramassée',        apply: (s) => { s.player.xpBoost += 1 } },
]

const ELITE_CHANCE = 0.05
const BOSS_TYPES = ['CHASER', 'SHOOTER', 'SUMMONER', 'TROJAN']
const UPGRADE_CAP = 7

// Recettes d'évolutions : quand DEUX stats sont MAX, débloque une super-arme
const EVOLUTIONS = [
    { id: 'grenade_launcher', name: 'GRENADE LAUNCHER', req: ['ricochet', 'explosive'], desc: 'Grenades rebondissantes + AoE ×2' },
    { id: 'gatling_burst',    name: 'GATLING BURST',    req: ['multishot', 'firerate'], desc: 'Salve 360° toutes les 5s' },
    { id: 'railgun',          name: 'RAILGUN',          req: ['pierce', 'critchance'],  desc: 'Rail perce-tout crit toutes les 4s' },
    { id: 'bio_reactor',      name: 'BIO REACTOR',      req: ['lifesteal', 'regen'],    desc: 'Régén ×2 · Life-steal +30%' },
    { id: 'reactive_plating', name: 'REACTIVE PLATING', req: ['thorns', 'armor'],       desc: 'Onde de choc AoE quand touché' },
    { id: 'orbital_drones',   name: 'ORBITAL DRONES',   req: ['speed', 'range'],        desc: '2 drones orbitent et tirent' },
]

const getEnemyPool = (elapsed) => {
    const pool = ['grunt']
    if (elapsed > 120000) pool.push('fast')
    if (elapsed > 240000) pool.push('tank')
    if (elapsed > 300000) pool.push('shooter')
    return pool
}

const pickThreeUpgrades = (pickedCounts = {}) => {
    const pool = UPGRADES.filter(u => (pickedCounts[u.id] || 0) < UPGRADE_CAP)
    const out = []
    const working = [...pool]
    for (let i = 0; i < 3 && working.length; i++) {
        const idx = Math.floor(Math.random() * working.length)
        out.push(working[idx])
        working.splice(idx, 1)
    }
    return out
}

const makeInitialState = () => ({
    player: {
        x: CANVAS_W / 2, y: CANVAS_H / 2,
        size: 16, speed: 130,
        hp: 5, maxHp: 5, iframes: 0,
        fireCooldown: 1200, fireTimer: 0,
        damage: 1, bulletSpeed: 320, projectiles: 1, pierce: 0,
        magnetRange: 40, magnetPull: 80,
        attackRange: 160,
        // Nouvelles stats
        ricochet: 0,
        explosive: 0,
        lifeSteal: 0,
        armor: 0,
        regen: 0,
        regenAccum: 0,
        critChance: 0,
        critMult: 0,
        luck: 0,
        thorns: 0,
        xpBoost: 0,
        popups: [],
        // Évolutions débloquées
        evolutions: {},
        gatlingTimer: 5000,
        railgunTimer: 4000,
        drones: [],
    },
    enemies: [], bullets: [], enemyBullets: [],
    xpOrbs: [], hpDrops: [], upgradeTokens: [],
    explosions: [], lasers: [], slamShadows: [], dashTelegraphs: [],
    mines: [], teleFx: [], evoBanners: [],
    pickedUpgrades: {},
    keys: { up: false, down: false, left: false, right: false },
    spawnTimer: 0, spawnRate: 1400, spawnRateTimer: 0,
    elapsed: 0, xp: 0, level: 1, xpToNext: xpForNextLevel(1),
    pendingLevelUps: 0, kills: 0,
    nextBossAt: BOSS_INTERVAL, bossCount: 0,
    // Stats de fin
    totalDamage: 0,
    shotsFired: 0,
    bossKills: { CHASER: 0, SHOOTER: 0, SUMMONER: 0, TROJAN: 0 },
    eliteKills: 0,
    evoUnlocked: [],
    critHits: 0,
})

// Helpers stats dérivées
const armorMult = (lvl) => Math.max(0.25, 1 - Math.min(0.75, lvl * 0.12))
const critChanceOf = (lvl) => Math.min(0.85, lvl * 0.10)
const critMultOf = (lvl) => 2 + lvl * 0.5
const luckDropMult = (lvl) => 1 + lvl * 0.12
const xpBoostMult = (lvl) => 1 + lvl * 0.15
const lifeStealChance = (lvl) => Math.min(0.6, lvl * 0.08)

const drawPlayer = (ctx, p) => {
    const s = p.size, x = p.x - s/2, y = p.y - s/2
    const flash = p.iframes > 0 && Math.floor(p.iframes / 80) % 2 === 0
    ctx.fillStyle = '#000000'; ctx.fillRect(x - 1, y - 1, s + 2, s + 2)
    ctx.fillStyle = flash ? '#4040c0' : '#000080'; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = flash ? '#8080ff' : '#4040ff'
    ctx.fillRect(x, y, s, 2); ctx.fillRect(x, y, 2, s)
    ctx.fillStyle = '#000040'
    ctx.fillRect(x, y + s - 2, s, 2); ctx.fillRect(x + s - 2, y, 2, s)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + s/2 - 1, y + s/2 - 1, 2, 2)
    // Aura d'armure
    if (p.armor > 0) {
        ctx.strokeStyle = 'rgba(180,200,255,0.35)'
        ctx.lineWidth = 1
        ctx.strokeRect(x - 3, y - 3, s + 6, s + 6)
    }
}

const drawVirus = (ctx, e) => {
    const s = e.size, x = e.x - s/2, y = e.y - s/2
    let dark, body, light, shade, crossColor
    if (e.kind === 'fast') {
        dark='#000000'; body='#1aa04a'; light='#4de07a'; shade='#0a5028'; crossColor='#ffffff'
    } else if (e.kind === 'tank') {
        dark='#000000'; body='#7a2ac0'; light='#c88aff'; shade='#3a0e60'; crossColor='#ffffff'
    } else if (e.kind === 'shooter') {
        dark='#000000'; body='#c8a020'; light='#ffe480'; shade='#5a4408'; crossColor='#3a2a04'
    } else {
        dark='#000000'; body='#c91b1b'; light='#ff4444'; shade='#800000'; crossColor='#ffffff'
    }
    ctx.fillStyle = dark; ctx.fillRect(x - 1, y - 1, s + 2, s + 2)
    ctx.fillStyle = body; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = light; ctx.fillRect(x, y, s, 2); ctx.fillRect(x, y, 2, s)
    ctx.fillStyle = shade; ctx.fillRect(x, y + s - 2, s, 2); ctx.fillRect(x + s - 2, y, 2, s)
    if (e.kind === 'shooter') {
        ctx.strokeStyle = crossColor; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(e.x, e.y, s / 4, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x + 3, e.y); ctx.lineTo(x + s - 3, e.y)
        ctx.moveTo(e.x, y + 3); ctx.lineTo(e.x, y + s - 3)
        ctx.stroke()
    } else {
        ctx.strokeStyle = crossColor; ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + s - 4, y + s - 4)
        ctx.moveTo(x + s - 4, y + 4); ctx.lineTo(x + 4, y + s - 4)
        ctx.stroke()
    }
    if (e.isElite) {
        const t = e.pulse || 0
        const alpha = 0.35 + 0.35 * (Math.sin(t) + 1) / 2
        ctx.strokeStyle = `rgba(255, 210, 40, ${alpha})`; ctx.lineWidth = 2
        ctx.strokeRect(x - 3, y - 3, s + 6, s + 6)
        ctx.fillStyle = `rgba(255, 235, 120, ${alpha})`
        ctx.fillRect(x - 2, y - 2, 2, 2); ctx.fillRect(x + s, y - 2, 2, 2)
        ctx.fillRect(x - 2, y + s, 2, 2); ctx.fillRect(x + s, y + s, 2, 2)
    }
    if (e.hp < e.maxHp) {
        const barW = s, pct = Math.max(0, e.hp / e.maxHp)
        ctx.fillStyle = '#000000'; ctx.fillRect(x - 1, y - 5, barW + 2, 3)
        ctx.fillStyle = pct > 0.5 ? '#40e050' : pct > 0.25 ? '#ffcc20' : '#ff4040'
        ctx.fillRect(x, y - 4, Math.floor(barW * pct), 1)
    }
}

const drawBoss = (ctx, e) => {
    // Invisibilité pendant téléportation
    if (e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in') {
        ctx.save(); ctx.globalAlpha = 0.15
    }
    // Boss en l'air (SLAM) : rendu semi-transparent + décalé vers le haut
    const airOffset = (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock') ? -60 : 0
    const alpha = airOffset < 0 ? 0.35 : 1
    ctx.save()
    ctx.globalAlpha = alpha
    const s = e.size, x = e.x - s/2, y = e.y - s/2 + airOffset
    let dark, body, light, shade
    if (e.bossType === 'SHOOTER')      { dark='#000000'; body='#0a3a8a'; light='#4a8ee0'; shade='#04123a' }
    else if (e.bossType === 'SUMMONER'){ dark='#000000'; body='#0a6a2a'; light='#5ee06a'; shade='#083810' }
    else if (e.bossType === 'TROJAN')  { dark='#000000'; body='#3a1a08'; light='#c86020'; shade='#1a0804' }
    else                                { dark='#000000'; body='#5a1a8a'; light='#c060ff'; shade='#2a0844' }
    ctx.fillStyle = dark; ctx.fillRect(x - 2, y - 2, s + 4, s + 4)
    ctx.fillStyle = body; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = light; ctx.fillRect(x, y, s, 3); ctx.fillRect(x, y, 3, s)
    ctx.fillStyle = shade; ctx.fillRect(x, y + s - 3, s, 3); ctx.fillRect(x + s - 3, y, 3, s)
    const cx = x + s/2, cy = y + s/2
    ctx.fillStyle = '#ffffff'
    if (e.bossType === 'SHOOTER') {
        ctx.fillRect(cx - 1, cy - 12, 2, 24); ctx.fillRect(cx - 12, cy - 1, 24, 2)
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.stroke()
    } else if (e.bossType === 'SUMMONER') {
        for (const [ox, oy] of [[-8, -5], [8, -5], [0, 8]]) {
            ctx.fillRect(cx + ox - 3, cy + oy - 3, 6, 6)
            ctx.strokeStyle = '#c91b1b'; ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(cx + ox - 2, cy + oy - 2); ctx.lineTo(cx + ox + 2, cy + oy + 2)
            ctx.moveTo(cx + ox + 2, cy + oy - 2); ctx.lineTo(cx + ox - 2, cy + oy + 2)
            ctx.stroke()
        }
    } else if (e.bossType === 'TROJAN') {
        // Grand T stylisé + œil rouge (cheval de Troie)
        ctx.fillRect(cx - 9, cy - 8, 18, 3)
        ctx.fillRect(cx - 2, cy - 8, 4, 16)
        ctx.fillStyle = '#ff2020'
        ctx.fillRect(cx - 3, cy + 4, 2, 2)
        ctx.fillRect(cx + 1, cy + 4, 2, 2)
        // "sabots"
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(cx - 8, cy + 8, 3, 3); ctx.fillRect(cx + 5, cy + 8, 3, 3)
    } else {
        ctx.fillRect(cx - 7, cy - 5, 4, 4); ctx.fillRect(cx + 3, cy - 5, 4, 4)
        ctx.fillRect(cx - 5, cy + 3, 10, 3)
        ctx.fillRect(cx - 4, cy + 6, 2, 2); ctx.fillRect(cx + 2, cy + 6, 2, 2)
    }
    ctx.restore()
    // Anneau de charge autour du boss selon la phase
    if (e.specialPhase === 'laser_charge') {
        const prog = 1 - (e.specialT / 1200)
        ctx.strokeStyle = `rgba(120,220,255,${0.4 + 0.5 * prog})`
        ctx.lineWidth = 2 + prog * 3
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.7 + prog * 8, 0, Math.PI * 2); ctx.stroke()
    } else if (e.specialPhase === 'dash_tele') {
        const prog = 1 - (e.specialT / 900)
        ctx.strokeStyle = `rgba(255,120,180,${0.4 + 0.5 * prog})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.65, 0, Math.PI * 2); ctx.stroke()
    } else if (e.specialPhase === 'spiral') {
        ctx.strokeStyle = 'rgba(120,255,120,0.45)'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 0.7, 0, Math.PI * 2); ctx.stroke()
    }
    const hpPct = Math.max(0, e.hp / e.maxHp), barW = s
    ctx.fillStyle = '#000000'; ctx.fillRect(x - 1, y - 8, barW + 2, 5)
    ctx.fillStyle = '#c91b1b'; ctx.fillRect(x, y - 7, Math.floor(barW * hpPct), 3)
    if (e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in') ctx.restore()
}

const drawEnemyBullet = (ctx, b) => {
    ctx.fillStyle = '#000000'; ctx.fillRect(b.x - 4, b.y - 4, 8, 8)
    ctx.fillStyle = '#66c8ff'; ctx.fillRect(b.x - 3, b.y - 3, 6, 6)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2)
}

const drawUpgradeToken = (ctx, t) => {
    const pulse = (Math.sin(t.pulse) + 1) / 2, size = 8 + pulse * 2
    ctx.fillStyle = '#000000'; ctx.beginPath()
    for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8 - Math.PI / 2
        const r = i % 2 === 0 ? size + 2 : (size / 2) + 1
        const px = t.x + Math.cos(ang) * r, py = t.y + Math.sin(ang) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = pulse > 0.5 ? '#fff2a0' : '#ffcc20'; ctx.beginPath()
    for (let i = 0; i < 8; i++) {
        const ang = (Math.PI * 2 * i) / 8 - Math.PI / 2
        const r = i % 2 === 0 ? size : size / 2
        const px = t.x + Math.cos(ang) * r, py = t.y + Math.sin(ang) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#ffffff'; ctx.fillRect(t.x - 1, t.y - 3, 2, 2)
}

const drawBullet = (ctx, b) => {
    const isCrit = b.crit
    ctx.fillStyle = '#000000'; ctx.fillRect(b.x - 3, b.y - 3, 6, 6)
    ctx.fillStyle = isCrit ? '#ff40a0' : (b.explosive ? '#ff9020' : '#ffff80')
    ctx.fillRect(b.x - 2, b.y - 2, 4, 4)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 1, 2, 2)
}

const drawDiamond = (ctx, o) => {
    const s = o.size
    ctx.fillStyle = '#000000'; ctx.beginPath()
    ctx.moveTo(o.x, o.y - s - 1); ctx.lineTo(o.x + s + 1, o.y)
    ctx.lineTo(o.x, o.y + s + 1); ctx.lineTo(o.x - s - 1, o.y)
    ctx.closePath(); ctx.fill()
    let fill = '#ffff00'
    if (o.value >= 5) fill = '#ff9020'
    else if (o.value >= 3) fill = '#ffdd40'
    ctx.fillStyle = fill; ctx.beginPath()
    ctx.moveTo(o.x, o.y - s); ctx.lineTo(o.x + s, o.y)
    ctx.lineTo(o.x, o.y + s); ctx.lineTo(o.x - s, o.y)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#ffffcc'; ctx.fillRect(o.x - 1, o.y - s + 2, 2, 2)
}

const drawHpDrop = (ctx, h) => {
    const s = h.size, x = h.x - s/2, y = h.y - s/2
    const pulse = (Math.sin(h.pulse) + 1) / 2
    ctx.fillStyle = '#000000'; ctx.fillRect(x - 1, y - 1, s + 2, s + 2)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = pulse > 0.4 ? '#e01020' : '#ff4050'
    ctx.fillRect(x + Math.floor(s * 0.4), y + 2, Math.ceil(s * 0.2), s - 4)
    ctx.fillRect(x + 2, y + Math.floor(s * 0.4), s - 4, Math.ceil(s * 0.2))
}

const drawExplosion = (ctx, ex) => {
    const prog = 1 - (ex.life / ex.maxLife)
    const r = ex.maxRadius * (0.4 + 0.6 * prog)
    const a = 0.6 * (1 - prog)
    ctx.fillStyle = `rgba(255,180,60,${a})`
    ctx.beginPath(); ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = `rgba(255,240,120,${a + 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2); ctx.stroke()
}

const drawSlamShadow = (ctx, sh) => {
    // ombre grandit puis se verrouille
    const prog = Math.min(1, sh.age / sh.duration)
    const r = 30 + prog * 8
    const alpha = sh.locked ? 0.6 : (0.35 + 0.25 * Math.sin(sh.age / 90))
    ctx.fillStyle = `rgba(0,0,0,${alpha})`
    ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = sh.locked ? 'rgba(255,80,80,0.9)' : 'rgba(255,120,120,0.6)'
    ctx.lineWidth = sh.locked ? 3 : 2
    ctx.beginPath(); ctx.arc(sh.x, sh.y, r, 0, Math.PI * 2); ctx.stroke()
    // croix pour marquer l'impact
    ctx.strokeStyle = 'rgba(255,60,60,0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(sh.x - 8, sh.y); ctx.lineTo(sh.x + 8, sh.y)
    ctx.moveTo(sh.x, sh.y - 8); ctx.lineTo(sh.x, sh.y + 8)
    ctx.stroke()
}

const drawLaser = (ctx, la) => {
    const nx = Math.cos(la.angle), ny = Math.sin(la.angle)
    const x2 = la.x + nx * la.length
    const y2 = la.y + ny * la.length
    if (la.phase === 'aim') {
        ctx.strokeStyle = `rgba(120,220,255,${0.35 + 0.35 * Math.sin(la.age / 60)})`
        ctx.lineWidth = 1
        ctx.setLineDash([6, 5])
        ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(x2, y2); ctx.stroke()
        ctx.setLineDash([])
    } else {
        // Beam actif
        ctx.strokeStyle = 'rgba(140,230,255,0.9)'
        ctx.lineWidth = 8
        ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(x2, y2); ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(la.x, la.y); ctx.lineTo(x2, y2); ctx.stroke()
    }
}

const drawDashTele = (ctx, d) => {
    ctx.strokeStyle = `rgba(255,120,180,${0.35 + 0.35 * Math.sin(d.age / 60)})`
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke()
    ctx.setLineDash([])
    // Cible
    ctx.strokeStyle = 'rgba(255,80,140,0.9)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(d.x2, d.y2, 10, 0, Math.PI * 2); ctx.stroke()
}

const drawMine = (ctx, m) => {
    const armed = m.armAt <= 0
    const pulse = (Math.sin(m.age / 90) + 1) / 2
    ctx.fillStyle = '#000000'
    ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = armed ? (pulse > 0.5 ? '#ff4020' : '#802010') : '#606060'
    ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, Math.PI * 2); ctx.fill()
    // picots
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1
    for (let k = 0; k < 8; k++) {
        const a = (Math.PI * 2 * k) / 8
        ctx.beginPath()
        ctx.moveTo(m.x + Math.cos(a) * 6, m.y + Math.sin(a) * 6)
        ctx.lineTo(m.x + Math.cos(a) * 10, m.y + Math.sin(a) * 10)
        ctx.stroke()
    }
    if (armed) {
        ctx.fillStyle = pulse > 0.5 ? '#ffffff' : '#ffcc00'
        ctx.fillRect(m.x - 1, m.y - 1, 2, 2)
    }
}

const drawTeleFx = (ctx, tf) => {
    const prog = 1 - (tf.life / tf.maxLife)
    const r = 4 + prog * 26
    const a = 0.7 * (1 - prog)
    ctx.strokeStyle = `rgba(200,120,255,${a})`
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(tf.x, tf.y, r, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(tf.x, tf.y, r * 0.55, 0, Math.PI * 2); ctx.stroke()
}

const drawDrone = (ctx, dr) => {
    const s = 8, x = dr.x - s / 2, y = dr.y - s / 2
    ctx.fillStyle = '#000000'; ctx.fillRect(x - 1, y - 1, s + 2, s + 2)
    ctx.fillStyle = '#40e0ff'; ctx.fillRect(x, y, s, s)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2)
    ctx.strokeStyle = 'rgba(100,220,255,0.5)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(dr.x, dr.y, s * 0.9, 0, Math.PI * 2); ctx.stroke()
}

const drawPopups = (ctx, popups) => {
    for (const p of popups) {
        const a = Math.max(0, p.life / p.maxLife)
        ctx.fillStyle = p.color.replace('ALPHA', a.toFixed(2))
        ctx.font = 'bold 10px monospace'
        ctx.fillText(p.text, p.x, p.y)
    }
}

const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60), s = totalSec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Fonction utilitaire : distance point-segment (pour le laser)
const distPointToSeg = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1, dy = y2 - y1
    const len2 = dx*dx + dy*dy
    if (len2 === 0) { const a = px - x1, b = py - y1; return Math.sqrt(a*a + b*b) }
    let t = ((px - x1) * dx + (py - y1) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const cx = x1 + t * dx, cy = y1 + t * dy
    const ex = px - cx, ey = py - cy

    return Math.sqrt(ex*ex + ey*ey)
}

export default function VirusSurvivors() {
    const canvasRef = useRef(null)
    const rafRef = useRef(null)
    const lastTsRef = useRef(0)
    const gsRef = useRef(makeInitialState())
    const hudTickRef = useRef(0)

    const [phase, setPhase] = useState('menu')
    const [choices, setChoices] = useState([])
    const [hud, setHud] = useState({ hp: 5, maxHp: 5, level: 1, xp: 0, xpToNext: 5, elapsed: 0, kills: 0, highScore: 0 })
    const [bossAlert, setBossAlert] = useState({ at: 0, type: '' })

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY)
            const hs = raw ? parseInt(raw, 10) : 0
            if (!Number.isNaN(hs)) setHud((h) => ({ ...h, highScore: hs }))
        } catch (_) { /* ignore */ }
    }, [])

    const syncHud = useCallback(() => {
        const s = gsRef.current
        setHud((h) => ({ ...h, hp: s.player.hp, maxHp: s.player.maxHp, level: s.level, xp: s.xp, xpToNext: s.xpToNext, elapsed: s.elapsed, kills: s.kills }))
    }, [])

    const openUpgradeMenu = useCallback(() => {
        const s = gsRef.current
        setChoices(pickThreeUpgrades(s.pickedUpgrades))
        setPhase('levelup')
    }, [])

    const checkEvolutions = useCallback(() => {
        const s = gsRef.current
        const unlocked = []
        for (const evo of EVOLUTIONS) {
            if (s.player.evolutions[evo.id]) continue
            const ok = evo.req.every(r => (s.pickedUpgrades[r] || 0) >= UPGRADE_CAP)
            if (ok) {
                s.player.evolutions[evo.id] = true
                unlocked.push(evo)
                s.evoUnlocked.push(evo.name)
                // Bannière + init effet
                s.evoBanners.push({ text: `EVOLUTION : ${evo.name}`, life: 3000, maxLife: 3000 })
                if (evo.id === 'orbital_drones') {
                    s.player.drones = [{ angle: 0 }, { angle: Math.PI }]
                }
                if (evo.id === 'gatling_burst') s.player.gatlingTimer = 3000
                if (evo.id === 'railgun')       s.player.railgunTimer = 3000
                if (evo.id === 'bio_reactor')   { s.player.hp = Math.min(s.player.maxHp, s.player.hp + 2) }
            }
        }
        return unlocked
    }, [])

    const pickUpgrade = useCallback((idx) => {
        const s = gsRef.current
        const choice = choices[idx]
        if (!choice) return
        const cur = s.pickedUpgrades[choice.id] || 0
        if (cur >= UPGRADE_CAP) return
        choice.apply(s)
        s.pickedUpgrades[choice.id] = cur + 1
        checkEvolutions()
        s.pendingLevelUps -= 1
        if (s.pendingLevelUps > 0) {
            setChoices(pickThreeUpgrades(s.pickedUpgrades))
        } else {
            setChoices([])
            lastTsRef.current = 0
            setPhase('playing')
        }
        syncHud()
    }, [choices, syncHud, checkEvolutions])

    const startGame = useCallback(() => {
        gsRef.current = makeInitialState()
        lastTsRef.current = 0
        setChoices([])
        setBossAlert({ at: 0, type: '' })
        syncHud()
        setPhase('playing')
    }, [syncHud])

    const restart = useCallback(() => { startGame() }, [startGame])
    const backToMenu = useCallback(() => { setChoices([]); setPhase('menu') }, [])

    useEffect(() => {
        const onKeyDown = (e) => {
            const s = gsRef.current, k = e.key
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Escape'].includes(k)) { e.preventDefault(); e.stopPropagation() }
            if (k === 'ArrowUp'    || k === 'w' || k === 'W' || k === 'z' || k === 'Z') s.keys.up = true
            if (k === 'ArrowDown'  || k === 's' || k === 'S')                            s.keys.down = true
            if (k === 'ArrowLeft'  || k === 'a' || k === 'A' || k === 'q' || k === 'Q') s.keys.left = true
            if (k === 'ArrowRight' || k === 'd' || k === 'D')                            s.keys.right = true
            if (phase === 'levelup') {
                if (k === '1') pickUpgrade(0)
                else if (k === '2') pickUpgrade(1)
                else if (k === '3') pickUpgrade(2)
                return
            }
            if (phase === 'over' && (k === 'r' || k === 'R' || k === 'Enter')) { restart(); return }
            if (phase === 'menu' && (k === 'Enter' || k === ' ')) { startGame(); return }
            if (k === ' ') {
                if (phase === 'playing') setPhase('paused')
                else if (phase === 'paused') setPhase('playing')
            }
            if (k === 'Escape') {
                if (phase === 'playing' || phase === 'paused' || phase === 'over') backToMenu()
            }
        }
        const onKeyUp = (e) => {
            const s = gsRef.current, k = e.key
            if (k === 'ArrowUp'    || k === 'w' || k === 'W' || k === 'z' || k === 'Z') s.keys.up = false
            if (k === 'ArrowDown'  || k === 's' || k === 'S')                            s.keys.down = false
            if (k === 'ArrowLeft'  || k === 'a' || k === 'A' || k === 'q' || k === 'Q') s.keys.left = false
            if (k === 'ArrowRight' || k === 'd' || k === 'D')                            s.keys.right = false
        }
        const onVisibility = () => {
            if (document.hidden && phase === 'playing') setPhase('paused')
            lastTsRef.current = 0
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [phase, pickUpgrade, restart, startGame, backToMenu])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        const addPopup = (x, y, text, color = 'rgba(255,255,255,ALPHA)') => {
            gsRef.current.player.popups.push({ x, y, text, color, life: 700, maxLife: 700, vy: -18 })
        }

        const applyDamageToPlayer = (amount) => {
            const s = gsRef.current, p = s.player
            if (p.iframes > 0) return
            const reduced = Math.max(1, Math.round(amount * armorMult(p.armor)))
            p.hp -= reduced
            p.iframes = 800
            addPopup(p.x, p.y - 12, `-${reduced}`, 'rgba(255,80,80,ALPHA)')
            // REACTIVE PLATING : onde de choc AoE
            if (p.evolutions.reactive_plating) {
                const radius = 70
                const dmg = 2 + Math.max(1, Math.floor(p.damage * 0.8))
                s.explosions.push({ x: p.x, y: p.y, maxRadius: radius, life: 380, maxLife: 380, damage: dmg, hit: new Set() })
                addPopup(p.x, p.y - 22, 'SHOCKWAVE!', 'rgba(120,220,255,ALPHA)')
            }
            if (p.hp <= 0) {
                p.hp = 0
                try {
                    const raw = localStorage.getItem(LS_KEY)
                    const prev = raw ? parseInt(raw, 10) : 0
                    if (s.elapsed > prev) { localStorage.setItem(LS_KEY, String(Math.floor(s.elapsed))); setHud((h) => ({ ...h, highScore: Math.floor(s.elapsed) })) }
                } catch (_) { /* ignore */ }
                syncHud(); setPhase('over')
            }
        }

        const spawnEnemy = () => {
            const s = gsRef.current
            if (s.enemies.length >= 60) return
            const edge = Math.floor(Math.random() * 4)
            let x, y
            if (edge === 0)      { x = Math.random() * CANVAS_W; y = -12 }
            else if (edge === 1) { x = CANVAS_W + 12;            y = Math.random() * CANVAS_H }
            else if (edge === 2) { x = Math.random() * CANVAS_W; y = CANVAS_H + 12 }
            else                 { x = -12;                       y = Math.random() * CANVAS_H }
            const baseSpeed = 45 + Math.random() * 25 + Math.min(30, s.elapsed / 4000)
            const tier = 1 + Math.floor(s.elapsed / 30000)
            const pool = getEnemyPool(s.elapsed)
            const kind = pool[Math.floor(Math.random() * pool.length)]
            const isElite = Math.random() < ELITE_CHANCE
            let size = 14, speed = baseSpeed, hp = tier, xpValue = tier, shootTimer = 0
            if (kind === 'fast')    { size = 11; speed = baseSpeed * 1.55; hp = Math.max(1, Math.floor(tier * 0.7)); xpValue = tier }
            if (kind === 'tank')    { size = 20; speed = baseSpeed * 0.55; hp = tier * 3 + 2;                        xpValue = tier * 2 }
            if (kind === 'shooter') { size = 14; speed = baseSpeed * 0.75; hp = tier + 1;                            xpValue = tier + 1; shootTimer = 1800 + Math.random() * 1200 }
            if (isElite) {
                size += 3; speed *= 0.85
                hp = Math.max(hp * 2, hp + 2); xpValue *= 3
            }
            s.enemies.push({ x, y, size, speed, hp, maxHp: hp, tier, xpValue, kind, isBoss: false, isElite, pulse: Math.random() * Math.PI * 2, shootTimer })
        }

        const spawnBoss = () => {
            const s = gsRef.current
            s.bossCount += 1
            const bossType = BOSS_TYPES[(s.bossCount - 1) % BOSS_TYPES.length]
            const edge = Math.floor(Math.random() * 4)
            let x, y
            if (edge === 0)      { x = CANVAS_W / 2; y = -30 }
            else if (edge === 1) { x = CANVAS_W + 30; y = CANVAS_H / 2 }
            else if (edge === 2) { x = CANVAS_W / 2; y = CANVAS_H + 30 }
            else                 { x = -30;           y = CANVAS_H / 2 }
            const bossTier = s.bossCount
            let hpMult = 1, speedBase = 38
            if (bossType === 'SHOOTER')  { hpMult = 1.1; speedBase = 26 }
            if (bossType === 'SUMMONER') { hpMult = 1.2; speedBase = 30 }
            if (bossType === 'TROJAN')   { hpMult = 1.15; speedBase = 34 }
            const bossHp = Math.floor((30 + bossTier * 20) * hpMult)
            s.enemies.push({
                x, y, size: bossType === 'TROJAN' ? 36 : 40,
                speed: speedBase + bossTier * 4,
                hp: bossHp, maxHp: bossHp,
                tier: 10 + bossTier * 3,
                xpValue: 5 + bossTier * 3,
                isBoss: true, bossType,
                shootTimer:  bossType === 'SHOOTER'  ? 1800 : 0,
                summonTimer: bossType === 'SUMMONER' ? 4000 : 0,
                mineTimer:   bossType === 'TROJAN'   ? 2200 : 0,
                // Special moves
                specialCd: 5000,
                specialPhase: 'idle',
                specialT: 0,
                specialParity: 0,
                slamTargetX: 0, slamTargetY: 0,
                laserAngle: 0,
                dashDirX: 0, dashDirY: 0, dashSpeed: 0,
                spiralWavesLeft: 0, spiralNextIn: 0,
                teleTargetX: 0, teleTargetY: 0,
            })
            setBossAlert({ at: s.elapsed, type: bossType })
        }

        const fireVolley = () => {
            const s = gsRef.current
            if (s.enemies.length === 0) return
            let best = null, bestD = Infinity
            const rangeSq = s.player.attackRange * s.player.attackRange
            for (const e of s.enemies) {
                if (e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock' || e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in')) continue
                const dx = e.x - s.player.x, dy = e.y - s.player.y
                const d = dx * dx + dy * dy
                if (d > rangeSq) continue
                if (d < bestD) { bestD = d; best = e }
            }
            if (!best) return
            const dx = best.x - s.player.x, dy = best.y - s.player.y
            const baseAngle = Math.atan2(dy, dx)
            const spread = 0.18, n = s.player.projectiles
            const p = s.player
            for (let i = 0; i < n; i++) {
                const offset = (i - (n - 1) / 2) * spread
                const a = baseAngle + offset
                const isCrit = Math.random() < critChanceOf(p.critChance)
                const dmg = isCrit ? Math.round(p.damage * critMultOf(p.critMult)) : p.damage
                s.shotsFired += 1
                s.bullets.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(a) * p.bulletSpeed,
                    vy: Math.sin(a) * p.bulletSpeed,
                    damage: dmg, pierce: p.pierce,
                    size: 3, life: 1500, hits: new Set(),
                    crit: isCrit,
                    bouncesLeft: p.ricochet,
                    explosive: p.explosive,
                })
            }
        }

        const spawnExplosion = (x, y, damage, level) => {
            const s = gsRef.current
            const gl = s.player.evolutions.grenade_launcher ? 1 : 0
            const maxR = (32 + level * 10) * (gl ? 2 : 1)
            const dmg = damage * (gl ? 2 : 1)
            s.explosions.push({ x, y, maxRadius: maxR, life: 350, maxLife: 350, damage: dmg, hit: new Set() })
        }

        const spawnMinion = (bx, by, tier) => {
            const s = gsRef.current
            const ang = Math.random() * Math.PI * 2, rad = 26
            s.enemies.push({
                x: bx + Math.cos(ang) * rad, y: by + Math.sin(ang) * rad,
                size: 12, speed: 70 + Math.random() * 20 + Math.min(30, s.elapsed / 4000),
                hp: Math.max(1, Math.floor(tier * 0.7)), maxHp: Math.max(1, Math.floor(tier * 0.7)),
                tier: Math.max(1, Math.floor(tier * 0.7)), xpValue: Math.max(1, Math.floor(tier * 0.5)),
                kind: 'grunt', isBoss: false, isElite: false, isMinion: true, pulse: 0, shootTimer: 0,
            })
        }

        const startBossSpecial = (e) => {
            const s = gsRef.current
            // Alternance : parité 0 = SLAM (universel), parité 1 = special selon type
            const useSlam = e.specialParity % 2 === 0
            e.specialParity += 1
            if (useSlam) {
                e.specialPhase = 'slam_air'
                e.specialT = 1400 // tracking
                e.slamTargetX = s.player.x
                e.slamTargetY = s.player.y
                s.slamShadows.push({ bossRef: e, x: s.player.x, y: s.player.y, age: 0, duration: 1400, locked: false, tracking: true, radius: 42 })
            } else {
                if (e.bossType === 'SHOOTER') {
                    e.specialPhase = 'laser_charge'
                    e.specialT = 1200
                    e.laserAngle = Math.atan2(s.player.y - e.y, s.player.x - e.x)
                    s.lasers.push({ bossRef: e, x: e.x, y: e.y, angle: e.laserAngle, length: 800, phase: 'aim', age: 0, life: 1200, damage: 2 })
                } else if (e.bossType === 'CHASER') {
                    e.specialPhase = 'dash_tele'
                    e.specialT = 900
                    // target = player position (locked at start of fire)
                    s.dashTelegraphs.push({ bossRef: e, x1: e.x, y1: e.y, x2: s.player.x, y2: s.player.y, age: 0, life: 900 })
                } else if (e.bossType === 'SUMMONER') {
                    e.specialPhase = 'spiral'
                    e.specialT = 1600
                    e.spiralWavesLeft = 3
                    e.spiralNextIn = 100
                } else if (e.bossType === 'TROJAN') {
                    // TELEPORT : disparaît, réapparaît près du joueur avec burst
                    e.specialPhase = 'tele_out'
                    e.specialT = 500
                    s.teleFx.push({ x: e.x, y: e.y, life: 500, maxLife: 500 })
                    // choisir position d'arrivée à ~90 px du joueur
                    const ang = Math.random() * Math.PI * 2
                    const rad = 90 + Math.random() * 40
                    e.teleTargetX = Math.max(30, Math.min(CANVAS_W - 30, s.player.x + Math.cos(ang) * rad))
                    e.teleTargetY = Math.max(30, Math.min(CANVAS_H - 30, s.player.y + Math.sin(ang) * rad))
                }
            }
        }

        const updateBossSpecial = (e, dt) => {
            const s = gsRef.current
            e.specialT -= dt
            if (e.specialPhase === 'slam_air') {
                // Ombre suit le joueur pendant tracking
                const sh = s.slamShadows.find(x => x.bossRef === e && x.tracking)
                if (sh) {
                    sh.age += dt
                    // suit avec un peu de smoothing
                    sh.x += (s.player.x - sh.x) * Math.min(1, dt / 120)
                    sh.y += (s.player.y - sh.y) * Math.min(1, dt / 120)
                    if (e.specialT <= 0) {
                        // Verrouillage
                        sh.tracking = false
                        sh.locked = true
                        e.slamTargetX = sh.x
                        e.slamTargetY = sh.y
                        e.specialPhase = 'slam_lock'
                        e.specialT = 450
                    }
                }
            } else if (e.specialPhase === 'slam_lock') {
                if (e.specialT <= 0) {
                    // Écrasement : dégâts AoE
                    const cx = e.slamTargetX, cy = e.slamTargetY
                    const radius = 46
                    const p = s.player
                    const dx = p.x - cx, dy = p.y - cy
                    if (dx*dx + dy*dy <= radius * radius) applyDamageToPlayer(3)
                    // Explosion visuelle et téléportation du boss à l'impact
                    s.explosions.push({ x: cx, y: cy, maxRadius: radius + 4, life: 380, maxLife: 380, damage: 0, hit: new Set() })
                    e.x = cx; e.y = cy
                    // Nettoyage ombre
                    s.slamShadows = s.slamShadows.filter(sh => sh.bossRef !== e)
                    e.specialPhase = 'idle'
                    e.specialCd = 6000
                }
            } else if (e.specialPhase === 'laser_charge') {
                // Ajuste la visée pendant la charge (semi-lock)
                const la = s.lasers.find(x => x.bossRef === e && x.phase === 'aim')
                if (la) {
                    la.age += dt
                    la.x = e.x; la.y = e.y
                    const targetA = Math.atan2(s.player.y - e.y, s.player.x - e.x)
                    // interp
                    let da = targetA - la.angle
                    while (da > Math.PI) da -= Math.PI * 2
                    while (da < -Math.PI) da += Math.PI * 2
                    la.angle += da * Math.min(1, dt / 400)
                    if (e.specialT <= 0) {
                        la.phase = 'fire'
                        la.life = 700
                        la.age = 0
                        e.specialPhase = 'laser_fire'
                        e.specialT = 700
                    }
                }
            } else if (e.specialPhase === 'laser_fire') {
                const la = s.lasers.find(x => x.bossRef === e && x.phase === 'fire')
                if (la) {
                    la.age += dt
                    la.life -= dt
                    la.x = e.x; la.y = e.y
                    // Vérif contact joueur
                    if (s.player.iframes <= 0) {
                        const nx = Math.cos(la.angle), ny = Math.sin(la.angle)
                        const x2 = la.x + nx * la.length
                        const y2 = la.y + ny * la.length
                        const d = distPointToSeg(s.player.x, s.player.y, la.x, la.y, x2, y2)
                        if (d < s.player.size / 2 + 5) applyDamageToPlayer(2)
                    }
                    if (la.life <= 0) {
                        s.lasers = s.lasers.filter(x => x !== la)
                        e.specialPhase = 'idle'
                        e.specialCd = 6000
                    }
                }
            } else if (e.specialPhase === 'dash_tele') {
                const d = s.dashTelegraphs.find(x => x.bossRef === e)
                if (d) {
                    d.age += dt
                    // Actualise faiblement la cible pour "prédire"
                    d.x2 += (s.player.x - d.x2) * Math.min(1, dt / 600)
                    d.y2 += (s.player.y - d.y2) * Math.min(1, dt / 600)
                    d.x1 = e.x; d.y1 = e.y
                    if (e.specialT <= 0) {
                        const dx = d.x2 - e.x, dy = d.y2 - e.y
                        const len = Math.sqrt(dx*dx + dy*dy) || 1
                        e.dashDirX = dx / len; e.dashDirY = dy / len
                        e.dashSpeed = 620
                        s.dashTelegraphs = s.dashTelegraphs.filter(x => x !== d)
                        e.specialPhase = 'dash_go'
                        e.specialT = 550
                    }
                }
            } else if (e.specialPhase === 'dash_go') {
                e.x += e.dashDirX * e.dashSpeed * (dt / 1000)
                e.y += e.dashDirY * e.dashSpeed * (dt / 1000)
                // Contact joueur pendant le dash
                if (s.player.iframes <= 0) {
                    const dx = s.player.x - e.x, dy = s.player.y - e.y
                    const r = (e.size + s.player.size) / 2 - 2
                    if (dx*dx + dy*dy <= r*r) applyDamageToPlayer(3)
                }
                // clamp aux bordures
                e.x = Math.max(20, Math.min(CANVAS_W - 20, e.x))
                e.y = Math.max(20, Math.min(CANVAS_H - 20, e.y))
                if (e.specialT <= 0) {
                    e.specialPhase = 'idle'
e.specialPhase = 'idle'
                    e.specialCd = 6000
                }
            } else if (e.specialPhase === 'spiral') {
                e.spiralNextIn -= dt
                if (e.spiralWavesLeft > 0 && e.spiralNextIn <= 0) {
                    e.spiralWavesLeft -= 1
                    e.spiralNextIn = 500
                    const bulletsN = 14
                    const rot = (3 - e.spiralWavesLeft) * 0.22
                    for (let k = 0; k < bulletsN; k++) {
                        const a = (Math.PI * 2 * k) / bulletsN + rot
                        s.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, size: 4, life: 4200 })
                    }
                }
                if (e.specialT <= 0 && e.spiralWavesLeft <= 0) {
                    e.specialPhase = 'idle'
                    e.specialCd = 6000
                }
            } else if (e.specialPhase === 'tele_out') {
                if (e.specialT <= 0) {
                    // Téléportation
                    e.x = e.teleTargetX; e.y = e.teleTargetY
                    s.teleFx.push({ x: e.x, y: e.y, life: 500, maxLife: 500 })
                    e.specialPhase = 'tele_in'
                    e.specialT = 350
                }
            } else if (e.specialPhase === 'tele_in') {
                if (e.specialT <= 0) {
                    // Burst 8 tirs en croix + X
                    for (let k = 0; k < 8; k++) {
                        const a = (Math.PI * 2 * k) / 8
                        s.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, size: 4, life: 3800 })
                    }
                    e.specialPhase = 'idle'
                    e.specialCd = 6000
                }
            }
        }

        const update = (dt) => {
            const s = gsRef.current
            if (phase !== 'playing') return
            s.elapsed += dt
            s.spawnRateTimer += dt
            if (s.spawnRateTimer >= 15000) { s.spawnRateTimer -= 15000; s.spawnRate = Math.max(300, s.spawnRate - 50) }
            const effectiveSpawnRate = s.elapsed < EARLY_GAME_DURATION ? s.spawnRate * EARLY_SPAWN_MULT : s.spawnRate
            s.spawnTimer += dt
            while (s.spawnTimer >= effectiveSpawnRate) { s.spawnTimer -= effectiveSpawnRate; spawnEnemy() }
            if (s.elapsed >= s.nextBossAt) { spawnBoss(); s.nextBossAt += BOSS_INTERVAL }

            const p = s.player
            let vx = 0, vy = 0
            if (s.keys.up) vy -= 1
            if (s.keys.down) vy += 1
            if (s.keys.left) vx -= 1
            if (s.keys.right) vx += 1
            if (vx !== 0 || vy !== 0) { const len = Math.sqrt(vx*vx + vy*vy); vx /= len; vy /= len }
            p.x += vx * p.speed * (dt / 1000); p.y += vy * p.speed * (dt / 1000)
            const half = p.size / 2
            p.x = Math.max(half, Math.min(CANVAS_W - half, p.x))
            p.y = Math.max(half, Math.min(CANVAS_H - half, p.y))
            if (p.iframes > 0) p.iframes = Math.max(0, p.iframes - dt)
            p.fireTimer -= dt
            if (p.fireTimer <= 0) { fireVolley(); p.fireTimer = p.fireCooldown }

            // Régénération passive
            if (p.regen > 0 && p.hp < p.maxHp) {
                p.regenAccum += (p.regen * 0.15) * (dt / 1000)
                if (p.regenAccum >= 1) {
                    const heal = Math.floor(p.regenAccum)
                    p.regenAccum -= heal
                    p.hp = Math.min(p.maxHp, p.hp + heal)
                    addPopup(p.x, p.y - 12, `+${heal}`, 'rgba(100,255,140,ALPHA)')
                }
            }

            // Mise à jour popups
            for (let i = 0; i < p.popups.length; i++) {
                const pop = p.popups[i]
                pop.life -= dt
                pop.y += pop.vy * (dt / 1000)
                if (pop.life <= 0) { p.popups.splice(i, 1); i-- }
            }

            for (const e of s.enemies) {
                // Mise à jour des specials boss (avant le mouvement standard)
                if (e.isBoss) {
                    if (e.specialPhase === 'idle') {
                        e.specialCd -= dt
                        if (e.specialCd <= 0) startBossSpecial(e)
                    } else {
                        updateBossSpecial(e, dt)
                    }
                }
                // Mouvement standard désactivé pendant SLAM (en l'air) et DASH
                const inAir = e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock')
                const inDashGo = e.isBoss && e.specialPhase === 'dash_go'
                const inLaserFire = e.isBoss && (e.specialPhase === 'laser_fire' || e.specialPhase === 'laser_charge')
                if (!inAir && !inDashGo) {
                    const ex = p.x - e.x, ey = p.y - e.y
                    const d = Math.sqrt(ex*ex + ey*ey) || 1
                    let speedMult = 1
                    if (e.isBoss && e.bossType === 'SHOOTER' && d < 220) speedMult = 0.35
                    if (!e.isBoss && e.kind === 'shooter' && d < 200) speedMult = 0.5
                    if (inLaserFire) speedMult *= 0.2
                    e.x += (ex / d) * e.speed * speedMult * (dt / 1000)
                    e.y += (ey / d) * e.speed * speedMult * (dt / 1000)
                }
                if (e.isElite) e.pulse = (e.pulse || 0) + dt / 140
                if (!e.isBoss && e.kind === 'shooter') {
                    e.shootTimer -= dt
                    if (e.shootTimer <= 0) {
                        const ddx = p.x - e.x, ddy = p.y - e.y
                        const d2 = ddx*ddx + ddy*ddy
                        if (d2 < 260 * 260) {
                            e.shootTimer = 1900 + Math.random() * 600
                            const ang = Math.atan2(ddy, ddx)
                            s.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 140, vy: Math.sin(ang) * 140, size: 3, life: 3200 })
                        }
                    }
                }
                if (e.isBoss && e.specialPhase === 'idle') {
                    if (e.bossType === 'SHOOTER') {
                        e.shootTimer -= dt
                        if (e.shootTimer <= 0) {
                            e.shootTimer = 1400
                            const baseAng = Math.atan2(p.y - e.y, p.x - e.x)
                            for (let k = -2; k <= 2; k++) {
                                const a = baseAng + k * 0.22
                                s.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, size: 4, life: 4000 })
                            }
                        }
                    } else if (e.bossType === 'SUMMONER') {
                        e.summonTimer -= dt
                        if (e.summonTimer <= 0) {
                            e.summonTimer = 3800
                            const tier = 1 + Math.floor(s.elapsed / 30000)
                            for (let k = 0; k < 3; k++) spawnMinion(e.x, e.y, tier)
                        }
                    } else if (e.bossType === 'TROJAN') {
                        e.mineTimer -= dt
                        if (e.mineTimer <= 0) {
                            e.mineTimer = 2200
                            s.mines.push({ x: e.x, y: e.y, life: 8000, maxLife: 8000, armAt: 500, age: 0, damage: 2, radius: 34 })
                        }
                    }
                }
            }

            const newEnemyBullets = []
            for (const eb of s.enemyBullets) {
                eb.x += eb.vx * (dt/1000); eb.y += eb.vy * (dt/1000); eb.life -= dt
                if (eb.life <= 0 || eb.x < -20 || eb.x > CANVAS_W + 20 || eb.y < -20 || eb.y > CANVAS_H + 20) continue
                if (p.iframes <= 0) {
                    const dx = eb.x - p.x, dy = eb.y - p.y
                    const r = p.size / 2 + eb.size
                    if (dx*dx + dy*dy <= r*r) {
                        applyDamageToPlayer(1)
                        continue
                    }
                }
                newEnemyBullets.push(eb)
            }
            s.enemyBullets = newEnemyBullets

            // Explosions actives : dégâts + expire
            for (let i = 0; i < s.explosions.length; i++) {
                const ex = s.explosions[i]
                ex.life -= dt
                if (ex.damage > 0) {
                    const prog = 1 - (ex.life / ex.maxLife)
                    const r = ex.maxRadius * (0.4 + 0.6 * prog)
                    for (let j = 0; j < s.enemies.length; j++) {
                        const en = s.enemies[j]
                        if (ex.hit.has(en)) continue
                        const dx = en.x - ex.x, dy = en.y - ex.y
                        if (dx*dx + dy*dy <= r*r) {
                            en.hp -= ex.damage
                            ex.hit.add(en)
                            if (en.hp <= 0 && !en.isBoss) {
                                // kill par explosion : loot standard, pas de chaîne infinie
                                const dead = en
                                s.enemies.splice(j, 1); j--
                                s.kills += 1
                                if (dead.isElite) {
                                    s.xpOrbs.push({ x: dead.x, y: dead.y, size: 7, value: dead.xpValue })
                                    s.upgradeTokens.push({ x: dead.x, y: dead.y, life: 25000, pulse: 0 })
                                } else {
                                    s.xpOrbs.push({ x: dead.x, y: dead.y, size: dead.xpValue >= 3 ? 6 : 5, value: dead.xpValue })
                                    if (Math.random() < HP_DROP_CHANCE * luckDropMult(p.luck)) s.hpDrops.push({ x: dead.x, y: dead.y, size: 9, life: 12000, pulse: 0 })
                                }
                            }
                        }
                    }
                }
                if (ex.life <= 0) { s.explosions.splice(i, 1); i-- }
            }

            // Contact ennemi ↔ joueur (avec thorns)
            if (p.iframes <= 0) {
                for (const e of s.enemies) {
                    if (e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock' || e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in')) continue
                    const dx = e.x - p.x, dy = e.y - p.y
                    const r = (e.size + p.size) / 2 - 2
                    if (dx*dx + dy*dy <= r*r) {
                        applyDamageToPlayer(e.isBoss ? 2 : 1)
                        // Thorns
                        if (p.thorns > 0 && !e.isBoss) {
                            const refl = p.thorns * 0.5
                            e.hp -= refl
                            if (e.hp <= 0) e._killedByThorns = true
                        }
                        break
                    }
                }
                // Purge ennemis tués par thorns
                for (let i = 0; i < s.enemies.length; i++) {
                    const en = s.enemies[i]
                    if (en._killedByThorns) {
                        s.enemies.splice(i, 1); i--
                        s.kills += 1
                        s.xpOrbs.push({ x: en.x, y: en.y, size: 5, value: en.xpValue })
                    }
                }
            }

            const newBullets = []
            for (const b of s.bullets) {
                b.x += b.vx * (dt/1000); b.y += b.vy * (dt/1000); b.life -= dt
                if (b.life <= 0 || b.x < -20 || b.x > CANVAS_W + 20 || b.y < -20 || b.y > CANVAS_H + 20) continue
                let consumed = false
                for (let i = 0; i < s.enemies.length; i++) {
                    const e = s.enemies[i]
                    if (b.hits.has(e)) continue
                    if (e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock' || e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in')) continue
                    const dx = e.x - b.x, dy = e.y - b.y
                    const r = e.size / 2 + b.size
                    if (dx*dx + dy*dy <= r*r) {
                        e.hp -= b.damage; b.hits.add(e)
                        s.totalDamage += b.damage
                        if (b.crit) { s.critHits += 1; addPopup(e.x, e.y - 10, `${b.damage}!`, 'rgba(255,120,200,ALPHA)') }
                        if (e.hp <= 0) {
                            const dead = e
                            s.enemies.splice(i, 1); i--
                            s.kills += 1
                            if (dead.isBoss && s.bossKills[dead.bossType] !== undefined) s.bossKills[dead.bossType] += 1
                            if (dead.isElite) s.eliteKills += 1
                            // Explosion à la mort
                            if (b.explosive > 0 && !dead.isBoss) {
                                spawnExplosion(dead.x, dead.y, Math.max(1, Math.floor(p.damage * (0.6 + 0.2 * b.explosive))), b.explosive)
                            } else if (b.explosive > 0 && dead.isBoss) {
                                // Boss : simple visuel, pas de dégâts en chaîne
                                s.explosions.push({ x: dead.x, y: dead.y, maxRadius: 60, life: 500, maxLife: 500, damage: 0, hit: new Set() })
                            }
                            // Life steal
                            if (p.lifeSteal > 0 && Math.random() < (lifeStealChance(p.lifeSteal) + (p.evolutions.bio_reactor ? 0.3 : 0))) {
                                if (p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + 1); addPopup(p.x, p.y - 12, '+1', 'rgba(200,120,255,ALPHA)') }
                            }
                            if (dead.isBoss) {
                                // Nettoie les effets de special du boss
                                s.slamShadows = s.slamShadows.filter(sh => sh.bossRef !== dead)
                                s.lasers = s.lasers.filter(la => la.bossRef !== dead)
                                s.dashTelegraphs = s.dashTelegraphs.filter(dt2 => dt2.bossRef !== dead)
                                const orbCount = 6 + Math.min(6, dead.tier)
                                const perOrb = Math.max(1, Math.floor(dead.xpValue / 3))
                                for (let k = 0; k < orbCount; k++) {
                                    const ang = Math.random() * Math.PI * 2, rad = 8 + Math.random() * 24
                                    s.xpOrbs.push({ x: dead.x + Math.cos(ang) * rad, y: dead.y + Math.sin(ang) * rad, size: 6, value: perOrb })
                                }
                                s.hpDrops.push({ x: dead.x, y: dead.y, size: 10, life: 20000, pulse: 0 })
                                s.upgradeTokens.push({ x: dead.x, y: dead.y, life: 30000, pulse: 0 })
                            } else if (dead.isElite) {
                                s.xpOrbs.push({ x: dead.x, y: dead.y, size: 7, value: dead.xpValue })
                                s.upgradeTokens.push({ x: dead.x, y: dead.y, life: 25000, pulse: 0 })
                                if (Math.random() < 0.35 * luckDropMult(p.luck)) s.hpDrops.push({ x: dead.x + 12, y: dead.y, size: 9, life: 12000, pulse: 0 })
                            } else {
                                s.xpOrbs.push({ x: dead.x, y: dead.y, size: dead.xpValue >= 3 ? 6 : 5, value: dead.xpValue })
                                if (Math.random() < HP_DROP_CHANCE * luckDropMult(p.luck)) s.hpDrops.push({ x: dead.x, y: dead.y, size: 9, life: 12000, pulse: 0 })
                            }
                        }
                        // Ricochet en priorité, sinon pierce
                        if (b.bouncesLeft > 0) {
                            // Cherche la cible la plus proche non encore touchée dans un rayon
                            let target = null, bestD = Infinity
                            const searchR = 140
                            for (const e2 of s.enemies) {
                                if (b.hits.has(e2)) continue
                                if (e2.isBoss && (e2.specialPhase === 'slam_air' || e2.specialPhase === 'slam_lock' || e2.specialPhase === 'tele_out' || e2.specialPhase === 'tele_in')) continue
                                const dx2 = e2.x - b.x, dy2 = e2.y - b.y
                                const d2 = dx2*dx2 + dy2*dy2
                                if (d2 > searchR * searchR) continue
                                if (d2 < bestD) { bestD = d2; target = e2 }
                            }
                            if (target) {
                                const dx2 = target.x - b.x, dy2 = target.y - b.y
                                const na = Math.atan2(dy2, dx2)
                                const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy)
                                b.vx = Math.cos(na) * spd; b.vy = Math.sin(na) * spd
                                b.bouncesLeft -= 1
                                b.life = Math.max(b.life, 900)
                            } else if (b.pierce > 0) { b.pierce -= 1 } else { consumed = true; break }
                        } else if (b.pierce > 0) { b.pierce -= 1 } else { consumed = true; break }
                    }
                }
                if (!consumed) newBullets.push(b)
            }
            s.bullets = newBullets

            // === ÉVOLUTIONS : effets actifs ===
            const evo = p.evolutions
            // Bio Reactor : régén ×2 (application dans le bloc régen déjà) — on double simplement le heal
            if (evo.bio_reactor && p.regen > 0 && p.hp < p.maxHp) {
                p.regenAccum += (p.regen * 0.15) * (dt / 1000) // bonus supplémentaire (double)
                if (p.regenAccum >= 1) {
                    const heal = Math.floor(p.regenAccum)
                    p.regenAccum -= heal
                    p.hp = Math.min(p.maxHp, p.hp + heal)
                }
            }
            // Gatling Burst : salve 360° toutes les 5s
            if (evo.gatling_burst) {
                p.gatlingTimer -= dt
                if (p.gatlingTimer <= 0) {
                    p.gatlingTimer = 5000
                    const N = 16
                    for (let k = 0; k < N; k++) {
                        const a = (Math.PI * 2 * k) / N
                        s.bullets.push({
                            x: p.x, y: p.y,
                            vx: Math.cos(a) * p.bulletSpeed * 0.9,
                            vy: Math.sin(a) * p.bulletSpeed * 0.9,
                            damage: Math.max(1, Math.floor(p.damage * 0.8)),
                            pierce: 1, size: 3, life: 1200, hits: new Set(),
                            crit: false, bouncesLeft: 0, explosive: 0,
                        })
                    }
                }
            }
            // Railgun : rail perce-tout crit toutes les 4s
            if (evo.railgun) {
                p.railgunTimer -= dt
                if (p.railgunTimer <= 0) {
                    p.railgunTimer = 4000
                    // Cible = ennemi le plus lointain visible (dans une range x2)
                    let target = null, bestD = -1
                    const rMax = p.attackRange * 2
                    for (const e of s.enemies) {
                        if (e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock' || e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in')) continue
                        const dx = e.x - p.x, dy = e.y - p.y
                        const d = dx*dx + dy*dy
                        if (d > rMax * rMax) continue
                        if (d > bestD) { bestD = d; target = e }
                    }
                    if (target) {
                        const a = Math.atan2(target.y - p.y, target.x - p.x)
                        s.bullets.push({
                            x: p.x, y: p.y,
                            vx: Math.cos(a) * p.bulletSpeed * 2.4,
                            vy: Math.sin(a) * p.bulletSpeed * 2.4,
                            damage: Math.round((p.damage + 2) * critMultOf(Math.max(1, p.critMult))),
                            pierce: 99, size: 4, life: 1400, hits: new Set(),
                            crit: true, bouncesLeft: 0, explosive: 0,
                        })
                        addPopup(p.x, p.y - 18, 'RAILGUN!', 'rgba(255,120,255,ALPHA)')
                    }
                }
            }
            // Orbital Drones : rotation + tir
            if (evo.orbital_drones && p.drones.length > 0) {
                for (const dr of p.drones) {
                    dr.angle = (dr.angle || 0) + dt / 600
                    const rad = 42
                    dr.x = p.x + Math.cos(dr.angle) * rad
                    dr.y = p.y + Math.sin(dr.angle) * rad
                    dr.fireT = (dr.fireT || 0) - dt
                    if (dr.fireT <= 0) {
                        dr.fireT = p.fireCooldown * 1.4
                        // Cible = ennemi le plus proche
                        let best = null, bestD = Infinity
                        for (const e of s.enemies) {
                            if (e.isBoss && (e.specialPhase === 'slam_air' || e.specialPhase === 'slam_lock' || e.specialPhase === 'tele_out' || e.specialPhase === 'tele_in')) continue
                            const dx = e.x - dr.x, dy = e.y - dr.y
                            const d = dx*dx + dy*dy
                            if (d > (p.attackRange * 1.2) * (p.attackRange * 1.2)) continue
                            if (d < bestD) { bestD = d; best = e }
                        }
                        if (best) {
                            const a = Math.atan2(best.y - dr.y, best.x - dr.x)
                            s.bullets.push({
                                x: dr.x, y: dr.y,
                                vx: Math.cos(a) * p.bulletSpeed,
                                vy: Math.sin(a) * p.bulletSpeed,
                                damage: Math.max(1, Math.floor(p.damage * 0.7)),
                                pierce: 0, size: 3, life: 1400, hits: new Set(),
                                crit: false, bouncesLeft: 0, explosive: 0,
                            })
                        }
                    }
                }
            }

            // Mines actives (posées par TROJAN)
            for (let i = 0; i < s.mines.length; i++) {
                const m = s.mines[i]
                m.life -= dt; m.age += dt
                if (m.armAt > 0) m.armAt -= dt
                const armed = m.armAt <= 0
                let exploded = false
                if (armed) {
                    const dx = p.x - m.x, dy = p.y - m.y
                    if (dx*dx + dy*dy <= 14 * 14) exploded = true
                }
                if (m.life <= 0) exploded = true
                if (exploded) {
                    s.explosions.push({ x: m.x, y: m.y, maxRadius: m.radius, life: 400, maxLife: 400, damage: 0, hit: new Set() })
                    if (p.iframes <= 0) {
                        const dx = p.x - m.x, dy = p.y - m.y
                        if (dx*dx + dy*dy <= m.radius * m.radius) applyDamageToPlayer(m.damage)
                    }
                    s.mines.splice(i, 1); i--
                }
            }

            // Effets de téléport (visuels seulement)
            for (let i = 0; i < s.teleFx.length; i++) {
                const tf = s.teleFx[i]
                tf.life -= dt
                if (tf.life <= 0) { s.teleFx.splice(i, 1); i-- }
            }
            // Bannières d'évolution
            for (let i = 0; i < s.evoBanners.length; i++) {
                const eb = s.evoBanners[i]
                eb.life -= dt
                if (eb.life <= 0) { s.evoBanners.splice(i, 1); i-- }
            }

            // XP orbs
            for (let i = 0; i < s.xpOrbs.length; i++) {
                const o = s.xpOrbs[i]
                const dx = p.x - o.x, dy = p.y - o.y, d2 = dx*dx + dy*dy
                const pullR = p.magnetPull, detectR = p.magnetRange
                if (d2 <= pullR * pullR) {
                    const d = Math.sqrt(d2) || 1
                    const pull = 320 + (1 - d / pullR) * 400
                    o.x += (dx / d) * pull * (dt/1000); o.y += (dy / d) * pull * (dt/1000)
                } else if (d2 <= detectR * detectR) {
                    const d = Math.sqrt(d2) || 1
                    o.x += (dx / d) * 120 * (dt/1000); o.y += (dy / d) * 120 * (dt/1000)
                }
                const pr = p.size / 2 + o.size
                if (dx*dx + dy*dy <= pr*pr) {
                    const gained = Math.max(1, Math.round(o.value * xpBoostMult(p.xpBoost)))
                    s.xp += gained
                    s.xpOrbs.splice(i, 1); i--
                    while (s.xp >= s.xpToNext) { s.xp -= s.xpToNext; s.level += 1; s.xpToNext = xpForNextLevel(s.level); s.pendingLevelUps += 1 }
                    if (s.pendingLevelUps > 0) openUpgradeMenu()
                }
            }

            for (let i = 0; i < s.hpDrops.length; i++) {
                const h = s.hpDrops[i]
                h.life -= dt; h.pulse += dt / 120
                if (h.life <= 0) { s.hpDrops.splice(i, 1); i--; continue }
                const dx = p.x - h.x, dy = p.y - h.y
                const pr = p.size / 2 + h.size / 2
                if (dx*dx + dy*dy <= pr*pr) {
                    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 1)
                    s.hpDrops.splice(i, 1); i--
                }
            }

            for (let i = 0; i < s.upgradeTokens.length; i++) {
                const t = s.upgradeTokens[i]
                t.life -= dt; t.pulse += dt / 200
                if (t.life <= 0) { s.upgradeTokens.splice(i, 1); i--; continue }
                const dx = p.x - t.x, dy = p.y - t.y, d2 = dx*dx + dy*dy
                if (d2 <= 60 * 60) {
                    const d = Math.sqrt(d2) || 1
                    t.x += (dx / d) * 200 * (dt/1000); t.y += (dy / d) * 200 * (dt/1000)
                }
                const pr = p.size / 2 + 10
                if (dx*dx + dy*dy <= pr*pr) {
                    s.upgradeTokens.splice(i, 1); i--
                    s.pendingLevelUps += 1
                    openUpgradeMenu()
                }
            }
        }

        const render = () => {
            const s = gsRef.current
            for (let row = 0; row < CANVAS_H / 20; row++) {
                for (let col = 0; col < CANVAS_W / 20; col++) {
                    ctx.fillStyle = (row + col) % 2 === 0 ? '#008080' : '#007070'
                    ctx.fillRect(col * 20, row * 20 + HUD_H, 20, 20)
                }
            }
            const p = s.player
            ctx.strokeStyle = 'rgba(255,255,255,0.06)'
            ctx.beginPath(); ctx.arc(p.x, p.y, p.magnetRange, 0, Math.PI * 2); ctx.stroke()
            ctx.strokeStyle = 'rgba(255,255,128,0.16)'
            ctx.setLineDash([4, 4])
            ctx.beginPath(); ctx.arc(p.x, p.y, p.attackRange, 0, Math.PI * 2); ctx.stroke()
            ctx.setLineDash([])
            for (const o of s.xpOrbs)  drawDiamond(ctx, o)
            for (const h of s.hpDrops) drawHpDrop(ctx, h)
            for (const t of s.upgradeTokens) drawUpgradeToken(ctx, t)
            for (const m of s.mines) drawMine(ctx, m)
            for (const tf of s.teleFx) drawTeleFx(ctx, tf)
            for (const sh of s.slamShadows) drawSlamShadow(ctx, sh)
            for (const d of s.dashTelegraphs) drawDashTele(ctx, d)
            for (const e of s.enemies) { if (e.isBoss) drawBoss(ctx, e); else drawVirus(ctx, e) }
            for (const eb of s.enemyBullets) drawEnemyBullet(ctx, eb)
            for (const b of s.bullets) drawBullet(ctx, b)
            for (const la of s.lasers) drawLaser(ctx, la)
            for (const ex of s.explosions) drawExplosion(ctx, ex)
            drawPlayer(ctx, p)
            if (p.evolutions.orbital_drones) {
                for (const dr of p.drones) drawDrone(ctx, dr)
            }
            drawPopups(ctx, p.popups)
        }

        const loop = (ts) => {
            if (!lastTsRef.current) lastTsRef.current = ts
            let dt = ts - lastTsRef.current
            lastTsRef.current = ts
            if (dt > 100) dt = 100
            update(dt); render()
            hudTickRef.current += dt
            if (hudTickRef.current >= 100) { hudTickRef.current = 0; syncHud() }
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }, [phase, openUpgradeMenu, syncHud])

    const xpPct = Math.min(1, hud.xp / Math.max(1, hud.xpToNext))
    const showBossAlert = bossAlert.at > 0 && (hud.elapsed - bossAlert.at) < 3000
    const bossAlertLabel = bossAlert.type === 'SHOOTER' ? 'BLUE SCREEN'
                         : bossAlert.type === 'SUMMONER' ? 'SPAWN.EXE'
                         : bossAlert.type === 'TROJAN'   ? 'TROJAN.EXE'
                         : bossAlert.type === 'CHASER'   ? 'SYSTEM HALT' : 'BOSS'
    const currentEvoBanner = gsRef.current?.evoBanners?.[0]

    return (
        <div className="virus-survivors">
            <div className="virus-survivors__score-bar">
                <span className="virus-survivors__score-bar-item">Niveau : <b>{hud.level}</b></span>
                <div className="virus-survivors__xp">
                    <div className="virus-survivors__xp-bar">
                        <div className="virus-survivors__xp-fill" style={{ width: `${xpPct * 100}%` }} />
                    </div>
                    <span className="virus-survivors__xp-text">{hud.xp}/{hud.xpToNext}</span>
                </div>
                <span className="virus-survivors__score-bar-item">
                    PV :
                    <span className="virus-survivors__hearts" aria-label={`HP ${hud.hp}/${hud.maxHp}`}>
                        {Array.from({ length: hud.maxHp }).map((_, i) => (
                            <span key={i} className={`virus-survivors__heart${i < hud.hp ? ' virus-survivors__heart--on' : ''}`} />
                        ))}
                    </span>
                </span>
                <span className="virus-survivors__score-bar-item">Temps : <b>{formatTime(hud.elapsed)}</b></span>
                <span className="virus-survivors__score-bar-item">Record : <b>{formatTime(hud.highScore)}</b></span>
                {phase === 'playing' && (<span className="virus-survivors__score-bar-item virus-survivors__score-bar-item--playing">▶ EN JEU</span>)}
                {phase === 'paused'  && (<span className="virus-survivors__score-bar-item virus-survivors__score-bar-item--paused">⏸ PAUSE</span>)}
            </div>

            <div className="virus-survivors__canvas-wrapper">
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="virus-survivors__canvas" data-testid="virus-survivors-canvas" />

                {showBossAlert && phase === 'playing' && (
                    <div className="virus-survivors__boss-alert" data-testid="vs-boss-alert">⚠ {bossAlertLabel} INCOMING ⚠</div>
                )}

                {currentEvoBanner && phase === 'playing' && (
                    <div className="virus-survivors__evo-banner" data-testid="vs-evo-banner">★ {currentEvoBanner.text} ★</div>
                )}

                {phase === 'menu' && (
                    <div className="virus-survivors__overlay" data-testid="vs-menu">
                        <div className="virus-survivors__dialog">
                            <div className="virus-survivors__dialog-title">VirusSurvivors.exe</div>
                            <div className="virus-survivors__dialog-body">
                                <p className="virus-survivors__dialog-text">
                                    Survivez le plus longtemps possible. Tir <b>automatique</b> sur l’ennemi le plus proche dans la portée.<br />
                                    Déplacement : <b>ZQSD / WASD / flèches</b><br />
                                    <b>Espace</b> pause · <b>Échap</b> menu<br />
                                    Ennemis forts = plus d’XP · 7% de drop <b>HP</b><br />
                                    <b>Élites dorés</b> : lâchent une <b>étoile d’amélioration</b><br />
                                    <b>BOSS</b> toutes les 5 min · 4 variantes avec <b>special moves</b><br />
                                    Combine 2 stats <b>MAX</b> = <b>ÉVOLUTION</b> (super-arme)
                                </p>
                                <button className="virus-survivors__btn virus-survivors__btn--primary" onClick={startGame} data-testid="vs-start-btn">Nouvelle partie</button>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'levelup' && (
                    <div className="virus-survivors__overlay" data-testid="vs-levelup">
                        <div className="virus-survivors__dialog virus-survivors__dialog--wide">
                            <div className="virus-survivors__dialog-title">LEVEL UP — Choisissez une amélioration (Niveau {hud.level})</div>
                            <div className="virus-survivors__dialog-body">
                                <div className="virus-survivors__upgrades">
                                    {choices.map((u, i) => {
                                        const cur = (gsRef.current?.pickedUpgrades?.[u.id]) || 0
                                        return (
                                            <button key={u.id + i} className="virus-survivors__upgrade-card" onClick={() => pickUpgrade(i)} data-testid={`vs-upgrade-${i}`}>
                                                <span className="virus-survivors__upgrade-index">[{i + 1}]</span>
                                                <span className="virus-survivors__upgrade-name">{u.name}</span>
                                                <span className="virus-survivors__upgrade-desc">{u.desc}</span>
                                                <span className="virus-survivors__upgrade-level">Niv. {cur} → {cur + 1} / {UPGRADE_CAP}</span>
                                                <span className="virus-survivors__upgrade-hint">Touche {i + 1} ou clic</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'paused' && (
                    <div className="virus-survivors__overlay" data-testid="vs-paused">
                        <div className="virus-survivors__dialog virus-survivors__dialog--wide">
                            <div className="virus-survivors__dialog-title">PAUSE — Progression</div>
                            <div className="virus-survivors__dialog-body">
                                <div className="virus-survivors__loadout" data-testid="vs-loadout">
                                    {UPGRADES.map(u => {
                                        const lvl = (gsRef.current?.pickedUpgrades?.[u.id]) || 0
                                        const maxed = lvl >= UPGRADE_CAP
                                        return (
                                            <div key={u.id} className={`virus-survivors__loadout-row${maxed ? ' virus-survivors__loadout-row--maxed' : ''}${lvl === 0 ? ' virus-survivors__loadout-row--empty' : ''}`} data-testid={`vs-loadout-${u.id}`}>
                                                <span className="virus-survivors__loadout-name">{u.name}</span>
                                                <span className="virus-survivors__loadout-pips">
                                                    {Array.from({ length: UPGRADE_CAP }).map((_, i) => (
                                                        <span key={i} className={`virus-survivors__loadout-pip${i < lvl ? ' virus-survivors__loadout-pip--on' : ''}${maxed ? ' virus-survivors__loadout-pip--maxed' : ''}`} />
                                                    ))}
                                                </span>
                                                <span className="virus-survivors__loadout-count">{lvl}/{UPGRADE_CAP}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="virus-survivors__evolutions-panel" data-testid="vs-evolutions-panel">
                                    <div className="virus-survivors__evolutions-title">ÉVOLUTIONS</div>
                                    {EVOLUTIONS.map(evo => {
                                        const unlocked = !!(gsRef.current?.player?.evolutions?.[evo.id])
                                        const p = gsRef.current?.pickedUpgrades || {}
                                        const progress = evo.req.map(r => Math.min(UPGRADE_CAP, p[r] || 0))
                                        return (
                                            <div key={evo.id} className={`virus-survivors__evo-row${unlocked ? ' virus-survivors__evo-row--unlocked' : ''}`} data-testid={`vs-evo-${evo.id}`}>
                                                <span className="virus-survivors__evo-name">{unlocked ? '★ ' : ''}{evo.name}</span>
                                                <span className="virus-survivors__evo-req">{evo.req.map((r, i) => {
                                                    const u = UPGRADES.find(x => x.id === r)
                                                    return `${u ? u.name : r} ${progress[i]}/${UPGRADE_CAP}`
                                                }).join(' + ')}</span>
                                                <span className="virus-survivors__evo-desc">{evo.desc}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="virus-survivors__btn-row">
                                    <button className="virus-survivors__btn virus-survivors__btn--primary" onClick={() => { lastTsRef.current = 0; setPhase('playing') }} data-testid="vs-resume-btn">Reprendre</button>
                                    <button className="virus-survivors__btn" onClick={backToMenu}>Menu</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'over' && (
                    <div className="virus-survivors__overlay" data-testid="vs-gameover">
                        <div className="virus-survivors__dialog virus-survivors__dialog--wide">
                            <div className="virus-survivors__dialog-title virus-survivors__dialog-title--danger">SYSTEM ERROR — Vous êtes mort</div>
                            <div className="virus-survivors__dialog-body">
                                <p className="virus-survivors__dialog-text">
                                    Temps survécu : <b>{formatTime(hud.elapsed)}</b> · Niveau : <b>{hud.level}</b> · Kills : <b>{hud.kills}</b><br />
                                    Record : <b>{formatTime(hud.highScore)}</b>
                                    {hud.elapsed >= hud.highScore && hud.elapsed > 0 && (
                                        <span className="virus-survivors__dialog-record"> — Nouveau record !</span>
                                    )}
                                </p>
                                {(() => {
                                    const s = gsRef.current
                                    const dmg = s?.totalDamage || 0
                                    const secs = Math.max(1, (s?.elapsed || 0) / 1000)
                                    const dps = (dmg / secs).toFixed(1)
                                    const acc = s?.shotsFired ? Math.round(100 * (s.kills / s.shotsFired)) : 0
                                    const bk = s?.bossKills || {}
                                    const bossTotal = (bk.CHASER || 0) + (bk.SHOOTER || 0) + (bk.SUMMONER || 0) + (bk.TROJAN || 0)
                                    const evos = s?.evoUnlocked || []
                                    return (
                                        <div className="virus-survivors__stats" data-testid="vs-final-stats">
                                            <div className="virus-survivors__stats-grid">
                                                <div><span>DPS moyen</span><b>{dps}</b></div>
                                                <div><span>Dégâts totaux</span><b>{dmg}</b></div>
                                                <div><span>Tirs</span><b>{s?.shotsFired || 0}</b></div>
                                                <div><span>Kills / tir</span><b>{acc}%</b></div>
                                                <div><span>Coups critiques</span><b>{s?.critHits || 0}</b></div>
                                                <div><span>Élites tués</span><b>{s?.eliteKills || 0}</b></div>
                                            </div>
                                            <div className="virus-survivors__stats-section">
                                                <div className="virus-survivors__stats-title">Boss vaincus ({bossTotal})</div>
                                                <div className="virus-survivors__stats-bosses">
                                                    <span data-testid="vs-stats-chaser">CHASER : <b>{bk.CHASER || 0}</b></span>
                                                    <span data-testid="vs-stats-shooter">SHOOTER : <b>{bk.SHOOTER || 0}</b></span>
                                                    <span data-testid="vs-stats-summoner">SUMMONER : <b>{bk.SUMMONER || 0}</b></span>
                                                    <span data-testid="vs-stats-trojan">TROJAN : <b>{bk.TROJAN || 0}</b></span>
                                                </div>
                                            </div>
                                            <div className="virus-survivors__stats-section">
                                                <div className="virus-survivors__stats-title">Évolutions débloquées ({evos.length}/{EVOLUTIONS.length})</div>
                                                <div className="virus-survivors__stats-evos" data-testid="vs-stats-evos">
                                                    {evos.length === 0
                                                        ? <span className="virus-survivors__stats-empty">— Aucune —</span>
                                                        : evos.map((e, i) => <span key={i} className="virus-survivors__stats-evo-chip">★ {e}</span>)
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                                <div className="virus-survivors__btn-row">
                                    <button className="virus-survivors__btn virus-survivors__btn--primary" onClick={restart} data-testid="vs-restart-btn">Rejouer [R]</button>
                                    <button className="virus-survivors__btn" onClick={backToMenu}>Menu</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="virus-survivors__status-bar">
                <span>{phase === 'playing' ? `Ennemis : ${gsRef.current?.enemies?.length ?? 0} · Kills : ${hud.kills}` : 'Prêt'}</span>
                <span>VIRUS SURVIVORS v1.4</span>
            </div>
        </div>
    )
}