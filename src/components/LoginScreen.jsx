import { useState } from 'react'
import Sounds from './Sounds'
import '../styles/LoginScreen.scss'

// ─── ÉCRAN D'ACCUEIL — affiché uniquement après le boot du PC ───
// Mot de passe décoratif : toute saisie (même vide) ouvre la session.
export default function LoginScreen({ onLogin }) {
    const [password, setPassword] = useState('')
    const [leaving, setLeaving] = useState(false)

    const submit = (e) => {
        e.preventDefault()
        if (leaving) return
        Sounds.doubleClick()
        setLeaving(true)
        setTimeout(onLogin, 650)
    }

    return (
        <div className={`login-screen${leaving ? ' login-screen--fade' : ''}`} data-testid="login-screen">
            <div className="login-screen__scanlines" />

            <div className="login-dialog" data-testid="login-dialog">
                <div className="login-dialog__titlebar">
                    <span>Ouverture de session Windows</span>
                </div>

                <form className="login-dialog__body" onSubmit={submit}>
                    <div className="login-dialog__main">
                        <div className="login-dialog__avatar-frame">
                            <img
                                src="/images/id.jpg"
                                alt="Kaï SEDO"
                                className="login-dialog__avatar"
                            />
                        </div>

                        <div className="login-dialog__fields">
                            <div className="login-dialog__user" data-testid="login-username">
                                Kaï SEDO
                            </div>
                            <label className="login-dialog__label" htmlFor="login-password">
                                Mot de passe :
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                className="win98-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                autoComplete="off"
                                spellCheck={false}
                                data-testid="login-password-input"
                            />
                        </div>
                    </div>

                    <div className="login-dialog__actions">
                        <button
                            type="submit"
                            className="win98-btn"
                            data-testid="login-submit"
                        >
                            OK
                        </button>
                    </div>

                    <div className="login-dialog__hint">
                        Après l'ouverture de session, Windows chargera vos paramètres personnels.
                    </div>
                </form>
            </div>
        </div>
    )
}