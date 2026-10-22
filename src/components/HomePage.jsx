import { useState } from 'react'
import '../styles/Home.scss'
import homeData from '../data/browserHome.json'

export default function HomePage({ onSearch, onOpenNews }) {
    const [query, setQuery] = useState('')
    const [hotmailUser, setHotmailUser] = useState('')
    const [hotmailPass, setHotmailPass] = useState('')

    const handleSearch = () => {
        const q = query.trim()
        if (!q) return

        onSearch(q)
    }

    const m = homeData

    return (
        <div className="home" data-testid="home-page">

            {/* BAND 1 : logo + promo + date */}
            <div className="home-top">
                <div className="home-logo">
                    <span className="home-logo-text">{m.logo.text}</span>
                    <span className="home-logo-sub">{m.logo.sub}</span>
                </div>
                <div className="home-promo" dangerouslySetInnerHTML={{ __html: m.promoHtml }} />
                <div className="home-date">{m.date.month} <strong>{m.date.day}</strong></div>
            </div>

            {/* BAND 2 : barre bleue Search */}
            <div className="home-searchbar">
                <span className="home-searchbar-arrows">»</span>
                <span className="home-searchbar-label" dangerouslySetInnerHTML={{ __html: m.searchbarLabelHtml }} />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    data-testid="msn-search-input"
                />
                <button className="home-searchbar-go" onClick={handleSearch}>go</button>
            </div>

            {/* BAND 3 : nav blanche/noire */}
            <div className="home-mainnav">
                {m.mainNav.map((label, i) => (
                    <span key={i} className={'home-mainnav-item' + (i === 0 ? ' home-mainnav-item--active' : '')}>
                        {label}
                    </span>
                ))}
                <div className="home-mainnav-spacer" />
                <div className="home-mainnav-passport">
                    <em>Passport</em>
                    <strong>Se connecter</strong>
                </div>
            </div>

            {/* BAND 4 : sous-nav bleue */}
            <div className="home-subnav">
                {m.subNavCols.map((col, i) => (
                    <div key={i} className="home-subnav-col">
                        {col.map((label, j) => (
                            <span key={j} className="link">{label}</span>
                        ))}
                    </div>
                ))}
                <div className="home-subnav-ad" onClick={onOpenNews}>
                    <span dangerouslySetInnerHTML={{ __html: m.subNavAdHtml }} />
                    <em>{m.subNavAdCta}</em>
                </div>
            </div>

            {/* BAND 5 : corps 3 colonnes */}
            <div className="home-body">

                {/* gauche : catégories */}
                <div className="home-cats">
                    {m.categories.map((c, i) => {
                        const label = typeof c === 'string' ? c : c.label
                        const isNew = typeof c === 'object' && c.isNew
                        return (
                        <span key={i} className="home-cats-item">
                            {label}{isNew && <em>New!</em>}
                        </span>
                        )
                    })}
                </div>

                {/* centre */}
                <div className="home-center">

                    <div className="home-shortcuts">
                        {m.shortcuts.map((s, i) => (
                            <span key={i} className={'link' + (s.orange ? ' is-orange' : '')}>{s.label}</span>
                        ))}
                    </div>

                    <div className="home-feature">
                        <div className="home-feature-title" onClick={onOpenNews}>
                            {m.feature1.title}
                        </div>
                        <div className="home-feature-row-1">
                            <div>
                                <div className="home-feature-img-1">
                                    <img src={m.feature1.image.src} alt="" />
                                    <div className="home-feature-img-1-credit">{m.feature1.image.credit}</div>
                                </div>
                                <div className="home-feature-caption">{m.feature1.image.caption}</div>
                            </div>
                        </div>
                    </div>

                    <div className="home-feature">
                        <div className="home-feature-title" onClick={onOpenNews}>
                            {m.feature2.title}
                        </div>
                        <div className="home-feature-row-2">
                            <div>
                                <div className="home-feature-img-2">
                                    <img src={m.feature2.image.src} alt="" />
                                </div>
                                <div className="home-feature-caption">{m.feature2.image.caption}</div>
                            </div>
                            <div className="home-feature-also">
                                <h3>{m.feature2.alsoTitle}</h3>

                                {m.feature2.alsoList?.length > 0 && (
                                    <ul>
                                        {m.feature2.alsoList.map((l, i) => (
                                            <li key={i}><span className="link">{l}</span></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="home-connect">
                        <div className="home-connect-list">
                            <h3>{m.connect.title}</h3>
                            <ul>
                                {m.connect.list.map((l, i) => (
                                    <li key={i}><span className="link">{l}</span></li>
                                ))}
                            </ul>
                        </div>
                        <div className="home-connect-side">
                            <div className="home-connect-side-img">
                                <img src={m.connect.side.img} alt="" />
                            </div>
                            <span className="home-connect-side-label">
                                {m.connect.side.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* droite : message center */}
                <div className="home-msgcenter">
                    <h2>{m.messageCenter.title}</h2>
                    <label>{m.messageCenter.emailLabel}</label>
                    <label>{m.messageCenter.userLabel}</label>
                    <input value={hotmailUser} onChange={e => setHotmailUser(e.target.value)} />
                    <label>{m.messageCenter.passLabel}</label>
                    <input type="password" value={hotmailPass} onChange={e => setHotmailPass(e.target.value)} />
                    <div className="home-msgcenter-actions">
                        <button>go</button>
                    </div>
                    <span className="home-msgcenter-link">{m.messageCenter.signupLabel}</span>

                    <h3>{m.messageCenter.peopleTitle}</h3>
                    {m.messageCenter.peopleLinks.map((l, i) => (
                        <span key={i} className="home-msgcenter-link">{l}</span>
                    ))}
                </div>
            </div>

            {/* BAND 6 : help */}
            <div className="home-help">{m.helpLabel}</div>

            {/* BAND 7 : footer */}
            <div className="home-footer">
                {m.footerBlocks.map((b, i) => (
                    <div key={i} className="home-footer-block">
                        <div className="home-footer-block-hd">{b.head}</div>
                        <div className="home-footer-block-body">
                            {b.h4 && <h4>{b.h4}</h4>}
                            {b.items && (
                                <ul>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                            )}
                            {b.links && b.links.map((l, j) => (
                                <span key={j} className="link">{l}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
