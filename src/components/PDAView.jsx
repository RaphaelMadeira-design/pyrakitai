import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../styles/PDA.scss'

import Snake from './Snake'
import JumpGame from './JumpGame'
import MediaPlayer from './MediaPlayer'

import pdaData from '../data/pda.json'
import intranetData from '../data/intranet.json'
import pouvoirsData from '../data/pouvoirs.json'
import msnData from '../data/msn.json'

// ─── DONNÉES EXTERNALISÉES ───────────────────────────────────────
const {
    pdaApps:        PDA_APPS,
    gameApps:       GAME_APPS,
    pageOrder:      PAGE_ORDER,
    physicalTraits: PHYSICAL_TRAITS,
    psychoTraits:   PSYCHO_TRAITS,
    contactNotes:   CONTACT_NOTES,
    ui:             UI,
} = pdaData

const PROFILE  = intranetData.trombinoscope
const POWER    = pouvoirsData
const SELF     = msnData.user.name
const EMAIL    = msnData.credentials.email

const CONTACTS_LIST = msnData.contacts.map(c => ({
    id:     c.id,
    name:   c.name,
    status: c.status,
    msg:    c.personalMessage,
    note:   CONTACT_NOTES[c.id] || '—',
}))
const CONVERSATIONS = msnData.conversations

