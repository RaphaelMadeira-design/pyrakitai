import '../styles/Konami.scss'
import secretData from '../data/browserSecret.json'

export default function KonamiOverlay({ onDismiss }) {
    const k = secretData.konami
    return (
        <div className="konami" onClick={onDismiss} data-testid="konami-overlay">
            <div className="konami-static" />
            <div className="konami-content">
                <div className="konami-glitch" data-text={k.title}>
                    {k.title}
                </div>
                <div className="konami-body">
                    {k.lines.map((line, i) => (
                        <p key={i}>
                            {line.text}
                            {line.highlight && <span className="konami-hi">{line.highlight}</span>}
                            {line.red && <span className="konami-red">{line.red}</span>}
                        </p>
                    ))}
                    <p className="konami-dismiss">{k.dismissLabel}</p>
                </div>
            </div>
        </div>
    )
}