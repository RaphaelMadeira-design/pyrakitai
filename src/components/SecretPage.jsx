import { useState, useEffect } from 'react'
import '../styles/Secret.scss'
import secretData from '../data/browserSecret.json'

const FRAGMENTS = secretData.fragments

export default function SecretPage() {
    const [visible, setVisible] = useState([])
    useEffect(() => {
        setVisible([])
        const timers = FRAGMENTS.map((f, i) =>
            setTimeout(() => setVisible(p => [...p, i]), f.delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <div className="secret" data-testid="secret-page">
            <div className="secret-scanlines" />
            <div className="secret-content">
                {FRAGMENTS.map((f, i) =>
                    visible.includes(i) ? (
                        <div
                            key={i}
                            className={[
                                'secret-line',
                                f.cmd ? 'secret-line--cmd' : '',
                                f.frag ? 'secret-line--frag' : '',
                                f.warn ? 'secret-line--warn' : '',
                            ].filter(Boolean).join(' ')}
                        >
                            {f.text || '\u00A0'}
                        </div>
                    ) : null
                )}
                {visible.length >= FRAGMENTS.length && (
                    <div className="secret-cursor">_</div>
                )}
            </div>
        </div>
    )
}