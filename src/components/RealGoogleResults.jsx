import { useEffect, useRef, useState } from 'react'
import '../styles/RealGoogleResults.scss'
import searchData from '../data/browserSearch.json'

// Vrais résultats Google via le moteur de recherche personnalisé
// (programmablesearchengine.google.com). Le script n'est chargé qu'une fois.
let mountCount = 0
let cseReady = null

function loadCse(cseId) {
    if (cseReady) return cseReady
    cseReady = new Promise((resolve, reject) => {
        window.__gcse = { parsetags: 'explicit', callback: resolve }
        const s = document.createElement('script')
        s.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(cseId)}`
        s.async = true
        s.onerror = () => { cseReady = null; reject(new Error('cse')) }
        document.head.appendChild(s)
    })
    return cseReady
}

export default function RealGoogleResults({ cseId, query, onSearch }) {
    const [q, setQ] = useState(query)
    const [error, setError] = useState(false)
    const boxRef = useRef(null)
    const gr = searchData.googleResults
    const gname = useRef(`pyraki-search-${++mountCount}`).current

    useEffect(() => { setQ(query) }, [query])

    useEffect(() => {
        let cancelled = false
        loadCse(cseId)
            .then(() => {
                if (cancelled || !boxRef.current) return
                const api = window.google.search.cse.element
                let el = api.getElement(gname)
                if (!el) {
                    boxRef.current.innerHTML = ''
                    api.render({ div: boxRef.current, tag: 'searchresults-only', gname: gname })
                    el = api.getElement(gname)
                }
                el.execute(query)
            })
            .catch(() => !cancelled && setError(true))
        return () => { cancelled = true }
    }, [cseId, query, gname])

    const submit = () => { if (q.trim()) onSearch(q) }

    return (
        <div className="gresults real-gresults" data-testid="google-real-results">
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
            {error && (
                <div className="real-gresults__error">
                    Impossible de joindre le serveur. Vérifiez votre connexion modem.
                </div>
            )}
            <div className="real-gresults__box" ref={boxRef} />
        </div>
    )
}