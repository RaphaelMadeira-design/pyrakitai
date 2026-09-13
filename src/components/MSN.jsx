import { useState, useRef, useEffect, useCallback } from 'react'
import Sounds from '../components/Sounds'
import Win98Window from './Win98Window'
import msnData from '../data/msn.json'
import '../styles/msn.scss'

// ─── DATA (depuis msn.json) ─────────────────────────────────────
const CREDENTIALS   = msnData.credentials
const USER          = msnData.user
const CONTACTS      = msnData.contacts
const CONVERSATIONS = msnData.conversations

// ─── MSN LOGIN ──────────────────────────────────────────────────
function MSNLogin({ onLogin, onClose, onMinimize, onFocus, focused, zIndex }) {
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [error, setError]       = useState('')
    const [loading, setLoading]   = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            if (email.trim() === CREDENTIALS.email && password === CREDENTIALS.password) {
                Sounds.msnNotify()
                onLogin()
            } else {
                Sounds.error()
                setError('Adresse de messagerie ou mot de passe incorrect. Vérifiez vos informations et réessayez.')
                setLoading(false)
            }
        }, 1200)
    }

    return (
        <Win98Window
            id="msn-login"
            title="NSN Messenger"
            icon="/images/icons/16x16/messenger.png"
            onClose={onClose}
            onMinimize={onMinimize}
            onFocus={onFocus}
            focused={focused}
            zIndex={zIndex}
            defaultPosition={{ x: 200, y: 60 }}
            defaultSize={{ width: 340, height: 360 }}
            hideMaximize
        >
            <div className="msn-header">
                <div className="msn-header__logo">
                    <img src="/images/icons/32x32/messenger.png" />
                </div>
                <div>
                    <div className="msn-header__title">NSN Messenger</div>
                    <div className="msn-header__subtitle">La messagerie instantanée Windows</div>
                </div>
            </div>

            <div className="msn-login__body">
                <form onSubmit={handleSubmit}>
                    <div className="msn-login__form-group">
                        <label className="msn-login__label">Adresse de messagerie :</label>
                        <input
                            type="text"
                            className="win98-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            data-testid="msn-email-input"
                        />
                    </div>
                    <div className="msn-login__form-group">
                        <label className="msn-login__label">Mot de passe :</label>
                        <input
                            type="password"
                            className="win98-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="off"
                            data-testid="msn-password-input"
                        />
                    </div>

                    {error && (
                        <div className="msn-login__error" data-testid="msn-login-error">
                            ⚠ {error}
                        </div>
                    )}

                    <div className="msn-login__checkbox-row">
                        <input type="checkbox" id="msn-remember" />
                        <label htmlFor="msn-remember">Mémoriser mon mot de passe</label>
                    </div>

                    <div className="msn-login__actions">
                        <button type="submit" className="win98-btn" disabled={loading} data-testid="msn-login-btn">
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                        <button type="button" className="win98-btn" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>

            <div className="msn-login__copyright">
                © 1999 Microsoft Corporation. Tous droits réservés.
            </div>
        </Win98Window>
    )
}

// ─── MSN CONTACT LIST ────────────────────────────────────────────
function MSNContactList({ onOpenChat, onClose, onMinimize, onFocus, focused, zIndex }) {
    const [expanded, setExpanded] = useState({ online: true, offline: true })

    const online  = CONTACTS.filter(c => c.status === 'online' || c.status === 'away')
    const offline = CONTACTS.filter(c => c.status === 'offline')
    const toggle  = (group) => setExpanded(p => ({ ...p, [group]: !p[group] }))

    return (
        <Win98Window
            id="msn-contacts"
            title="NSN Messenger"
            icon="/images/icons/16x16/messenger.png"
            onClose={onClose}
            onMinimize={onMinimize}
            onFocus={onFocus}
            focused={focused}
            zIndex={zIndex}
            defaultPosition={{ x: 90, y: 70 }}
            defaultSize={{ width: 260, height: 430 }}
        >
            <div className="msn-contacts__user-bar">
                <span className="msn-dot msn-dot--online" />
                <div>
                    <div className="msn-contacts__user-name">{USER.displayName}</div>
                    <div className="msn-contacts__user-status">{USER.status}</div>
                </div>
            </div>

            <div className="msn-contacts__body" data-testid="msn-contacts-list">
                <div className="msn-group-header" onClick={() => toggle('online')} data-testid="msn-group-online">
                    <span className="msn-group-header__arrow">{expanded.online ? '▼' : '▶'}</span>
                    <span>En ligne ({online.length})</span>
                </div>
                {expanded.online && online.map(contact => (
                    <ContactItem key={contact.id} contact={contact} onDoubleClick={() => onOpenChat(contact.id)} />
                ))}

                <div className="msn-group-header" onClick={() => toggle('offline')} data-testid="msn-group-offline">
                    <span className="msn-group-header__arrow">{expanded.offline ? '▼' : '▶'}</span>
                    <span>Hors ligne ({offline.length})</span>
                </div>
                {expanded.offline && offline.map(contact => (
                    <ContactItem key={contact.id} contact={contact} onDoubleClick={() => onOpenChat(contact.id)} />
                ))}
            </div>

            <div className="msn-contacts__toolbar">
                <button className="win98-btn msn-toolbar-btn">Contacts</button>
                <button className="win98-btn msn-toolbar-btn">Outils</button>
                <button className="win98-btn msn-toolbar-btn">Aide</button>
            </div>
        </Win98Window>
    )
}

