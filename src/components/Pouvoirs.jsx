import { useEffect, useState } from 'react'
import '../styles/Pouvoirs.scss'
import pouvoirsData from '../data/pouvoirs.json'

// ─── DATA ────────────────────────────────────────────────────────
const {
    hero: HERO,
    power: POWER,
    stats: STATS,
    hp: HP,
    energy: ENERGY,
    spells: SPELLS,
    strengths: FORCES,
    weaknesses: FAIBLESSES,
} = pouvoirsData

// ─── RADAR GEOMETRY ──────────────────────────────────────────────
const CX = 90, CY = 90, R = 60
const ANGLES = STATS.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / STATS.length)
const OUTER = ANGLES.map(a => ({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }))
const DATA = STATS.map((s, i) => ({
    x: CX + R * (s.value / 100) * Math.cos(ANGLES[i]),
    y: CY + R * (s.value / 100) * Math.sin(ANGLES[i]),
}))
const RINGS = [0.25, 0.5, 0.75, 1.0]
const polyOf = pts => pts.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')

// ─── SPELL ICONS ─────────────────────────────────────────────────

const isImg = (icon) => typeof icon === 'string' && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon)

// ─── COMPONENT ───────────────────────────────────────────────────
export default function Pouvoirs() {
    const [mounted, setMounted] = useState(false)
    const [bars, setBars] = useState(false)
    const [openSpell, setOpenSpell] = useState(null)

    useEffect(() => {
        const t1 = setTimeout(() => setMounted(true), 60)
        const t2 = setTimeout(() => setBars(true), 520)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [])

    // Close modal on Esc
    useEffect(() => {
        if (openSpell === null) return
        const onKey = (e) => { if (e.key === 'Escape') setOpenSpell(null) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [openSpell])

    const spell = openSpell !== null ? SPELLS[openSpell] : null

    return (
        <div className="moba" data-testid="pouvoirs">
            {/* Retro background layers */}
            <div className="moba__bg-grid" />
            <div className="moba__bg-dither" />

            <div className={`moba__inner ${mounted ? 'is-in' : ''}`}>

                {/* Top bar */}
                <header className="moba__topbar">
                    <div className="moba__crumb">
                        <span className="moba__crumb-dot" />
                        DATA CHECK // PROFIL élève <strong>{HERO.lastName} {HERO.firstName}</strong>
                    </div>
                    <div className="moba__rank">
                        <span className="moba__rank-label">ÉTABLISSEMENT</span>
                        <span className="moba__rank-val">{HERO.school}</span>
                        <span className="moba__rank-mat">{HERO.matricule}</span>
                    </div>
                </header>

                {/* Main 3-col grid */}
                <div className="moba__grid">

                    {/* LEFT: identity + power + spells */}
                    <section className="moba__col moba__col--left">

                        {/* pOWER panel */}
                        <div className="moba__panel moba__power-panel" data-testid="power-panel">
                            <div className="moba__panel-head">
                                <span className="moba__panel-title">Données de capacité</span>
                                <span className="moba__panel-dot" />
                            </div>
                            <div className="moba__power-grid">
                                <div className="moba__power-cell" data-testid="power-name">
                                    <i>APPELATION</i>
                                    <span>{POWER.name}</span>
                                </div>
                                <div className="moba__power-cell" data-testid="power-tier">
                                    <i>TIER</i>
                                    <span>{POWER.tier}</span>
                                </div>
                                <div className="moba__power-cell" data-testid="power-level">
                                    <i>NIVEAU</i>
                                    <span>{POWER.level}</span>
                                </div>
                                <div className="moba__power-cell moba__power-cell--aura" data-testid="power-aura">
                                    <i>AURA </i>
                                    <span>{POWER.aura}</span>
                                </div>
                                <div className="moba__power-cell" data-testid="power-type">
                                    <i>TYPE</i>
                                    <span>{POWER.type}</span>
                                </div>
                                <div className="moba__power-cell" data-testid="power-role">
                                    <i>RÔLE</i>
                                    <span>{POWER.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Bars: Santé / Énergie */}
                        <div className="moba__bars" data-testid="hero-bars">
                            <div className="moba__bar moba__bar--hp">
                                <div className="moba__bar-track">
                                    <div
                                        className="moba__bar-fill"
                                        style={{ width: bars ? `${(HP.current / HP.max) * 100}%` : '0%' }}
                                    />
                                    <span className="moba__bar-label">Santé</span>
                                    <span className="moba__bar-value">{HP.current}HP</span>
                                </div>
                            </div>
                            <div className="moba__bar moba__bar--energy">
                                <div className="moba__bar-track">
                                    <div
                                        className="moba__bar-fill"
                                        style={{ width: bars ? `${(ENERGY.current / ENERGY.max) * 100}%` : '0%' }}
                                    />
                                    <span className="moba__bar-label">Énergie</span>
                                    <span className="moba__bar-value">{ENERGY.current}EP</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick description */}
                        <p className="moba__desc" data-testid="hero-desc">{HERO.description}</p>

                        {/* Spells — icon row */}
                        <div className="moba__panel moba__spells-panel">
                            <div className="moba__panel-head">
                                <span className="moba__panel-title">SORTS &amp; TECHNIQUES</span>
                                <span className="moba__panel-dot" />
                            </div>

                            <div className="moba__spell-row" data-testid="spells-grid">
                                {SPELLS.map((sp, i) => (
                                    <button
                                        type="button"
                                        key={sp.key}
                                        className={`moba__spell-btn ${sp.ult ? 'is-ult' : ''}`}
                                        style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                                        onClick={() => setOpenSpell(i)}
                                        data-testid={`spell-${sp.key.toLowerCase()}`}
                                        aria-label={`Ouvrir détails ${sp.name}`}
                                    >
                                        {isImg(sp.icon) ? (
                                            <img src={sp.icon} alt={sp.name} className="moba__spell-glyph moba__spell-glyph--img" />
                                        ) : (
                                            <span className="moba__spell-glyph">{sp.icon || sp.key}</span>
                                        )}
                                        <span className="moba__spell-key">{sp.key}</span>
                                        <span className="moba__spell-tip">{sp.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* CENTER: portrait */}
                    <section className="moba__col moba__col--center">
                        <div className="moba__portrait" data-testid="hero-portrait">
                            <div className="moba__portrait-glow" />
                            <div className="moba__portrait-frame">
                                <img src={HERO.portrait} alt={`${HERO.firstName} ${HERO.lastName}`} className="moba__portrait-img" />
                            </div>
                            <div className="moba__portrait-base" />
                        </div>
                    </section>

                    {/* RIGHT: bars + radar + equipment */}
                    <section className="moba__col moba__col--right">

                        {/* Radar */}
                        <div className="moba__radar-bare">
                            <div className="moba__radar-wrap">
                                <svg className="moba__radar" viewBox="0 0 180 180" data-testid="stats-radar" shapeRendering="crispEdges">
                                    {RINGS.map((s, ri) => (
                                        <polygon
                                            key={ri}
                                            points={polyOf(OUTER.map(p => ({
                                                x: CX + (p.x - CX) * s,
                                                y: CY + (p.y - CY) * s,
                                            })))}
                                            fill="none"
                                            stroke={s === 1 ? '#3a82d9' : 'rgba(94,140,210,0.35)'}
                                            strokeWidth={s === 1 ? 2 : 1}
                                        />
                                    ))}
                                    {OUTER.map((p, i) => (
                                        <line key={i} x1={CX} y1={CY} x2={Math.round(p.x)} y2={Math.round(p.y)} stroke="rgba(94,140,210,0.35)" strokeWidth="1" />
                                    ))}
                                    <polygon
                                        points={polyOf(DATA)}
                                        fill="rgba(94,230,255,0.28)"
                                        stroke="#5ee6ff"
                                        strokeWidth="2"
                                        style={{
                                            transformOrigin: `${CX}px ${CY}px`,
                                            transform: mounted ? 'scale(1)' : 'scale(0)',
                                            transition: 'transform 0.6s steps(8, end) 0.3s',
                                        }}
                                    />
                                    {DATA.map((p, i) => (
                                        <rect key={i} x={Math.round(p.x) - 1} y={Math.round(p.y) - 1.5} width="3" height="3" fill={STATS[i].color} />
                                    ))}
                                    {STATS.map((s, i) => {
                                        const lx = Math.round(CX + (R + 14) * Math.cos(ANGLES[i]))
                                        const ly = Math.round(CY + (R + 18) * Math.sin(ANGLES[i]))
                                        return (
                                            <g key={i}>
                                                <text x={lx} y={ly - 4} textAnchor="middle" dominantBaseline="middle"
                                                    fill="#9fc6ff" fontSize="6" letterSpacing="1">
                                                    {s.name}
                                                </text>
                                                <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="middle"
                                                    fill={s.color} fontSize="9">
                                                    {s.value}
                                                </text>
                                            </g>
                                        )
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* Forces & Faiblesses */}
                        <div className="moba__panel moba__traits-panel" data-testid="traits-panel">
                            <div className="moba__panel-head">
                                <span className="moba__panel-title">AVANTAGES &amp; LIMITES</span>
                                <span className="moba__panel-dot" />
                            </div>

                            <div className="moba__traits-section">
                                <div className="moba__traits-label">FORCES</div>
                                <ul className="moba__traits-list" data-testid="forces-list">
                                    {FORCES.map((it, i) => (
                                        <li key={i} className="moba__traits-item">
                                            <span className="moba__traits-bullet">›</span>{it}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="moba__traits-section">
                                <div className="moba__traits-label moba__traits-label--weak">FAIBLESSES</div>
                                <ul className="moba__traits-list moba__traits-list--weak" data-testid="faiblesses-list">
                                    {FAIBLESSES.map((it, i) => (
                                        <li key={i} className="moba__traits-item">
                                            <span className="moba__traits-bullet">›</span>{it}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            {/* ─── SPELL MODAL ─── */}
            {spell && (
                <div
                    className="moba__modal-overlay"
                    onClick={() => setOpenSpell(null)}
                    data-testid="spell-modal-overlay"
                >
                    <div
                        className={`moba__modal ${spell.ult ? 'is-ult' : ''}`}
                        onClick={(e) => e.stopPropagation()}
                        data-testid="spell-modal"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="moba__modal-head">
                            <div className="moba__modal-title-wrap">
                                <span className="moba__modal-key">{spell.key}</span>
                                <span className="moba__modal-title">{spell.name}</span>
                            </div>
                            <button
                                type="button"
                                className="moba__modal-close"
                                onClick={() => setOpenSpell(null)}
                                data-testid="spell-modal-close"
                                aria-label="Fermer"
                            >×</button>
                        </div>

                        <div className="moba__modal-body">
                            <div className="moba__modal-glyph">
                                {isImg(spell.icon) ? (
                                    <img src={spell.icon} alt={spell.name} className="moba__modal-glyph-img" />
                                ) : (
                                    spell.icon || spell.key
                                )}
                            </div>

                            <div className="moba__modal-meta">
                                <div className="moba__modal-pill moba__modal-pill--cost">
                                    <i>COÛT</i><span>{spell.cost} énergie</span>
                                </div>
                                <div className="moba__modal-pill moba__modal-pill--recharge">
                                    <i>RECHARGE</i><span>{spell.recharge}</span>
                                </div>
                                <div className="moba__modal-pill moba__modal-pill--duration">
                                    <i>DURÉE</i><span>{spell.duration}</span>
                                </div>
                                {spell.range && (
                                    <div className="moba__modal-pill moba__modal-pill--range">
                                        <i>PORTÉE</i><span>{spell.range}</span>
                                    </div>
                                )}
                            </div>

                            <p className="moba__modal-desc">{spell.desc}</p>

                            {spell.effect && (
                                <div className="moba__modal-effect">
                                    <span className="moba__modal-effect-label">EFFETS</span>
                                    {(Array.isArray(spell.effect) ? spell.effect : [spell.effect]).map((ef, i) => (
                                        <span key={i} className="moba__modal-effect-text">{ef}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}