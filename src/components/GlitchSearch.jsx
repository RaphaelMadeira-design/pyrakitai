import '../styles/GlitchSearch.scss'
import secretData from '../data/browserSecret.json'

export default function GlitchSearch({ query }) {
    const g = secretData.glitchSearch
    return (
        <div className="glitch-search" data-testid="glitch-search-page">
            <div className="glitch-header">
                <span className="glitch-logo">
                    {g.logo.map((l, i) => (
                        <span key={i} style={{ color: l.color }}>{l.letter}</span>
                    ))}
                </span>
                <div className="glitch-query-bar">
                    <span>{query}</span>
                </div>
            </div>
            <div className="glitch-count" dangerouslySetInnerHTML={{ __html: g.countHtml }} />
            <div className="glitch-results">
                {g.results.map((r, i) => (
                    <div key={i} className={'glitch-result' + (r.blocked ? ' glitch-result--blocked' : '')}>
                        {r.blocked ? (
                            <span className="glitch-result-title">{r.title}</span>
                        ) : (
                            <span className="glitch-result-title glitch__text" data-text={r.title}>
                                {r.title}
                            </span>
                        )}
                        <div className="glitch-result-url">{r.url}</div>
                        <p className="glitch-result-desc">{r.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}