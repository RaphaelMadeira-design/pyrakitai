import { useState, useEffect, useRef } from 'react'
import '../styles/Wikipedia.scss'
import wikiData from '../data/browserWikipedia.json'

function WikiAudioPlayer({ voice }) {
    const audioRef = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [cur, setCur] = useState(0)
    const [dur, setDur] = useState(0)

    useEffect(() => {
        const a = audioRef.current
        if (!a) return
        const onTime = () => setCur(a.currentTime)
        const onMeta = () => setDur(a.duration || 0)
        const onEnd = () => setPlaying(false)
        a.addEventListener('timeupdate', onTime)
        a.addEventListener('loadedmetadata', onMeta)
        a.addEventListener('ended', onEnd)
        return () => {
            a.removeEventListener('timeupdate', onTime)
            a.removeEventListener('loadedmetadata', onMeta)
            a.removeEventListener('ended', onEnd)
        }
    }, [])

    const toggle = () => {
        const a = audioRef.current
        if (!a) return
        if (playing) { a.pause(); setPlaying(false) }
        else { a.play(); setPlaying(true) }
    }

    const seek = (e) => {
        const a = audioRef.current
        if (!a || !dur) return
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width
        a.currentTime = Math.max(0, Math.min(dur, pct * dur))
    }

    const pct = dur ? (cur / dur) * 100 : 0

    return (
        <div className="wiki__audio" data-testid="wiki-voice-player">
            <div className="wiki__audio-title">{voice.title}</div>
            <div className="wiki__audio-row">
                <button
                    type="button"
                    className="wiki__audio-btn"
                    onClick={toggle}
                    aria-label={playing ? 'Pause' : 'Lire'}
                    data-testid="wiki-voice-toggle"
                >
                    {playing ? '❚❚' : '▶'}
                </button>
                <div className="wiki__audio-body">
                    <div
                        className="wiki__audio-track"
                        onClick={seek}
                    >
                        <div className="wiki__audio-fill" style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>
            <audio ref={audioRef} src={voice.src} preload="metadata" />
        </div>
    )
}

export default function Wikipedia({ onLogoClick }) {
    const w = wikiData
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    return (
        <div className="wiki" data-testid="wiki-page">
            <div className="wiki__header">
                <div className="wiki__logo" onClick={onLogoClick} title={w.header.logo.title}>
                    <div className="wiki__logo-ball">
                        <img src={w.header.logo.src} alt={w.header.logo.alt} />
                    </div>
                    <div className="wiki__logo-text">
                        <strong>{w.header.logo.name}</strong>
                        <small>{w.header.logo.tagline}</small>
                    </div>
                </div>
                <div className="wiki__nav">
                    {w.header.nav.map((n, i) => <span key={i}>{n}</span>)}
                </div>
            </div>
            <div className="wiki__body">
                <div className="wiki__sidebar">
                    {w.sidebar.map((s, i) => (
                        <div key={i} className="wiki__sidebar-section">
                            <strong>{s.title}</strong>
                            <ul>{s.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                        </div>
                    ))}
                </div>
                <div className="wiki__content">
                    <h1 className="wiki__title">{w.title}</h1>
                    <div className="wiki__subtitle" dangerouslySetInnerHTML={{ __html: w.subtitleHtml }} />
                    <div className="wiki__notice" dangerouslySetInnerHTML={{ __html: w.noticeHtml }} />
                    <div className="wiki__infobox">
                        <div className="wiki__infobox-title">{w.infobox.title}</div>
                        <div className="wiki__infobox-img">
                            <img src={w.infobox.image.src} alt={w.infobox.image.alt} onError={e => { e.target.style.display = 'none' }} />
                            <small>{w.infobox.image.credit}</small>
                        </div>
                        <table className="wiki__infobox-table">
                            <tbody>
                                {w.infobox.rows.map(([k, v], i) => (
                                    <tr key={i}><th>{k}</th><td>{v}</td></tr>
                                ))}
                            </tbody>
                        </table>
                        {w.infobox.voice && <WikiAudioPlayer voice={w.infobox.voice} />}
                    </div>
                    {w.introParagraphs.map((p, i) => (
                        <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                    ))}
                    <div className="wiki__toc">
                        <div className="wiki__toc-title">{w.toc.title}</div>
                        <ol>
                            {w.toc.items.map((item, i) => (
                                <li key={i}>
                                    <span
                                        className="wiki__link"
                                        onClick={() => scrollTo(item.id)}
                                        dangerouslySetInnerHTML={{ __html: item.labelHtml }}
                                    />
                                    {item.children && (
                                        <ol>
                                            {item.children.map((c, j) => (
                                                <li key={j}>
                                                    <span
                                                        className="wiki__link"
                                                        onClick={() => scrollTo(c.id)}
                                                        dangerouslySetInnerHTML={{ __html: c.labelHtml }}
                                                    />
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                    {w.sections.map((s, i) => {
                        const HeadingTag = s.level === 2 ? 'h2' : 'h3'
                        const headingClass = s.level === 2 ? 'wiki__h2' : 'wiki__h3'
                        return (
                            <div key={i}>
                                <HeadingTag id={s.id} className={headingClass} dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                                {s.paragraphs && s.paragraphs.map((p, j) => (
                                    <p key={j} dangerouslySetInnerHTML={{ __html: p }} />
                                ))}
                                {s.list && (
                                    <ul className="wiki__list">
                                        {s.list.map((li, j) => (
                                            <li key={j} dangerouslySetInnerHTML={{ __html: li }} />
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )
                    })}
                    <div className="wiki__references">
                        <h2 id={w.references.id} className="wiki__h2">{w.references.title}</h2>
                        <ol className="wiki__ref-list">
                            {w.references.items.map((r, i) => (
                                <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
                            ))}
                        </ol>
                    </div>
                    <div className="wiki__categories">
                        <strong>Catégories :</strong>
                        {w.categories.map((c, i) => (
                            <span key={i}>
                                <span className="wiki__link">{c}</span>
                                {i < w.categories.length - 1 && ' • '}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
