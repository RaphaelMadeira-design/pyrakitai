import { useState, useEffect } from 'react'
import '../styles/GoogleResults.scss'
import searchData from '../data/browserSearch.json'

export function FakeGoogleResults({ topic, query, onResultClick, onSearch }) {
    const [q, setQ] = useState(query)
    useEffect(() => { setQ(query) }, [query])
    const submit = () => {
        if (q.trim()) onSearch(q)
    }
    const gr = searchData.googleResults
    return (
        <div className="gresults" data-testid="google-results">
            <div className="gresults-header">
                <div className="gresults-logo">
                    {gr.header.logo.map((l, i) => (
                        <span key={i} style={{ color: l.color }}>{l.letter}</span>
                    ))}
                </div>
                <div className="gresults-searchline">
                    <input
                        className="gresults-input"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <button className="gresults-btn" onClick={submit}>{gr.submitLabel}</button>
                </div>
            </div>
            <div className="gresults-tabs">
                {gr.tabs.map((t, i) => (
                    <span key={i} className={'gresults-tab' + (t.active ? ' gresults-tab--active' : '')}>
                        {t.label}
                    </span>
                ))}
            </div>
            <div className="gresults-count">
                Résultats <b>1 - {topic.fakes.length + 1}</b> sur environ <b>{topic.resultsCount}</b> pour <b>{query}</b>. ({topic.seconds} secondes)
            </div>

            <ol className="gresults-list">
                <li className="gresults-item gresults-item--real">
                    <a
                        className="gresults-title"
                        href="#"
                        onClick={(e) => { e.preventDefault(); onResultClick(topic.real.target) }}
                    >
                        {topic.real.title}
                    </a>
                    <p className="gresults-desc">{topic.real.desc}</p>
                    <div className="gresults-url">
                        {topic.real.url} - <span className="gresults-cache">Cache</span> - <span className="gresults-cache">Pages similaires</span>
                    </div>
                </li>

                {topic.fakes.map((r, i) => (
                    <li className="gresults-item" key={i}>
                        <span className="gresults-title gresults-title--dead">
                            {r.title}
                        </span>
                        <p className="gresults-desc">{r.desc}</p>
                        <div className="gresults-url">
                            {r.url} - <span className="gresults-cache">Cache</span> - <span className="gresults-cache">Pages similaires</span>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="gresults-pager">
                <span className="gresults-gooogle">
                    {gr.pagerLogo.map((l, i) => (
                        <span key={i} style={{ color: l.color }}>{l.letter}</span>
                    ))}
                </span>
                <div className="gresults-pages">
                    <b>1</b>
                    <span className="gresults-page-link">2</span>
                    <span className="gresults-page-link">3</span>
                    <span className="gresults-page-link">4</span>
                    <span className="gresults-page-link">5</span>
                    <span className="gresults-page-link">Suivant ›</span>
                </div>
            </div>
        </div>
    )
}

export function FakeGoogleNoResult({ query, onSearch }) {
    const [q, setQ] = useState(query)
    useEffect(() => { setQ(query) }, [query])
    const submit = () => {
        if (q.trim()) onSearch(q)
    }
    const gr = searchData.googleResults
    const nr = searchData.noResult
    return (
        <div className="gresults" data-testid="google-no-result">
            <div className="gresults-header">
                <div className="gresults-logo">
                    {gr.header.logo.map((l, i) => (
                        <span key={i} style={{ color: l.color }}>{l.letter}</span>
                    ))}
                </div>
                <div className="gresults-searchline">
                    <input
                        className="gresults-input"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                    />
                    <button className="gresults-btn" onClick={submit}>{gr.submitLabel}</button>
                </div>
            </div>
            <div className="gresults-count">
                Votre recherche - <b>{query}</b> - n&apos;a produit aucun document.
            </div>
            <div className="gresults-empty">
                <p>{nr.suggestionsTitle}</p>
                <ul>
                    {nr.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            </div>
        </div>
    )
}