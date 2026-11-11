import { useMemo, useState } from 'react'
import HELP from '../data/help.json'
import '../styles/Help.scss'

const ICONS = 'https://win98icons.alexmeub.com/icons/png/'
const ICON_BOOK = `${ICONS}help_book_small-0.png`
const ICON_PAGE = `${ICONS}help_sheet-0.png`
const ICON_INFO = `${ICONS}msg_information-0.png`
const ICON_WARN = `${ICONS}msg_warning-0.png`
const ICON_ABOUT = `${ICONS}windows-0.png`
const ICON_QUESTION = `${ICONS}help_question_mark-0.png`

const ABOUT = 'about'

export const getHelpKey = (windowId = '') =>
    windowId.startsWith('notepad-') ? 'notepad' : windowId

export const hasHelp = (windowId) => Boolean(HELP.apps[getHelpKey(windowId)])

export const getHelpTitle = (key) => {
    const app = HELP.apps[key]
    return app ? `Rubriques d'aide : ${app.name}` : 'Aide'
}

export const HELP_ICON = `${ICONS}help_book_big-0.png`

function productId(key) {
    let h = 0
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
    const part = (n, len) => String(n).padStart(len, '0').slice(-len)
    return `52274-OEM-${part(h % 10000000, 7)}-${part((h >> 7) % 100000, 5)}`
}

