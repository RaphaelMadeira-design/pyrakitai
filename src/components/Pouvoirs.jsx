import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../styles/Pouvoirs.scss'
import pouvoirsData from '../data/pouvoirs.json'

// ─── DATA ────────────────────────────────────────────────────────
const {
    hero: HERO,
    power: POWER,
    stats: STATS,
    spells: SPELLS,
    strengths: FORCES,
    weaknesses: FAIBLESSES,
} = pouvoirsData

// ─── RADAR GEOMETRY ──────────────────────────────────────────────
const CX = 90, CY = 90, R = 60
const ANGLES = STATS.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / STATS.length)
const OUTER = ANGLES.map(a => ({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }))
const DATA = STATS.map((s, i) => ({
    x: CX + R * (s.value / 20) * Math.cos(ANGLES[i]),
    y: CY + R * (s.value / 20) * Math.sin(ANGLES[i]),
}))
const RINGS = [0.25, 0.5, 0.75, 1.0]
const polyOf = pts => pts.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')

// ─── SPELL ICONS ─────────────────────────────────────────────────

const InfoCell = ({ label, value, info, align, testId }) => (
    <div className={`moba__power-cell moba__power-cell--info moba__power-cell--${align}`} tabIndex={0} data-testid={testId}>
        <i>{label}<span className="moba__info-mark" aria-hidden="true">?</span></i>
        <span>{value}</span>
        <div className="moba__tooltip" role="tooltip" data-testid={`${testId}-tooltip`}>{info}</div>
    </div>
)

const isImg = (icon) => typeof icon === 'string' && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon)

// ─── COMPONENT ───────────────────────────────────────────────────
export default function Pouvoirs() {
    const [mounted, setMounted] = useState(false)
    const [openSpell, setOpenSpell] = useState(null)
    const [tip, setTip] = useState(null)   // infobulle d'un sort : { name, left, right, top, bottom }
    const tipRef = useRef(null)

    const showTip = (e, name) => {
        const r = e.currentTarget.getBoundingClientRect()
        setTip({ name, left: r.left, right: r.right, top: r.top, bottom: r.bottom })
    }
    const hideTip = () => setTip(null)

    // Place l'infobulle une fois mesurée : centrée au-dessus du sort, gardée dans l'écran
    useLayoutEffect(() => {
        const el = tipRef.current
        if (!tip || !el) return
        const w = el.offsetWidth, h = el.offsetHeight, m = 4
        let x = (tip.left + tip.right) / 2 - w / 2
        x = Math.max(m, Math.min(x, window.innerWidth - w - m))
        let y = tip.top - h - 6
        if (y < m) y = tip.bottom + 6       // pas de place au-dessus : on passe dessous
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.style.visibility = 'visible'
    }, [tip])

    useEffect(() => {
        const t1 = setTimeout(() => setMounted(true), 60)
        return () => clearTimeout(t1)
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
                        DATA CHECK // PROFIL ESSEM <strong>{HERO.lastName} {HERO.firstName}</strong>
                    </div>
                    <div className="moba__rank">
                        <span className="moba__rank-label">AFFILIATION</span>
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
                                <div className="moba__power-cell moba__power-cell--wide moba__power-cell--aura">
                                    <i>ESSEM</i>
                                    <span>{POWER.essem}</span>
                                </div>
                                <div className="moba__power-cell moba__power-cell">
                                    <i>ARCHÉTYPE</i>
                                    <span>{POWER.archetype}</span>
                                </div>
                                <div className="moba__power-cell moba__power-cell">
                                    <i>SPÉCIALISATION</i>
                                    <span>{POWER.specialization}</span>
                                </div>
                                <div className="moba__power-cell moba__power-cell">
                                    <i>DON</i>
                                    <span>{POWER.gift}</span>
                                </div>
                                <div className="moba__power-cell moba__power-cell">
                                    <i>RUÜVAHN</i>
                                    <span>{POWER.ruuvahn}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick description */}
                        <div className="moba__panel moba__desc-panel" data-testid="hero-desc-panel">
                            <div className="moba__panel-head">
                                <span className="moba__panel-title">Description</span>
                                <span className="moba__panel-dot" />
                            </div>
                            <p className="moba__desc" data-testid="hero-desc">{HERO.description}</p>
                        </div>

                        {/* Spells — icon row */}
                        <div className="moba__panel moba__spells-panel">
                            <div className="moba__panel-head">
                                <span className="moba__panel-title">SORTS &amp; TECHNIQUES</span>
                                <span className="moba__panel-dot" />
                            </div>

                            <div className="moba__spell-row" data-testid="spells-grid" onScroll={hideTip}>
                                {SPELLS.map((sp, i) => (
                                    <button
                                        type="button"
                                        key={sp.key}
                                        className={`moba__spell-btn ${sp.ult ? 'is-ult' : ''}`}
                                        style={{ animationDelay: `${0.4 + i * 0.08}s` }}
                                        onClick={() => { hideTip(); setOpenSpell(i) }}
                                        onMouseEnter={(e) => showTip(e, sp.name)}
                                        onMouseLeave={hideTip}
                                        onFocus={(e) => showTip(e, sp.name)}
                                        onBlur={hideTip}
                                        data-testid={`spell-${sp.key.toLowerCase()}`}
                                        aria-label={`Ouvrir détails ${sp.name}`}
                                    >
                                        {isImg(sp.icon) ? (
                                            <img src={sp.icon} alt={sp.name} className="moba__spell-glyph moba__spell-glyph--img" />
                                        ) : (
                                            <span className="moba__spell-glyph">{sp.icon || sp.key}</span>
                                        )}
                                        <span className="moba__spell-key">{sp.key}</span>
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

                    {/* RIGHT: radar + traits + arme */}
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

            {/* ─── SPELL TOOLTIP (portail dans <body> : jamais coupé par un conteneur) ─── */}
            {tip && createPortal(
                <div ref={tipRef} className="moba__spell-tip" role="tooltip">{tip.name}</div>,
                document.body
            )}

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
                                {/*
                                <div className="moba__modal-pill moba__modal-pill--recharge">
                                    <i>RECHARGE</i><span>{spell.recharge}</span>
                                </div>
                                <div className="moba__modal-pill moba__modal-pill--duration">
                                    <i>DURÉE</i><span>{spell.duration}</span>
                                </div>
                                */}
                                {spell.range && (
                                    <div className="moba__modal-pill moba__modal-pill--range">
                                        <i>PORTÉE</i><span>{spell.range}</span>
                                    </div>
                                )}
                            </div>

                            <p className="moba__modal-desc">{spell.desc}</p>

                            {spell.effect && (
                                <div className="moba__modal-effect">
                                    <span className="moba__modal-effect-label">EFFET</span>
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