// Découpe un texte long en paragraphes (sur les lignes vides)
const toParagraphs = (text = '') => text.split(/\n\s*\n/).filter(Boolean)

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function PDAView() {
    const [currentApp, setCurrentApp] = useState('home')
    const [time, setTime] = useState('')
    const [date, setDate] = useState('')
    const [battery] = useState(UI.defaultBattery)
    // États d'alimentation : 'off' → 'booting' → 'on'
    const [powerState, setPowerState] = useState('off')
    const [animatingOff, setAnimatingOff] = useState(false)

    useEffect(() => {
        const update = () => {
            const now = new Date()
            setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
            setDate(`${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`)
        }
        update()
        const id = setInterval(update, 10000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (powerState !== 'booting') return
        const timer = setTimeout(() => setPowerState('on'), UI.boot.durationMs)
        return () => clearTimeout(timer)
    }, [powerState])

    const handlePowerToggle = () => {
        if (powerState === 'off') {
            setPowerState('booting')
        } else if (powerState === 'on') {
            setAnimatingOff(true)
            setPowerState('off')
            setCurrentApp('home')
        }
    }

    const navigateTo = (appId) => setCurrentApp(appId)

    const cycleOffset = (offset) => {
        const idx = PAGE_ORDER.indexOf(currentApp)
        if (idx === -1) return
        const next = (idx + offset + PAGE_ORDER.length) % PAGE_ORDER.length
        setCurrentApp(PAGE_ORDER[next])
    }
    const isCyclable = PAGE_ORDER.includes(currentApp)

    const renderAppContent = () => {
        switch (currentApp) {
            case 'home':     return <PDAHomeScreen apps={PDA_APPS} onAppSelect={navigateTo} date={date} />
            case 'identite': return <PDAIdentity />
            case 'stats':    return <PDAStats />
            case 'histoire': return <PDAHistoire />
            case 'contacts': return <PDAContacts />
            case 'games':    return <PDAHomeScreen apps={GAME_APPS} onAppSelect={navigateTo} title={UI.home.gamesTitle} subtitle={UI.home.gamesSubtitle} date={date} />
            case 'snake':    return <Snake />
            case 'jump':     return <JumpGame />
            case 'media':    return <MediaPlayer />
            default:         return null
        }
    }

    const getAppTitle = () => {
        const app = [...PDA_APPS, ...GAME_APPS].find(a => a.id === currentApp)
        if (currentApp === 'games') return UI.labels.gamesShort
        return app?.label || UI.labels.fallbackTitle
    }

    if (powerState === 'off') {
        return (
        <PDAShell
            powerState="off"
            onPower={handlePowerToggle}
            currentApp={currentApp}
            navigateTo={navigateTo}
            animatingOff={animatingOff}
            onOffAnimationEnd={() => setAnimatingOff(false)}
        />
        )
    }

    if (powerState === 'booting') {
        return (
        <PDAShell
            powerState="booting"
            onPower={handlePowerToggle}
            currentApp={currentApp}
            navigateTo={navigateTo}
        />
        )
    }

    return (
        <div className="pda" data-testid="pda-view">
        <div className="pda__frame">
            <div className="pda__screen">
            <div key="on" className="pda__screen-inner">
                <div className="pda__scanlines" />

                {/* Status Bar */}
                <div className="pda__statusbar">
                <span className="pda__statusbar-title">{getAppTitle()}</span>
                <div className="pda__statusbar-right">
                    <span className="pda__battery">
                    <span className="pda__battery-icon" style={{ '--level': `${battery}%` }} />
                    {battery}%
                    </span>
                    <span className="pda__time">{time}</span>
                </div>
                </div>

                {/* Contenu */}
                <div className="pda__content">
                <AnimatePresence mode="wait">
                    <motion.div
                    key={currentApp}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="pda__app-container"
                    >
                    {renderAppContent()}
                    </motion.div>
                </AnimatePresence>
                </div>

                {/* Nav Bar : ◂ | ● Menu | ▸ */}
                <div className="pda__navbar">
                <button
                    className="pda__nav-arrow"
                    onClick={() => cycleOffset(-1)}
                    disabled={!isCyclable}
                    data-testid="pda-prev"
                    title={UI.labels.prevTitle}
                >{UI.labels.prev}</button>

                <button
                    className="pda__nav-btn pda__nav-btn--home"
                    onClick={() => navigateTo('home')}
                    data-testid="pda-home"
                >{UI.labels.menu}</button>

                <button
                    className="pda__nav-arrow"
                    onClick={() => cycleOffset(1)}
                    disabled={!isCyclable}
                    data-testid="pda-next"
                    title={UI.labels.nextTitle}
                >{UI.labels.next}</button>
                </div>
            </div>
            </div>

            <PDAButtonsRow
            currentApp={currentApp}
            navigateTo={navigateTo}
            onPower={handlePowerToggle}
            powerOn
            />

            <div className="pda__brand">
            <span>{UI.brand.top}</span>
            <small>{UI.brand.bottom}</small>
            </div>
        </div>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // ROW DE BOUTONS PHYSIQUES
    // ═══════════════════════════════════════════════════════════════════
    function PDAButtonsRow({ currentApp, navigateTo, onPower, powerOn = false }) {
    return (
        <div className="pda__buttons">
        {PDA_APPS.slice(0, 2).map((app, i) => (
            <div
            key={app.id}
            className={`pda__button ${currentApp === app.id ? 'pda__button--active' : ''}`}
            onClick={() => navigateTo && navigateTo(app.id)}
            title={app.label}
            data-testid={`pda-hw-btn-${app.id}`}
            >
            <span>{i + 1}</span>
            </div>
        ))}

        <button
            type="button"
            className={`pda__button pda__button--power ${powerOn ? 'pda__button--power-on' : ''}`}
            onClick={onPower}
            title={powerOn ? UI.labels.powerOff : UI.labels.powerOn}
            aria-label={UI.labels.powerAria}
            data-testid="pda-hw-btn-power"
        >
            <span className="pda__power-glyph">⏻</span>
        </button>

        {PDA_APPS.slice(2).map((app, i) => (
            <div
            key={app.id}
            className={`pda__button ${currentApp === app.id ? 'pda__button--active' : ''}`}
            onClick={() => navigateTo && navigateTo(app.id)}
            title={app.label}
            data-testid={`pda-hw-btn-${app.id}`}
            >
            <span>{i + 3}</span>
            </div>
        ))}
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // ÉCRAN D'ACCUEIL
    // ═══════════════════════════════════════════════════════════════════
    function PDAHomeScreen({
    apps,
    onAppSelect,
    title = UI.home.defaultTitle,
    subtitle = UI.home.defaultSubtitle,
    date,
    }) {
    return (
        <div className="pda-home">
        <div className="pda-home__header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
        <div className="pda-home__grid">
            {apps.map((app, index) => (
            <motion.button
                key={app.id}
                className="pda-home__app"
                onClick={() => onAppSelect(app.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                data-testid={`pda-app-${app.id}`}
            >
                <span className="pda-home__app-icon">{app.icon}</span>
                <span className="pda-home__app-label">{app.label}</span>
            </motion.button>
            ))}
        </div>
        <div className="pda-home__footer" data-testid="pda-home-date">
            <span className="pda-home__date-label">{UI.home.dateLabel}</span>
            <span className="pda-home__date-val">{date}</span>
        </div>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // IMAGE VERTE (canvas + dithering Floyd-Steinberg, palette LCD 4 niveaux)
    // ═══════════════════════════════════════════════════════════════════
    function PDAGreenImage({ src, width = 150, height = 150 }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
        ctx.imageSmoothingEnabled = false
        ctx.fillStyle = '#0a1a0a'
        ctx.fillRect(0, 0, width, height)

        const ratio = Math.max(width / img.width, height / img.height)
        const w = img.width * ratio
        const h = img.height * ratio
        ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)

        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        const palette = [
            [10, 26, 10],
            [26, 136, 51],
            [51, 255, 102],
            [68, 255, 119],
        ]

        const gray = new Float32Array(width * height)
        for (let i = 0; i < data.length; i += 4) {
            gray[i / 4] = 0.399 * data[i] + 0.1 * data[i + 1] + 0.2 * data[i + 2]
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
            const idx = y * width + x
            const oldV = gray[idx]
            const level = Math.max(0, Math.min(3, Math.round((oldV / 255) * 3)))
            const newV = (level / 3) * 255
            const err = oldV - newV

            if (x + 1 < width)                       gray[idx + 1]         += err * 7 / 16
            if (y + 1 < height) {
                if (x > 0)         gray[idx + width - 1] += err * 3 / 16
                gray[idx + width]     += err * 5 / 16
                if (x + 1 < width) gray[idx + width + 1] += err * 1 / 16
            }

            const color = palette[level]
            const p = idx * 4
            data[p]     = color[0]
            data[p + 1] = color[1]
            data[p + 2] = color[2]
            data[p + 3] = 255
            }
        }
        ctx.putImageData(imageData, 0, 0)
        }

        img.onerror = () => {
        ctx.fillStyle = '#1a2b1a'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = '#1a8833'
        ctx.font = '10px "Pixelify Sans", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('[NO IMG]', width / 2, height / 2)
        }

        img.src = src
    }, [src, width, height])

    return (
        <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="pda-img"
        data-testid="pda-portrait"
        />
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAGE : IDENTITÉ
    // ═══════════════════════════════════════════════════════════════════
    function PDAIdentity() {
    const L = UI.identityRowLabels
    const R = UI.identityRegisterLabels
    const rows = [
        [L.fullName,  PROFILE.name],
        [L.id,        PROFILE.id],
        [L.age,       PROFILE.age],
        [L.genre,     PROFILE.genre],
        [L.race,      PROFILE.race],
        [L.origin,    PROFILE.origin],
        [L.archetype, PROFILE.archetype],
        [L.activity,  PROFILE.activity],
        [L.district,  PROFILE.district],
        [L.mbti,      PROFILE.mbti],
        [L.alignment, PROFILE.alignment],
    ]

    return (
        <div className="pda-page" data-testid="pda-page-identite">
        <div className="pda-page__title">{UI.sections.identityTitle}</div>

        <div className="pda-id__head">
            <div className="pda-id__avatar">
            <PDAGreenImage
                src={PROFILE.image}
                width={UI.portraitSize.width}
                height={UI.portraitSize.height}
            />
            </div>
            <div className="pda-id__tag">
            <div className="pda-id__label">{R.id}</div>
            <div className="pda-id__value">{PROFILE.id}</div>
            <div className="pda-id__label" style={{ marginTop: 8 }}>{R.office}</div>
            <div className="pda-id__value">{PROFILE.office}</div>
            <div className="pda-id__label" style={{ marginTop: 8 }}>{R.statut}</div>
            <div className="pda-id__value pda-id__value--ok">▣ {PROFILE.status}</div>
            </div>
        </div>

        <div className="pda-page__section">{UI.sections.fiche}</div>
        <table className="pda-table">
            <tbody>
            {rows.map(([k, v]) => (
                <tr key={k}>
                <td className="pda-table__k">{k}</td>
                <td className="pda-table__sep">:</td>
                <td className={`pda-table__v${k === L.origin ? ' pda-shevar' : ''}`}>{v}</td>
                </tr>
            ))}
            </tbody>
        </table>

        <div className="pda-page__note">
            &gt; E-mail : <strong>{EMAIL}</strong>
        </div>

        {/* ── DESCRIPTION PHYSIQUE ─────────────────── */}
        <div className="pda-page__section">{UI.sections.physique}</div>
        {toParagraphs(PROFILE.physicalDescription).map((t, i) => (
            <p key={i} className="pda-wiki__intro">{t}</p>
        ))}
        <dl className="pda-wiki">
            {PHYSICAL_TRAITS.map(([k, v]) => (
            <div key={k} className="pda-wiki__row">
                <dt className="pda-wiki__k">{k}</dt>
                <dd className="pda-wiki__v">{v}</dd>
            </div>
            ))}
        </dl>

        {/* ── PROFIL PSYCHOLOGIQUE ─────────────────── */}
        <div className="pda-page__section">{UI.sections.psycho}</div>
        {toParagraphs(PROFILE.psychProfile).map((t, i) => (
            <p key={i} className="pda-wiki__intro">{t}</p>
        ))}
        <dl className="pda-wiki">
            {PSYCHO_TRAITS.map(([k, v]) => (
            <div key={k} className="pda-wiki__row">
                <dt className="pda-wiki__k">{k}</dt>
                <dd className="pda-wiki__v">{v}</dd>
            </div>
            ))}
        </dl>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAGE : STATS / POUVOIR
    // ═══════════════════════════════════════════════════════════════════
    function PDAStats() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 80)
        return () => clearTimeout(t)
    }, [])

    const pct = (v, m) => Math.round((v / m) * 100)

    return (
        <div className="pda-page" data-testid="pda-page-stats">
        <div className="pda-page__title">{UI.sections.power}</div>

        <div className="pda-page__section">{UI.sections.vitals}</div>
        <div className="pda-vitals">
            <VitalRow label="PV" value={POWER.hp.current}     max={POWER.hp.max}     pctValue={mounted ? pct(POWER.hp.current,     POWER.hp.max)     : 0} />
            <VitalRow label="EN" value={POWER.energy.current} max={POWER.energy.max} pctValue={mounted ? pct(POWER.energy.current, POWER.energy.max) : 0} />
        </div>

        <div className="pda-page__section">{UI.sections.statistics}</div>
        <div className="pda-stats">
            {POWER.stats.map((s, i) => (
            <div key={i} className="pda-stat">
                <span className="pda-stat__name">{s.name.toUpperCase()}</span>
                <span className="pda-stat__bar">
                <BlockBar value={mounted ? s.value : 0} />
                </span>
                <span className="pda-stat__val">{s.value.toString().padStart(3, '0')}</span>
            </div>
            ))}
        </div>

        <div className="pda-page__section">{UI.sections.essem}</div>
        <table className="pda-table">
            <tbody>
            {Object.entries(UI.powerLabels).map(([key, label]) => (
                <tr key={key}>
                <td className="pda-table__k">{label}</td>
                <td className="pda-table__sep">:</td>
                <td className="pda-table__v">{POWER.power[key]}</td>
                </tr>
            ))}
            </tbody>
        </table>
        <div className="pda-jinsei">
            <p>{POWER.hero.description}</p>
        </div>

        <div className="pda-page__section">{UI.sections.technique}</div>
        <div className="pda-abilities">
            {POWER.spells.map(a => (
            <div key={a.key} className={`pda-ab ${a.ult ? 'pda-ab--ult' : ''}`} data-testid={`pda-ability-${a.key}`}>
                <div className="pda-ab__key">{a.key}</div>
                <div className="pda-ab__body">
                <div className="pda-ab__head">
                    <span className="pda-ab__name">{a.name}</span>
                    <span className="pda-ab__meta">◉ {a.cost} EN · ⧗ {a.duration} · ↻ {a.recharge} · ⌖ {a.range}</span>
                </div>
                <p className="pda-ab__desc">{a.desc}</p>
                <p className="pda-ab__desc">&gt; {a.effect}</p>
                </div>
            </div>
            ))}
        </div>

        <div className="pda-page__section">{UI.sections.strengths}</div>
        <ul className="pda-wiki">
            {POWER.strengths.map((t, i) => (
            <li key={i} className="pda-wiki__v">+ {t}</li>
            ))}
        </ul>

        <div className="pda-page__section">{UI.sections.weaknesses}</div>
        <ul className="pda-wiki">
            {POWER.weaknesses.map((t, i) => (
            <li key={i} className="pda-wiki__v">- {t}</li>
            ))}
        </ul>
        </div>
    )
    }

    function VitalRow({ label, value, max, pctValue = 0, hideBar = false }) {
    return (
        <div className="pda-vital">
        <span className="pda-vital__label">{label}</span>
        {!hideBar && (
            <span className="pda-vital__bar">
            <BlockBar value={pctValue} />
            </span>
        )}
        <span className={`pda-vital__val ${hideBar ? 'pda-vital__val--big' : ''}`}>
            {value}{max ? <span className="pda-vital__max">/{max}</span> : ''}
        </span>
        </div>
    )
    }

    function BlockBar({ value = 0, total = 20 }) {
    const filled = Math.round((value / 100) * total)
    return (
        <span className="pda-blockbar" aria-label={`${value}%`}>
        {Array.from({ length: total }).map((_, i) => (
            <span
            key={i}
            className={`pda-blockbar__cell ${i < filled ? 'pda-blockbar__cell--on' : ''}`}
            />
        ))}
        </span>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAGE : HISTOIRE
    // ═══════════════════════════════════════════════════════════════════
    function PDAHistoire() {
    const [openId, setOpenId] = useState(1)

    // Les entrées du dossier viennent du profil Intranet
    const HISTORY_CHAPTERS = Object.keys(UI.historyTitles).map((field, i) => ({
        id:    i + 1,
        year:  UI.historyTags[field],
        title: UI.historyTitles[field],
        field,
    }))

    return (
        <div className="pda-page" data-testid="pda-page-histoire">
        <div className="pda-page__title">{UI.sections.history}</div>
        <div className="pda-page__subtitle">{HISTORY_CHAPTERS.length} {UI.sections.historySubtitle}</div>

        <ul className="pda-history">
            {HISTORY_CHAPTERS.map(ch => {
            const open = openId === ch.id
            return (
                <li key={ch.id} className={`pda-chap ${open ? 'pda-chap--open' : ''}`}>
                <button
                    className="pda-chap__head"
                    onClick={() => setOpenId(open ? null : ch.id)}
                    data-testid={`pda-chap-${ch.id}`}
                >
                    <span className="pda-chap__marker">{open ? '▼' : '▶'}</span>
                    <span className="pda-chap__year">{ch.year}</span>
                    <span className="pda-chap__title">{ch.title}</span>
                </button>
                {open && (
                    <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    className="pda-chap__body"
                    >
                    {ch.field === 'likesDislikes' ? (
                        <>
                        <p><strong>{UI.labels.likes}</strong> {PROFILE.likesDislikes.likes}</p>
                        <p><strong>{UI.labels.dislikes}</strong> {PROFILE.likesDislikes.dislikes}</p>
                        </>
                    ) : (
                        toParagraphs(PROFILE[ch.field]).map((t, i) => <p key={i}>{t}</p>)
                    )}
                    </motion.div>
                )}
                </li>
            )
            })}
        </ul>

        <div className="pda-page__note">{UI.sections.historyEnd}</div>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // PAGE : CONTACTS
    // ═══════════════════════════════════════════════════════════════════
    function PDAContacts() {
    const [selected, setSelected] = useState(null)

    if (selected) {
        return <PDAContactDetail contact={selected} onBack={() => setSelected(null)} />
    }

    const online  = CONTACTS_LIST.filter(c => c.status === 'online' || c.status === 'away')
    const offline = CONTACTS_LIST.filter(c => c.status === 'offline')

    return (
        <div className="pda-page" data-testid="pda-page-contacts">
        <div className="pda-page__title">{UI.sections.contacts}</div>
        <div className="pda-page__subtitle">
            {CONTACTS_LIST.length} entrée(s) — {online.length} en ligne
        </div>

        <div className="pda-page__section">{UI.sections.online}</div>
        <ul className="pda-contacts">
            {online.map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => setSelected(c)} />
            ))}
        </ul>

        <div className="pda-page__section">{UI.sections.offline}</div>
        <ul className="pda-contacts">
            {offline.map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => setSelected(c)} />
            ))}
        </ul>
        </div>
    )
    }

    function ContactRow({ contact, onClick }) {
    const icon = contact.status === 'online' ? '●'
                : contact.status === 'away'   ? '◐'
                :                               '○'
    return (
        <li
        className={`pda-contact pda-contact--${contact.status}`}
        onClick={onClick}
        data-testid={`pda-contact-${contact.id}`}
        >
        <span className="pda-contact__dot">{icon}</span>
        <span className="pda-contact__body">
            <span className="pda-contact__name">{contact.name}</span>
            <span className="pda-contact__msg">{contact.msg || '—'}</span>
        </span>
        <span className="pda-contact__chev">▸</span>
        </li>
    )
    }

    function PDAContactDetail({ contact, onBack }) {
    const statusLabel = UI.statusLabels[contact.status]
    const conv = CONVERSATIONS[contact.id]

    return (
        <div className="pda-page" data-testid={`pda-contact-detail-${contact.id}`}>
        <div className="pda-page__title">&gt; {contact.name.toUpperCase()}.VCF</div>

        <div className="pda-detail">
            <div className="pda-detail__row">
            <span className="pda-detail__k">STATUT</span>
            <span className={`pda-detail__v pda-detail__v--${contact.status}`}>
                ● {statusLabel}
            </span>
            </div>
            <div className="pda-detail__row">
            <span className="pda-detail__k">PSEUDO</span>
            <span className="pda-detail__v">{contact.name}</span>
            </div>
            <div className="pda-detail__row">
            <span className="pda-detail__k">MESSAGE</span>
            <span className="pda-detail__v">{contact.msg || '—'}</span>
            </div>

            <div className="pda-page__section" style={{ marginTop: 14 }}>{UI.sections.note}</div>
            <p className="pda-detail__note">{contact.note}</p>

            {/* Conversation */}
            {conv && (
            <>
                <div className="pda-page__section" style={{ marginTop: 14 }}>
                {UI.sections.conversation}
                </div>
                <div className="pda-conv" data-testid={`pda-conv-${contact.id}`}>
                {conv.date && <div className="pda-conv__date">— {conv.date} —</div>}
                {conv.messages.map((m, i) => {
                    if (m.from === 'system') {
                    return (
                        <div key={i} className="pda-conv__sys">{m.text}</div>
                    )
                    }
                    const isSelf = m.from === SELF
                    return (
                    <div key={i} className={`pda-conv__msg ${isSelf ? 'pda-conv__msg--self' : ''}`}>
                        <div className="pda-conv__head">
                        <span className="pda-conv__from">
                            {isSelf ? SELF : contact.name}
                        </span>
                        {m.time && <span className="pda-conv__time">{m.time}</span>}
                        </div>
                        <div className={`pda-conv__text ${m.italic ? 'pda-conv__text--italic' : ''}`}>
                        &gt; {m.text}
                        </div>
                    </div>
                    )
                })}
                </div>
            </>
            )}

            <button className="pda-btn" onClick={onBack} data-testid="pda-contact-back">
            {UI.labels.backToContacts}
            </button>
        </div>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // SHELL (écran éteint OU boot)
    // ═══════════════════════════════════════════════════════════════════
    function PDAShell({ powerState, onPower, currentApp, navigateTo, animatingOff = false, onOffAnimationEnd }) {
    const rootClass =
        powerState === 'booting'
        ? 'pda pda--boot'
        : `pda pda--off${animatingOff ? ' pda--off-anim' : ''}`

    return (
        <div className={rootClass} data-testid={`pda-${powerState}`}>
        <div className="pda__frame">
            <div className={`pda__screen ${powerState === 'booting' ? 'pda__screen--boot' : 'pda__screen--off'}`}>
            <div
                key={powerState}
                className="pda__screen-inner"
                onAnimationEnd={powerState === 'off' && animatingOff ? onOffAnimationEnd : undefined}
            >
                {powerState === 'booting' && <div className="pda__scanlines" />}
                {powerState === 'off' && (
                <div className="pda-off" data-testid={UI.off.testId}>
                    <div className="pda-off__hint">
                    <div className="pda-off__hint-text">
                        {UI.off.hint}
                    </div>
                    </div>
                </div>
                )}
                {powerState === 'booting' && <PDABootScreen />}
            </div>
            </div>

            <PDAButtonsRow
            currentApp={currentApp}
            navigateTo={navigateTo}
            onPower={onPower}
            powerOn={powerState !== 'off'}
            />

            <div className="pda__brand">
            <span>{UI.brand.top}</span>
            <small>{UI.brand.bottom}</small>
            </div>
        </div>
        </div>
    )
    }

    // ═══════════════════════════════════════════════════════════════════
    // BOOT SCREEN
    // ═══════════════════════════════════════════════════════════════════
    function PDABootScreen() {
    const [dots, setDots] = useState('')

    useEffect(() => {
        const id = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 400)
        return () => clearInterval(id)
    }, [])

    return (
        <div className="pda-boot">
        <div className="pda-boot__logo">
            <span>{UI.boot.logoTop}</span>
            <small>{UI.boot.logoBottom}</small>
        </div>
        <div className="pda-boot__text">
            <p>{UI.boot.initText}{dots}</p>
            <div className="pda-boot__progress">
            <motion.div
                className="pda-boot__progress-bar"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: UI.boot.progressDurationSec, ease: 'easeInOut' }}
            />
            </div>
            <p className="pda-boot__version">{UI.boot.version}</p>
        </div>
        </div>
    )
}