function Topic({ topic, next, onGo }) {
    return (
        <article className="help__topic">
            <h2 className="help__topic-title">{topic.title}</h2>

            {topic.text?.map((p, i) => <p key={i}>{p}</p>)}

            {topic.steps && (
                <ol className="help__steps">
                    {topic.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
            )}

            {topic.items && (
                <ul className="help__items">
                    {topic.items.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            )}

            {topic.keys && (
                <table className="help__keys">
                    <tbody>
                        {topic.keys.map(([k, d], i) => (
                            <tr key={i}><th>{k}</th><td>{d}</td></tr>
                        ))}
                    </tbody>
                </table>
            )}

            {topic.tip && (
                <div className="help__note help__note--tip">
                    <img src={ICON_INFO} alt="" />
                    <p><strong>Astuce :</strong> {topic.tip}</p>
                </div>
            )}

            {topic.warning && (
                <div className="help__note help__note--warn">
                    <img src={ICON_WARN} alt="" />
                    <p><strong>Attention :</strong> {topic.warning}</p>
                </div>
            )}

            {next && (
                <p className="help__related">
                    Rubrique suivante :{' '}
                    <button type="button" className="help__link" onClick={() => onGo(next.id)}>
                        {next.title}
                    </button>
                </p>
            )}
        </article>
    )
}

function About({ appKey, app, pub }) {
    return (
        <article className="help__topic help__about">
            <div className="help__about-head">
                <img src={app.icon} alt="" className="help__about-icon" />
                <div>
                    <h2 className="help__topic-title">{app.name}</h2>
                    <div>Version {app.version}</div>
                    <div className="help__muted">{app.build}</div>
                </div>
            </div>

            <p>{app.description}</p>

            <div className="help__about-brand">
                <span className="help__about-logo">{pub.developer}</span>
                <span className="help__muted">{pub.group}</span>
            </div>

            <table className="help__keys">
                <tbody>
                    <tr><th>Éditeur</th><td>{pub.developer}, filiale du Groupe Astia</td></tr>
                    <tr><th>Concédé à</th><td>{pub.licensedTo}</td></tr>
                    <tr><th>N° de produit</th><td>{productId(appKey)}</td></tr>
                    <tr><th>Assistance</th><td>{pub.support}</td></tr>
                </tbody>
            </table>

            <p className="help__slogan">{pub.slogan}</p>
            <p className="help__legal">{pub.copyright}</p>
            <p className="help__legal">{pub.legal}</p>
        </article>
    )
}

export default function Help({ app: appKey }) {
    const app = HELP.apps[appKey]
    const pub = HELP.publisher

    const topics = useMemo(
        () => (app?.topics ?? []).map((t, i) => ({ ...t, id: `t${i}` })),
        [app]
    )

    const [history, setHistory] = useState([topics[0]?.id ?? ABOUT])
    const [pos, setPos] = useState(0)
    const [tab, setTab] = useState('contents')
    const [showNav, setShowNav] = useState(true)
    const [bookOpen, setBookOpen] = useState(true)
    const [query, setQuery] = useState('')

    const index = useMemo(() => {
        const entries = []
        topics.forEach(t => (t.keywords ?? []).forEach(k => entries.push({ k, id: t.id })))
        entries.push({ k: 'à propos', id: ABOUT }, { k: 'version', id: ABOUT }, { k: 'Astiasoft', id: ABOUT })
        return entries.sort((a, b) => a.k.localeCompare(b.k, 'fr'))
    }, [topics])

    if (!app) {
        return (
            <div className="help help--empty">
                <img src={ICON_QUESTION} alt="" />
                <p>Aucune aide n'est disponible pour cette application.</p>
            </div>
        )
    }

    const current = history[pos]
    const go = (id) => {
        if (id === current) return
        const next = [...history.slice(0, pos + 1), id]
        setHistory(next)
        setPos(next.length - 1)
    }

    const currentIdx = topics.findIndex(t => t.id === current)
    const nextTopic = currentIdx >= 0
        ? (topics[currentIdx + 1] ?? { id: ABOUT, title: `À propos de ${app.name}` })
        : null

    const q = query.trim().toLowerCase()
    const filtered = q ? index.filter(e => e.k.toLowerCase().includes(q)) : index

    return (
        <div className="help">
            <div className="help__toolbar">
                <button type="button" className="help__tool" onClick={() => setShowNav(v => !v)}>
                    <span className="help__tool-icon">{showNav ? '◧' : '◨'}</span>
                    {showNav ? 'Masquer' : 'Afficher'}
                </button>
                <button type="button" className="help__tool" disabled={pos === 0} onClick={() => setPos(p => p - 1)}>
                    <span className="help__tool-icon">◄</span>Précédent
                </button>
                <button type="button" className="help__tool" disabled={pos >= history.length - 1} onClick={() => setPos(p => p + 1)}>
                    <span className="help__tool-icon">►</span>Suivant
                </button>
                <button type="button" className="help__tool" onClick={() => go(topics[0]?.id ?? ABOUT)}>
                    <span className="help__tool-icon">⌂</span>Accueil
                </button>
                <button type="button" className="help__tool" onClick={() => go(ABOUT)}>
                    <span className="help__tool-icon">ⓘ</span>À propos
                </button>
            </div>

            <div className="help__body">
                {showNav && (
                    <aside className="help__nav">
                        <div className="help__tabs" role="tablist">
                            <button type="button" role="tab" aria-selected={tab === 'contents'}
                                className={`help__tab${tab === 'contents' ? ' help__tab--active' : ''}`}
                                onClick={() => setTab('contents')}>Sommaire</button>
                            <button type="button" role="tab" aria-selected={tab === 'index'}
                                className={`help__tab${tab === 'index' ? ' help__tab--active' : ''}`}
                                onClick={() => setTab('index')}>Index</button>
                        </div>

                        <div className="help__panel">
                            {tab === 'contents' ? (
                                <ul className="help__tree">
                                    <li>
                                        <button type="button" className="help__node" onClick={() => setBookOpen(o => !o)}>
                                            <img src={ICON_BOOK} alt="" />
                                            <span>{app.name}</span>
                                        </button>
                                        {bookOpen && (
                                            <ul>
                                                {topics.map(t => (
                                                    <li key={t.id}>
                                                        <button type="button"
                                                            className={`help__node${current === t.id ? ' help__node--active' : ''}`}
                                                            onClick={() => go(t.id)}>
                                                            <img src={ICON_PAGE} alt="" />
                                                            <span>{t.title}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                    <li>
                                        <button type="button"
                                            className={`help__node${current === ABOUT ? ' help__node--active' : ''}`}
                                            onClick={() => go(ABOUT)}>
                                            <img src={ICON_ABOUT} alt="" />
                                            <span>À propos de {app.name}</span>
                                        </button>
                                    </li>
                                </ul>
                            ) : (
                                <div className="help__index">
                                    <label className="help__index-label" htmlFor={`help-index-${appKey}`}>
                                        Tapez le mot-clé à rechercher :
                                    </label>
                                    <input id={`help-index-${appKey}`} className="help__index-input"
                                        value={query} onChange={e => setQuery(e.target.value)} />
                                    <ul className="help__index-list">
                                        {filtered.map((e, i) => (
                                            <li key={i}>
                                                <button type="button"
                                                    className={`help__index-item${current === e.id ? ' help__index-item--active' : ''}`}
                                                    onClick={() => go(e.id)}>
                                                    {e.k}
                                                </button>
                                            </li>
                                        ))}
                                        {filtered.length === 0 && <li className="help__muted">Aucun mot-clé trouvé.</li>}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                <main className="help__content">
                    {current === ABOUT
                        ? <About appKey={appKey} app={app} pub={pub} />
                        : <Topic topic={topics[currentIdx]} next={nextTopic} onGo={go} />}
                </main>
            </div>
        </div>
    )
}