function ContactItem({ contact, onDoubleClick }) {
    return (
        <div
            className={`msn-contact-item ${contact.status === 'offline' ? 'msn-contact-item--offline' : ''}`}
            onDoubleClick={onDoubleClick}
            title="Double-cliquez pour ouvrir la conversation"
            data-testid={`msn-contact-${contact.id}`}
        >
            <span className={`msn-dot msn-dot--${contact.status}`} />
            <div>
                <div className="msn-contact-item__name">{contact.name}</div>
                {contact.personalMessage && (
                    <div className="msn-contact-item__msg">{contact.personalMessage}</div>
                )}
            </div>
        </div>
    )
}

// ─── MSN CHAT WINDOW ─────────────────────────────────────────────
function MSNChat({ contact, index, onClose, onFocus, focused, zIndex }) {
    const chatRef = useRef(null)
    const conv    = CONVERSATIONS[contact.id]

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, [])

    return (
        <Win98Window
            id={`msn-chat-${contact.id}`}
            title={`Conversation avec ${contact.name}`}
            icon="/images/icons/16x16/messenger.png"
            onClose={onClose}
            onFocus={onFocus}
            focused={focused}
            zIndex={zIndex}
            defaultPosition={{ x: 370 + index * 30, y: 70 + index * 20 }}
            defaultSize={{ width: 390, height: 440 }}
        >
            <div className="msn-chat__contact-bar">
                <span className={`msn-dot msn-dot--${contact.status}`} />
                <div>
                    <div className="msn-chat__contact-name">{contact.name}</div>
                    <div className="msn-chat__contact-status">
                        {contact.personalMessage || (contact.status === 'offline' ? 'Hors ligne' : 'En ligne')}
                    </div>
                </div>
            </div>

            <div className="msn-chat__messages" ref={chatRef} data-testid={`msn-chat-messages-${contact.id}`}>
                {conv.date && <div className="msn-chat__separator">{conv.date}</div>}
                {conv.messages.map((msg, i) => {
                    const isSystem = msg.from === 'system'
                    const isSelf   = msg.from === USER.name

                    if (isSystem) {
                        return (
                            <div key={i} className="msn-msg">
                                <span className="msn-msg__text msn-msg__text--system">{msg.text}</span>
                            </div>
                        )
                    }

                    return (
                        <div key={i} className="msn-msg">
                            <div className="msn-msg__header">
                                <span
                                    className={`msn-msg__sender ${isSelf ? 'msn-msg__sender--self' : 'msn-msg__sender--other'}`}
                                    style={!isSelf ? { color: contact.senderColor } : {}}
                                >
                                    {msg.from} dit :
                                </span>
                                {msg.time && <span className="msn-msg__time">({msg.time})</span>}
                            </div>
                            <div className={`msn-msg__text ${msg.italic ? 'msn-msg__text--italic' : ''}`}>
                                {msg.text}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="msn-chat__input-area">
                <div className="msn-chat__input-label">{USER.name} dit :</div>
                <textarea
                    className="msn-chat__textarea"
                    placeholder="Tapez votre message ici..."
                    data-testid={`msn-chat-input-${contact.id}`}
                    disabled={contact.status === 'offline'}
                />
                <div className="msn-chat__actions">
                    <button
                        className="win98-btn msn-chat__action-btn"
                        disabled={contact.status === 'offline'}
                        title={contact.status === 'offline' ? 'Ce contact est hors ligne' : ''}
                    >
                        Envoyer
                    </button>
                    <button className="win98-btn msn-chat__action-btn">Bloquer</button>
                </div>
            </div>
        </Win98Window>
    )
}

// ─── MAIN MSN APP ────────────────────────────────────────────────
let msnZCounter = 100

export default function MSNApp({ onClose, onMinimize }) {
    const [phase, setPhase]         = useState('login')
    const [openChats, setOpenChats] = useState([])
    const [focusedId, setFocusedId] = useState(null)
    const [zMap, setZMap]           = useState({})

    const bringToFront = useCallback((id) => {
        msnZCounter += 1
        setZMap(prev => ({ ...prev, [id]: msnZCounter }))
        setFocusedId(id)
    }, [])

    // Initialize focus/z for the first window shown
    useEffect(() => {
        const id = phase === 'login' ? 'msn-login' : 'msn-contacts'
        if (zMap[id] === undefined) bringToFront(id)
    }, [phase, zMap, bringToFront])

    const openChat = (id) => {
        if (!openChats.includes(id)) {
            Sounds.msnNotify()
            setOpenChats(p => [...p, id])
            bringToFront(`msn-chat-${id}`)
        } else {
            bringToFront(`msn-chat-${id}`)
        }
    }
    const closeChat = (id) => setOpenChats(p => p.filter(c => c !== id))

    // Wrap callbacks: shared Win98Window passes id, but MSN's onClose/onMinimize ignore it
    const closeWrap = () => onClose()
    const minimizeWrap = () => onMinimize()

    return (
        <>
            {phase === 'login' ? (
                <MSNLogin
                    onLogin={() => setPhase('contacts')}
                    onClose={closeWrap}
                    onFocus={bringToFront}
                    onMinimize={minimizeWrap}
                    focused={focusedId === 'msn-login'}
                    zIndex={zMap['msn-login']}
                />
            ) : (
                <MSNContactList
                    onOpenChat={openChat}
                    onClose={closeWrap}
                    onMinimize={minimizeWrap}
                    onFocus={bringToFront}
                    focused={focusedId === 'msn-contacts'}
                    zIndex={zMap['msn-contacts']}
                />
            )}

            {openChats.map((contactId, i) => {
                const contact = CONTACTS.find(c => c.id === contactId)
                const winId = `msn-chat-${contactId}`
                return (
                    <MSNChat
                        key={contactId}
                        contact={contact}
                        index={i}
                        onClose={() => closeChat(contactId)}
                        onFocus={bringToFront}
                        focused={focusedId === winId}
                        zIndex={zMap[winId] ?? 100}
                    />
                )
            })}
        </>
    )
}