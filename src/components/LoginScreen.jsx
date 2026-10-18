import { useEffect, useRef, useState } from 'react'
import Sounds from './Sounds'
import '../styles/LoginScreen.scss'

const PASSWORD_LENGTH = 16

// ─── ÉCRAN D'ACCUEIL — affiché uniquement après le boot du PC ───
// Mot de passe factice : il se tape tout seul au clic sur le champ.
export default function LoginScreen({ onLogin }) {
    const [typed, setTyped] = useState(0)
    const [typing, setTyping] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const timer = useRef(null)

    useEffect(() => () => clearTimeout(timer.current), [])

    const typeNext = (count) => {
        setTyped(count)
        if (count >= PASSWORD_LENGTH) {
            setTyping(false)
            return
        }
        timer.current = setTimeout(() => typeNext(count + 1), 55 + Math.random() * 45)
    }

    const startTyping = () => {
        if (typing || typed > 0) return
        setTyping(true)
        timer.current = setTimeout(() => typeNext(1), 120)
    }

    const done = typed >= PASSWORD_LENGTH

    const submit = (e) => {
        e.preventDefault()
        if (!done || leaving) return
        Sounds.doubleClick()
        setLeaving(true)
        setTimeout(onLogin, 650)
    }

    return (
        <div className={`login-screen${leaving ? ' login-screen--fade' : ''}`} data-testid="login-screen">
            <div className="login-screen__scanlines" />

            <div className="login-dialog" data-testid="login-dialog">
                <div className="login-dialog__titlebar">
                    <span>Ouverture de session WindOS</span>
                </div>

                <form className="login-dialog__body" onSubmit={submit}>
                    <div className="login-dialog__avatar-frame" data-testid="login-avatar">
                        <img src="/images/id.jpg" alt="Kaï SEDO" className="login-dialog__avatar" />
                    </div>

                    <div className="login-dialog__user" data-testid="login-username">
                        Sin'aän KITAÏ
                    </div>

                    <div className="login-dialog__field">
                        <span className="login-dialog__label" id="login-password-label">
                            Mot de passe :
                        </span>
                        <div
                            role="textbox"
                            aria-labelledby="login-password-label"
                            aria-readonly="true"
                            tabIndex={0}
                            className={`win98-input login-dialog__password${typing || typed > 0 ? ' is-focused' : ''}`}
                            onClick={startTyping}
                            data-testid="login-password-input"
                        >
                            <span data-testid="login-password-value">{'*'.repeat(typed)}</span>
                            {(typing || typed > 0) && <span className="login-dialog__caret" />}
                        </div>
                    </div>

                    <div className="login-dialog__actions">
                        <button type="submit" className="win98-btn" disabled={!done} data-testid="login-submit">
                            Se connecter
                        </button>
                    </div>

                    <div className="login-dialog__hint">
                        Après l'ouverture de session, WindOS chargera vos paramètres personnels.
                    </div>
                </form>
            </div>
        </div>
    )
}