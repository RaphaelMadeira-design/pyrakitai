import { useState, useEffect, useCallback } from 'react'
import '../styles/Browser.scss'
import config from '../data/browserConfig.json'
import secretData from '../data/browserSecret.json'
import searchData from '../data/browserSearch.json'

// ── Pages du navigateur ─────────────────────────────────────────
import HomePage from './HomePage'
import Wikipedia from './Wikipedia'
import NewsPortal from './NewsPortal'
import LampionPage from './LampionPage'
import SecretPage from './SecretPage'
import GlitchSearch from './GlitchSearch'
import KonamiOverlay from './KonamiOverlay'
import { FakeGoogleResults, FakeGoogleNoResult } from './GoogleResults'

const { IE_ICON, KONAMI, SECRET_SEARCHES, SECRET_URLS, WIKI_URL, NEWS_URL, TAB_DEFS, EXACT_URL_MAP } = config


const TARGET_MAP = { wiki: WIKI_URL, news: NEWS_URL }

const SEARCH_TOPICS = searchData.topics.map(t => ({
    ...t,
    real: { ...t.real, target: TARGET_MAP[t.real.target] || t.real.target },
}))

function matchTopic(query) {
    const q = query.trim().toLowerCase()
    if (!q) return null
    for (const t of SEARCH_TOPICS) {
        if (t.keys.some(k => q.includes(k))) return t
    }
    return null
}

// ─────────────────────────────────────────────
// 🧭 CENTRAL SEARCH / ROUTING ENGINE
// ─────────────────────────────────────────────

const normalizeUrl = (s) =>
    s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')

const buildGoogleUrl = (q) =>
    `http://www.google.jp/search?q=${encodeURIComponent(q).replace(/%20/g, '+')}`

const isSecretSearch = (query, SECRET_SEARCHES) => {
    const q = query.trim().toLowerCase()
    return SECRET_SEARCHES.some(s => q.includes(s.toLowerCase()))
}

function resolveInput(raw, ctx) {
    const {
        SECRET_SEARCHES,
        SECRET_URLS,
        EXACT_URL_MAP,
        normalizeUrl,
        matchTopic,
    } = ctx

    const trimmed = raw.trim()
    const lower = trimmed.toLowerCase()
    const norm = normalizeUrl(raw)

    // 1. SECRET SEARCH (priorité max)
    if (isSecretSearch(trimmed, SECRET_SEARCHES)) {
        return { type: 'GLITCH_SEARCH', query: trimmed }
    }

    // 2. SECRET URL
    if (SECRET_URLS.includes(lower)) {
        return { type: 'OPEN_SECRET' }
    }

    // 3. EXACT TAB ROUTE
    const tabId = EXACT_URL_MAP[norm]
    if (tabId) {
        return { type: 'OPEN_TAB', tabId }
    }

    // 4. GOOGLE TOPIC
    const topic = matchTopic(trimmed)
    if (topic) {
        return {
            type: 'GOOGLE_RESULTS',
            query: trimmed,
            topic
        }
    }

    // 5. DEFAULT
    return {
        type: 'GOOGLE_NORESULT',
        query: trimmed
    }
}

// ── Browser ──────────────────────────────────────────────────────

