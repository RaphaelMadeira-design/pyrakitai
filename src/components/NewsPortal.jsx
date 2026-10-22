import { useState } from 'react'
import '../styles/News.scss'
import newsData from '../data/browserActunet.json'

const NEWS_DATE = newsData.date
const TICKER_ITEMS = newsData.tickerItems
const NEWS_ARTICLES = newsData.articles
const NEWS_BRIEFS = newsData.briefs
const TICKER_STR = TICKER_ITEMS.join('  ◆  ') + '  ◆  '

export default function NewsPortal() {
    const [activeArticle, setActiveArticle] = useState(null)

    if (activeArticle) {
        return (
            <div className="news-art">
                <div className="news-art-bar">
                    <button className="news-back" onClick={() => setActiveArticle(null)}>
                        « Retour aux actualités
                    </button>
                    <span className="news-art-cat" style={{ color: activeArticle.catColor }}>
                        {activeArticle.category}
                    </span>
                </div>
                <div className="news-art-body">
                    <div className="news-art-meta">
                        {activeArticle.date} &nbsp;|&nbsp; ActuNet Actualités
                    </div>
                    <h1 className="news-art-title">{activeArticle.headline}</h1>
                    <p className="news-art-lead">{activeArticle.summary}</p>
                    <hr className="news-hr" />
                    {activeArticle.paragraphs.map((p, i) => (
                        <p key={i} className="news-art-p">{p}</p>
                    ))}
                    <div className="news-art-foot">
                        <span dangerouslySetInnerHTML={{ __html: newsData.articleFooterHtml }} />
                        {newsData.articleFooterLinks.map((l, i) => (
                            <span key={i}>
                                <span className="news-link">{l}</span>
                                {i < newsData.articleFooterLinks.length - 1 && ' | '}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const featured  = NEWS_ARTICLES[0]
    const secondary = NEWS_ARTICLES.slice(1, 3)
    const rest      = NEWS_ARTICLES.slice(3)

    return (
        <div className="news">
            <div className="news-header">
                <div className="news-logo">
                    <span className="news-logo-a">Actu</span>
                    <span className="news-logo-b">Net</span>
                    <span className="news-logo-tag">Actualités</span>
                </div>
                <div className="news-header-r">
                    <span className="news-datestr">{NEWS_DATE}</span>
                    <div className="news-search">
                        <input className="news-search-input" placeholder="Rechercher…" readOnly />
                        <button className="news-search-btn">OK</button>
                    </div>
                </div>
            </div>

            <div className="news-nav">
                {newsData.nav.map((c, i) => (
                    <span key={c} className="news-nav-item">
                        {i > 0 && <span className="news-nav-sep">|</span>}
                        {c}
                    </span>
                ))}
            </div>

            <div className="news-ticker">
                <span className="news-ticker-label">FLASH</span>
                <div className="news-ticker-wrap">
                    <span className="news-ticker-track">
                        {TICKER_STR}{TICKER_STR}
                    </span>
                </div>
            </div>

            <div className="news-body">

                <div className="news-sidebar">
                    <div className="news-sb-section">
                        <div className="news-sb-title">RUBRIQUES</div>
                        {newsData.sidebarCategories.map(c => (
                            <div key={c} className="news-sb-link">{c}</div>
                        ))}
                    </div>
                    <div className="news-sb-section">
                        <div className="news-sb-title">MÉTÉO</div>
                        <div className="news-weather">
                            <div className="news-weather-city">{newsData.weather.city}</div>
                            <div className="news-weather-temp">{newsData.weather.temp}</div>
                            <div className="news-weather-desc">{newsData.weather.desc}</div>
                        </div>
                    </div>
                    <div className="news-sb-section">
                        <div className="news-sb-title">EN BREF</div>
                        {NEWS_BRIEFS.map((b, i) => (
                            <div key={i} className="news-brief">{b}</div>
                        ))}
                    </div>
                    <div className="news-ad">
                        <div>{newsData.ad.label}</div>
                        <strong>{newsData.ad.title}</strong>
                        {newsData.ad.lines.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </div>

                <div className="news-main">
                    <div className="news-featured">
                        <span className="news-catbadge" style={{ background: featured.catColor }}>
                            {featured.category}
                        </span>
                        <h2
                            className="news-feat-title news-link"
                            onClick={() => setActiveArticle(featured)}
                        >
                            {featured.headline}
                        </h2>
                        <div className="news-feat-meta">{featured.date}</div>
                        <p className="news-feat-summary">{featured.summary}</p>
                        <span className="news-readmore news-link" onClick={() => setActiveArticle(featured)}>
                            Lire la suite ›
                        </span>
                    </div>

                    <hr className="news-hr" />
                    <div className="news-section-hd">ACTUALITÉS RÉCENTES</div>

                    <div className="news-grid">
                        {secondary.map(art => (
                            <div key={art.id} className="news-card">
                                <div className="news-card-cat" style={{ color: art.catColor }}>
                                    [{art.category}]
                                </div>
                                <div
                                    className="news-card-title news-link"
                                    onClick={() => setActiveArticle(art)}
                                >
                                    {art.headline}
                                </div>
                                <div className="news-card-meta">{art.date}</div>
                                <p className="news-card-sum">{art.summary}</p>
                                <span className="news-readmore news-link" onClick={() => setActiveArticle(art)}>
                                    Lire ›
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr className="news-hr" />
                    <div className="news-section-hd">AUTRES ARTICLES</div>

                    <div className="news-list">
                        {rest.map(art => (
                            <div key={art.id} className="news-listitem">
                                <span className="news-card-cat" style={{ color: art.catColor }}>
                                    [{art.category}]
                                </span>{' '}
                                <span
                                    className="news-link"
                                    onClick={() => setActiveArticle(art)}
                                >
                                    {art.headline}
                                </span>
                                <span className="news-listitem-date"> — {art.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="news-footer">
                {newsData.footer}
                <br />
                <small>{newsData.footerSmall}</small>
            </div>
        </div>
    )
}
