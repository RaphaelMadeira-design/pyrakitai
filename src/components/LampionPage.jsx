import '../styles/Lampion.scss'
import lampion from '../data/browserLampion.json'

const L = lampion

function MenuSection({ section }) {
    return (
        <div className="lampion__menu-section">
            <h3 className="lampion__menu-title">{section.title}</h3>
            <ul className="lampion__menu-list">
                {section.items.map(it => (
                    <li key={it.name} className={`lampion__menu-item${it.special ? ' is-special' : ''}`}>
                        <div className="lampion__menu-line">
                            <span className="lampion__menu-name">{it.name}</span>
                            <span className="lampion__menu-dots" />
                            <span className="lampion__menu-price">{it.price} {L.currency}</span>
                        </div>
                        <div className="lampion__menu-desc">{it.desc}</div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function RentSign() {
    return (
        <div className="lampion__sign" data-testid="lampion-rent-sign">
            <span className="lampion__sign-pin" />
            <div className="lampion__sign-title">{L.sign.title}</div>
            {L.sign.lines.map((l, i) => (
                <p key={i} className={i === 1 ? 'lampion__sign-strong' : ''}>{l}</p>
            ))}
            <div className="lampion__sign-signature">{L.sign.signature}</div>
        </div>
    )
}

function Hours() {
    return (
        <div className="lampion__box" data-testid="lampion-hours">
            <div className="lampion__box-title">Horaires d'ouverture</div>
            <table className="lampion__hours">
                <tbody>
                    {L.hours.map(h => (
                        <tr key={h.day} className={h.time === 'Fermé' ? 'is-closed' : ''}>
                            <td>{h.day}</td>
                            <td>{h.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="lampion__hours-note">{L.hoursNote}</p>
        </div>
    )
}

export default function LampionPage() {
    return (
        <div className="lampion" data-testid="lampion-page">
            <header className="lampion__header">
                <span className="lampion__lantern" aria-hidden="true" />
                <div>
                    <h1 className="lampion__name">{L.name}</h1>
                    <div className="lampion__tagline">{L.tagline}</div>
                </div>
                <span className="lampion__lantern" aria-hidden="true" />
            </header>

            <div className="lampion__marquee"><span>{L.marquee}</span></div>

            <div className="lampion__body">
                <main className="lampion__main">
                    <p className="lampion__welcome">{L.welcome}</p>
                    <div className="lampion__menu" data-testid="lampion-menu">
                        <h2 className="lampion__menu-heading">La carte de {L.owner}</h2>
                        {L.menu.map(s => <MenuSection key={s.title} section={s} />)}
                    </div>
                </main>

                <aside className="lampion__side">
                    <RentSign />
                    <Hours />
                    <div className="lampion__box">
                        <div className="lampion__box-title">Nous trouver</div>
                        <p>{L.address}</p>
                        <p>Courriel : <u>{L.contact}</u></p>
                    </div>
                </aside>
            </div>

            <footer className="lampion__footer">
                <div className="lampion__counter">
                    Vous êtes le visiteur n° <span data-testid="lampion-counter">{L.visitors}</span>
                </div>
                <div>{L.footer}</div>
            </footer>
        </div>
    )
}