export default function Browser() {
    const [openedTabs, setOpenedTabs] = useState(['google'])
    const [activeTab, setActiveTab] = useState('google')
    const [secretTabVisible, setSecretTabVisible] = useState(false)
    const [addressValue, setAddressValue] = useState(TAB_DEFS.google.url)
    const [glitching, setGlitching] = useState(false)
    const [logoClicks, setLogoClicks] = useState(0)
    const [konamiIdx, setKonamiIdx] = useState(0)
    const [showKonami, setShowKonami] = useState(false)
    const [contentMode, setContentMode] = useState('normal')
    const [glitchQuery, setGlitchQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchTopic, setSearchTopic] = useState(null)
    const [status, setStatus] = useState('Terminé')
    const [addressSaved, setAddressSaved] = useState('')

    const openTab = useCallback((id) => {
        setOpenedTabs(prev => (prev.includes(id) ? prev : [...prev, id]))
    }, [])

    // ── Glitch helper ──────────────────────────────────────────────
    const triggerGlitch = useCallback((cb) => {
        setGlitching(true)
        setStatus('Chargement...')
        setTimeout(() => {
            setGlitching(false)
            setStatus('Terminé')
            cb()
        }, 650)
    }, [])

    const handleInput = useCallback((raw) => {
        triggerGlitch(() => {

            const action = resolveInput(raw, {
                SECRET_SEARCHES,
                SECRET_URLS,
                EXACT_URL_MAP,
                normalizeUrl,
                matchTopic,
            })

            switch (action.type) {

                case 'GLITCH_SEARCH':
                    setGlitchQuery(action.query)
                    setContentMode('glitch-search')
                    break

                case 'OPEN_SECRET':
                    setSecretTabVisible(true)
                    setActiveTab('secret')
                    setAddressValue('isen://core')
                    setContentMode('normal')
                    break

                case 'OPEN_TAB':
                    openTab(action.tabId)
                    setActiveTab(action.tabId)
                    setContentMode('normal')
                    setAddressValue(TAB_DEFS[action.tabId].url)
                    break

                case 'GOOGLE_RESULTS':
                    openTab('google')
                    setActiveTab('google')
                    setSearchQuery(action.query)
                    setSearchTopic(action.topic)
                    setContentMode('google-results')
                    setAddressValue(buildGoogleUrl(action.query))
                    break

                case 'GOOGLE_NORESULT':
                    openTab('google')
                    setActiveTab('google')
                    setSearchQuery(action.query)
                    setSearchTopic(null)
                    setContentMode('google-noresult')
                    setAddressValue(buildGoogleUrl(action.query))
                    break
                }
            })
    }, [triggerGlitch, openTab])

    const handleAddressFocus = () => {
        setAddressSaved(addressValue)
        setAddressValue('')
    }
    const handleAddressBlur = () => {
        if (!addressValue.trim()) setAddressValue(addressSaved)
    }

    const tabs = [
        ...openedTabs.map(id => TAB_DEFS[id]),
        ...(secretTabVisible ? [secretData.secretTab] : []),
    ]

    const closeTab = (id) => {
        if (id === 'google') return
        if (id === 'secret') {
            setSecretTabVisible(false)
        } else {
            setOpenedTabs(prev => prev.filter(t => t !== id))
        }
        if (activeTab === id) {
            setActiveTab('google')
            setAddressValue(TAB_DEFS.google.url)
            setContentMode('normal')
        }
    }

    // ── Konami ─────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === KONAMI[konamiIdx]) {
                const next = konamiIdx + 1
                if (next === KONAMI.length) {
                    setShowKonami(true)
                    setKonamiIdx(0)
                } else {
                    setKonamiIdx(next)
                }
            } else {
                setKonamiIdx(e.key === KONAMI[0] ? 1 : 0)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [konamiIdx])

    // ── Logo ⊙ clics (×3 = onglet secret) ─────────────────────────
    const handleLogoClick = () => {
        const count = logoClicks + 1
        setLogoClicks(count)
        if (count >= 3) {
            setLogoClicks(0)
            triggerGlitch(() => {
                setSecretTabVisible(true)
                setActiveTab('secret')
                setAddressValue('isen://core')
                setContentMode('normal')
            })
        }
    }

    // ── Ouverture onglet ActuNet depuis MSN ────────────────────────
    const handleOpenNews = () => {
        triggerGlitch(() => {
            openTab('news')
            setActiveTab('news')
            setContentMode('normal')
            setAddressValue(TAB_DEFS.news.url)
        })
    }

    // ── Changement d'onglet ────────────────────────────────────────
    const handleTabChange = (id) => {
        const tab = tabs.find(t => t.id === id)
        if (!tab) return
        setActiveTab(id)
        setAddressValue(tab.url)
        setContentMode('normal')
    }

    // ── Rendu contenu ──────────────────────────────────────────────
    const renderContent = () => {
        if (contentMode === 'glitch-search')
            return <GlitchSearch query={glitchQuery} />
        if (contentMode === 'google-results' && searchTopic)
            return <FakeGoogleResults topic={searchTopic} query={searchQuery} onResultClick={handleInput} onSearch={handleInput}/>
        if (contentMode === 'google-noresult')
            return <FakeGoogleNoResult query={searchQuery} onSearch={handleInput} />
        if (activeTab === 'secret')
            return <SecretPage />
        if (activeTab === 'wiki')
            return <Wikipedia onLogoClick={handleLogoClick} />
        if (activeTab === 'news')
            return <NewsPortal />
        if (activeTab === 'lampion')
            return <LampionPage />
        return (
            <HomePage
                onSearch={handleInput}
                onOpenNews={handleOpenNews}
            />
        )
    }

    return (
        <div className={`browser${glitching ? ' browser--glitching' : ''}`}>
            {showKonami && <KonamiOverlay onDismiss={() => setShowKonami(false)} />}

            <div className="browser__navbar">
                <div className="browser__nav-btns">
                    <button className="browser__nav-btn" title="Précédent"
                        onClick={() => { setContentMode('normal'); setActiveTab('google'); setAddressValue(TAB_DEFS.google.url) }}>◄</button>
                    <button className="browser__nav-btn" title="Suivant">►</button>
                    <button className="browser__nav-btn browser__nav-btn--stop" title="Arrêter">✕</button>
                    <button className="browser__nav-btn" title="Actualiser" onClick={() => handleInput(addressValue)}>↺</button>
                    <button className="browser__nav-btn" title="Accueil" onClick={() => handleTabChange('google')}>🏠</button>
                </div>
                <div className="browser__address-bar">
                    <span className="browser__address-label">Adresse</span>
                    <div className="browser__address-input">
                        <img src={IE_ICON} alt="" className="browser__address-icon" />
                        <input
                            type="text"
                            className="browser__address-text"
                            value={addressValue}
                            onChange={e => setAddressValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleInput(addressValue)}
                            onFocus={handleAddressFocus}
                            onBlur={handleAddressBlur}
                            spellCheck={false}
                        />
                    </div>
                    <button className="browser__address-go" onClick={() => handleInput(addressValue)}>OK</button>
                </div>
            </div>

            <div className="browser__tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={[
                            'browser__tab',
                            activeTab === tab.id && contentMode !== 'glitch-search' ? 'browser__tab--active' : '',
                            tab.id === 'secret' ? 'browser__tab--secret' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleTabChange(tab.id)}
                        data-testid={`tab-${tab.id}`}
                    >
                        <span className="browser__tab-icon"><img src={tab.icon} alt="" /></span>
                        <span className="browser__tab-label">{tab.label}</span>
                        {tab.id !== 'google' && (
                            <span
                                className="browser__tab-close"
                                role="button"
                                aria-label="Fermer l'onglet"
                                title="Fermer"
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                                data-testid={`tab-close-${tab.id}`}
                            >
                                <span>✕</span>
                            </span>
                        )}
                    </button>
                ))}
                <div className="browser__tabs-fill" />
            </div>

            <div className={`browser__content${glitching ? ' browser__content--glitch' : ''}`}>
                {renderContent()}
            </div>

            <div className="browser__statusbar">
                <span>{status}</span>
                <div className="browser__statusbar-right">
                    <img src={IE_ICON} alt="IE" style={{ width: 14, height: 14 }} />
                    <span>Zone Internet</span>
                </div>
            </div>
        </div>
    )
}
