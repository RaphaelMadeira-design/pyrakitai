import { useState, useEffect, useCallback, useRef } from 'react'
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

const { IE_ICON, KONAMI, SECRET_SEARCHES, SECRET_URLS, WIKI_URL, NEWS_URL, LAMPION_URL, DCR_URL, ASTIA_URL, RESEAU_URL, TAB_DEFS, EXACT_URL_MAP } = config


const TARGET_MAP = { wiki: WIKI_URL, news: NEWS_URL, lampion: LAMPION_URL }
const EXTERNAL_PAGES = [DCR_URL, ASTIA_URL, RESEAU_URL]

// Modes d'affichage où un onglet fixe (wiki, news…) sert de « vue de navigation »
const BROWSING_MODES = ['home', 'google-results', 'google-noresult', 'external-page']

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

const normalizeUrl = (s) =>
    s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')

const buildGoogleUrl = (q) =>
    `http://www.wiggle.sv/search?q=${encodeURIComponent(q).replace(/%20/g, '+')}`

// Infos d'onglet pour une page externe (wiki Shevar, etc.)
const externalTabInfo = (url) => ({
    label: new URL(url).hostname,
    url,
    icon: 'https://win98icons.alexmeub.com/icons/png/web_file-0.png',
})

// Infos d'onglet pour une page interne (wiki, news, lampion) ouverte dans un onglet nsn
const internalTabInfo = (tabId) => ({
    label: TAB_DEFS[tabId].label,
    url: TAB_DEFS[tabId].url,
    icon: TAB_DEFS[tabId].icon,
    page: tabId,
})

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

    // La fiche D.C.R. du wiki s'affiche dans le navigateur fictif.
    const externalUrl = EXTERNAL_PAGES.find(url => normalizeUrl(url) === norm)
    if (externalUrl) {
        return { type: 'OPEN_EXTERNAL', url: externalUrl }
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
    const [externalUrl, setExternalUrl] = useState(DCR_URL)
    const [glitchQuery, setGlitchQuery] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchTopic, setSearchTopic] = useState(null)
    const [status, setStatus] = useState('Terminé')
    const [addressSaved, setAddressSaved] = useState('')
    const [externalReload, setExternalReload] = useState(0)
    const [newTabs, setNewTabs] = useState([])   // onglets nsn ouverts via "+"
    const [tabOverrides, setTabOverrides] = useState({})   // pages externes par onglet nsn
    const [forwardStacks, setForwardStacks] = useState({})   // pile « Suivant » par onglet
    const [tabOrigins, setTabOrigins] = useState({})   // page d'où vient chaque onglet fixe
    const [internalPage, setInternalPage] = useState(null)   // page interne affichée dans un onglet nsn
    const newTabCounter = useRef(0)

    const isNsnTab = (id) => id === 'google' || id.startsWith('nsn-')

    const setTabOverride = (id, info) =>
        setTabOverrides(prev => ({ ...prev, [id]: info }))

    const clearTabOverride = (id) =>
        setTabOverrides(prev => {
            if (!(id in prev)) return prev
            const next = { ...prev }
            delete next[id]
            return next
        })

    // Affiche dans l'onglet la page décrite par un override (page interne ou externe)
    const applyOverride = (override) => {
        if (override.page) {
            setInternalPage(override.page)
            setContentMode('internal-page')
        } else {
            setExternalUrl(override.url)
            setContentMode('external-page')
        }
    }

    // ── Historique « Suivant » ─────────────────────────────────────
    const pushForward = (tabId, snap) =>
        setForwardStacks(prev => ({ ...prev, [tabId]: [...(prev[tabId] || []), snap] }))

    const popForward = (tabId) =>
        setForwardStacks(prev => ({ ...prev, [tabId]: (prev[tabId] || []).slice(0, -1) }))

    const clearForward = (tabId) =>
        setForwardStacks(prev => (prev[tabId]?.length ? { ...prev, [tabId]: [] } : prev))

    // Photographie de la vue actuelle (pour pouvoir y revenir avec ►)
    const getSnapshot = () => ({
        tabId: activeTab,
        contentMode,
        externalUrl,
        searchQuery,
        searchTopic,
        glitchQuery,
        internalPage,
        addressValue: addressValue || addressSaved,
        override: tabOverrides[activeTab] || null,
    })

    // Mémorise la vue d'où l'on arrive dans un onglet fixe (résultats de recherche
    // ou accueil), pour que ◄ puisse l'afficher dans ce même onglet.
    const rememberOrigin = (tabId) => {
        const fromResults = contentMode === 'google-results' || contentMode === 'google-noresult'
        setTabOrigins(prev => ({
            ...prev,
            [tabId]: fromResults
                ? { contentMode, searchQuery, searchTopic }
                : { contentMode: 'home' },
        }))
    }

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
            // Toute nouvelle navigation vide la pile « Suivant » de l'onglet
            clearForward(activeTab)
            if (!isNsnTab(activeTab)) clearForward('google')

            // Onglet qui reçoit la navigation : l'onglet courant s'il affiche déjà
            // une vue de navigation (accueil, résultats…), sinon l'onglet principal
            const navTab = isNsnTab(activeTab) || BROWSING_MODES.includes(contentMode)
                ? activeTab
                : 'google'

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
                    rememberOrigin('secret')
                    setSecretTabVisible(true)
                    setActiveTab('secret')
                    setAddressValue('sin://core')
                    setContentMode('normal')
                    break

                case 'OPEN_TAB':
                    // Depuis un onglet « + » : la page s'ouvre dans cet onglet, sans nouvel onglet.
                    // (Pour l'appliquer aussi à l'onglet principal, remplacer la condition
                    //  par `isNsnTab(activeTab) && action.tabId !== 'google'`.)
                    if (activeTab.startsWith('nsn-') && action.tabId !== 'google') {
                        if (contentMode !== 'internal-page' && contentMode !== 'external-page') rememberOrigin(activeTab)
                        setInternalPage(action.tabId)
                        setContentMode('internal-page')
                        setAddressValue(TAB_DEFS[action.tabId].url)
                        setTabOverride(activeTab, internalTabInfo(action.tabId))
                        break
                    }
                    rememberOrigin(action.tabId)
                    openTab(action.tabId)
                    setActiveTab(action.tabId)
                    setContentMode('normal')
                    setAddressValue(TAB_DEFS[action.tabId].url)
                    clearTabOverride(action.tabId)
                    break

                case 'OPEN_EXTERNAL': {
                    // Depuis l'onglet principal (ou une page fixe) : la page s'ouvre dans un NOUVEL onglet.
                    // Depuis un onglet « + » : elle s'ouvre dans l'onglet courant.
                    const isNewTab = navTab === 'google'
                    let targetTab = navTab
                    if (isNewTab) {
                        newTabCounter.current += 1
                        targetTab = `nsn-${newTabCounter.current}`
                        setNewTabs(prev => [...prev, { ...TAB_DEFS.google, id: targetTab }])
                        setActiveTab(targetTab)
                    }
                    if (isNewTab || (contentMode !== 'internal-page' && contentMode !== 'external-page')) {
                        rememberOrigin(targetTab)
                    }
                    setContentMode('external-page')
                    setExternalUrl(action.url)
                    setAddressValue(action.url)
                    setTabOverride(targetTab, externalTabInfo(action.url))
                    setExternalReload(value => value + 1)
                    break
                }

                case 'GOOGLE_RESULTS': {
                    if (navTab !== activeTab) {
                        openTab(navTab)
                        setActiveTab(navTab)
                    }
                    setSearchQuery(action.query)
                    setSearchTopic(action.topic)
                    setContentMode('google-results')
                    setAddressValue(buildGoogleUrl(action.query))
                    clearTabOverride(navTab)
                    break
                }

                case 'GOOGLE_NORESULT': {
                    if (navTab !== activeTab) {
                        openTab(navTab)
                        setActiveTab(navTab)
                    }
                    setSearchQuery(action.query)
                    setSearchTopic(null)
                    setContentMode('google-noresult')
                    setAddressValue(buildGoogleUrl(action.query))
                    clearTabOverride(navTab)
                    break
                }
                }
            })
    }, [triggerGlitch, openTab, activeTab, contentMode, searchQuery, searchTopic])

    const handleAddressFocus = () => {
        setAddressSaved(addressValue)
        setAddressValue('')
    }
    const handleAddressBlur = () => {
        if (!addressValue.trim()) setAddressValue(addressSaved)
    }

    const tabs = [
        ...openedTabs.map(id => ({ ...TAB_DEFS[id], ...tabOverrides[id] })),
        ...newTabs.map(tab => ({ ...tab, ...tabOverrides[tab.id] })),
        ...(secretTabVisible ? [secretData.secretTab] : []),
    ]

    const closeTab = (id) => {
        if (id === 'google') return
        if (id === 'secret') {
            setSecretTabVisible(false)
        } else if (id.startsWith('nsn-')) {
            setNewTabs(prev => prev.filter(t => t.id !== id))
        } else {
            setOpenedTabs(prev => prev.filter(t => t !== id))
        }
        clearTabOverride(id)
        if (activeTab === id) {
            // On revient sur l'onglet principal, en restaurant sa page externe si besoin
            const override = tabOverrides.google
            setActiveTab('google')
            if (override) {
                applyOverride(override)
                setAddressValue(override.url)
            } else {
                setAddressValue(TAB_DEFS.google.url)
                setContentMode('normal')
            }
        }
    }

    // ── Nouvel onglet nsn (bouton "+") ─────────────────────────────
    const handleNewTab = () => {
        newTabCounter.current += 1
        const id = `nsn-${newTabCounter.current}`
        setNewTabs(prev => [...prev, { ...TAB_DEFS.google, id }])
        setActiveTab(id)
        setAddressValue(TAB_DEFS.google.url)
        setContentMode('normal')
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
                rememberOrigin('secret')
                setSecretTabVisible(true)
                setActiveTab('secret')
                setAddressValue('sin://core')
                setContentMode('normal')
            })
        }
    }

    // ── Ouverture onglet ActuNet depuis MSN ────────────────────────
    const handleOpenNews = () => {
        triggerGlitch(() => {
            rememberOrigin('news')
            openTab('news')
            setActiveTab('news')
            setContentMode('normal')
            setAddressValue(TAB_DEFS.news.url)
        })
    }

    // ── Changement d'onglet ────────────────────────────────────────
    // Si l'onglet affiche une page externe (wiki Shevar), on la réaffiche
    // au lieu de revenir à l'accueil nsn.
    const handleTabChange = (id) => {
        const tab = tabs.find(t => t.id === id)
        if (!tab) return
        if (id === activeTab && contentMode !== 'glitch-search') return
        setActiveTab(id)
        setAddressValue(tab.url)
        const override = tabOverrides[id]
        if (override) {
            applyOverride(override)
        } else {
            setContentMode('normal')
        }
    }

    // ── Bouton Accueil : page d'accueil nsn dans l'onglet principal ──
    const handleHome = () => {
        clearForward('google')
        setActiveTab('google')
        setAddressValue(TAB_DEFS.google.url)
        setContentMode('normal')
        clearTabOverride('google')
    }

    // ── Bouton Précédent ───────────────────────────────────────────
    const handleBack = () => {
        const fixedTab = !isNsnTab(activeTab)           // wiki, news, lampion, secret
        const homeMode = fixedTab ? 'home' : 'normal'   // mode qui affiche l'accueil dans l'onglet

        // 1. Page propre d'un onglet fixe (wiki, news…), ou page interne ouverte en place
        //    dans un onglet nsn : on affiche, dans le même onglet, la page d'où l'on vient
        //    (résultats de recherche ou accueil)
        const onOwnPage = (fixedTab && contentMode === 'normal')
            || contentMode === 'internal-page'
            || contentMode === 'external-page'
        if (onOwnPage) {
            pushForward(activeTab, getSnapshot())
            const origin = tabOrigins[activeTab]
            if (origin && origin.contentMode !== 'home') {
                setSearchQuery(origin.searchQuery)
                setSearchTopic(origin.searchTopic)
                setContentMode(origin.contentMode)
                setAddressValue(buildGoogleUrl(origin.searchQuery))
            } else {
                setContentMode(homeMode)
                setAddressValue(TAB_DEFS.google.url)
            }
            clearTabOverride(activeTab)
            return
        }

        // 2. Recherche glitch lancée depuis un onglet fixe : on l'annule
        if (fixedTab && contentMode === 'glitch-search') {
            pushForward(activeTab, getSnapshot())
            setContentMode('normal')
            setAddressValue(tabs.find(t => t.id === activeTab)?.url ?? addressSaved)
            return
        }

        // 3. Vues de navigation (accueil, résultats)
        const isAtHome = contentMode === homeMode && !tabOverrides[activeTab]
        if (!isAtHome) pushForward(activeTab, getSnapshot())

        clearTabOverride(activeTab)
        setContentMode(homeMode)
        setAddressValue(TAB_DEFS.google.url)
    }

    // ── Bouton Suivant ─────────────────────────────────────────────
    const canGoForward = (forwardStacks[activeTab] || []).length > 0

    const handleForward = () => {
        const stack = forwardStacks[activeTab] || []
        const snap = stack[stack.length - 1]
        if (!snap) return
        popForward(activeTab)
        if (!tabs.some(t => t.id === snap.tabId)) return   // onglet fermé entre-temps

        setActiveTab(snap.tabId)
        setContentMode(snap.contentMode)
        setExternalUrl(snap.externalUrl)
        setSearchQuery(snap.searchQuery)
        setSearchTopic(snap.searchTopic)
        setGlitchQuery(snap.glitchQuery)
        setInternalPage(snap.internalPage)
        setAddressValue(snap.addressValue)
        if (snap.override) setTabOverride(snap.tabId, snap.override)
        else clearTabOverride(snap.tabId)
        if (snap.contentMode === 'external-page') setExternalReload(v => v + 1)
    }

    // ── Rendu contenu ──────────────────────────────────────────────
    const renderContent = () => {
        if (contentMode === 'external-page')
            return <iframe
                key={externalReload}
                className="browser__external-page"
                src={externalUrl}
                title="Wiki Shevar"
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="strict-origin-when-cross-origin"
            />
        if (contentMode === 'glitch-search')
            return <GlitchSearch query={glitchQuery} />
        if (contentMode === 'google-results' && searchTopic)
            return <FakeGoogleResults topic={searchTopic} query={searchQuery} onResultClick={handleInput} onSearch={handleInput}/>
        if (contentMode === 'google-noresult')
            return <FakeGoogleNoResult query={searchQuery} onSearch={handleInput} />
        if (contentMode === 'home')
            return <HomePage onSearch={handleInput} onOpenNews={handleOpenNews} />
        if (contentMode === 'internal-page') {
            if (internalPage === 'wiki') return <Wikipedia onLogoClick={handleLogoClick} />
            if (internalPage === 'news') return <NewsPortal />
            if (internalPage === 'lampion') return <LampionPage />
        }
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
                        onClick={handleBack}>◄</button>
                    <button className="browser__nav-btn" title="Suivant"
                        onClick={handleForward} disabled={!canGoForward}>►</button>
                    <button className="browser__nav-btn browser__nav-btn--stop" title="Arrêter">✕</button>
                    <button className="browser__nav-btn" title="Actualiser" onClick={() => handleInput(addressValue)}>↺</button>
                    <button className="browser__nav-btn" title="Accueil" onClick={handleHome}>🏠</button>
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
                <button
                    className="browser__tab browser__tab--new"
                    title="Nouvel onglet"
                    aria-label="Nouvel onglet"
                    onClick={handleNewTab}
                    data-testid="tab-new"
                >
                    +
                </button>
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
