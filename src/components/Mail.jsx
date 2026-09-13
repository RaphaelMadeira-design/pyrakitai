import { useState } from 'react'
import '../styles/Mail.scss'
import mailData from '../data/mail.json'

const { icons: ICONS, folders: FOLDERS_RAW, mailboxLabel: MAILBOX_LABEL, inbox: INBOX_RAW, sent: SENT_RAW, drafts: DRAFTS_RAW, spam: SPAM_RAW = [], trash: TRASH_RAW } = mailData

// Folders enrichis avec l'icône résolue depuis la table des icônes
const FOLDERS = FOLDERS_RAW.map(f => ({ ...f, icon: ICONS[f.iconKey] }))

// Normalise body : tableau de lignes -> string (sinon laisse tel quel)
const normalizeMail = (m) => ({
    ...m,
    body: Array.isArray(m.body) ? m.body.join('\n') : m.body,
})

const INBOX  = INBOX_RAW.map(normalizeMail)
const SENT   = SENT_RAW.map(normalizeMail)
const DRAFTS = DRAFTS_RAW.map(normalizeMail)
const SPAM   = SPAM_RAW.map(normalizeMail)
const TRASH  = TRASH_RAW.map(normalizeMail)

// Table des dossiers -> tableau de messages
const FOLDER_MESSAGES = {
    inbox: INBOX,
    sent: SENT,
    drafts: DRAFTS,
    spam: SPAM,
    trash: TRASH,
}

export default function Mail() {
    const [folder, setFolder] = useState('inbox')
    const [selected, setSelected] = useState(INBOX[0] || null)
    const [readIds, setReadIds] = useState(() => new Set(INBOX.filter(m => !m.unread).map(m => m.id)))

    const messages = FOLDER_MESSAGES[folder] || []

    const handleSelect = (msg) => {
        setSelected(msg)
        if (!readIds.has(msg.id)) {
            setReadIds(prev => new Set([...prev, msg.id]))
        }
    }

    const unreadCount = INBOX.filter(m => !readIds.has(m.id)).length

    return (
        <div className="mail" data-testid="mail-window">
            {/* Menubar */}
            <div className="mail__menubar">
                {['Fichier', 'Édition', 'Affichage', 'Outils'].map(m => (
                    <span key={m} className="mail__menu"><u>{m[0]}</u>{m.slice(1)}</span>
                ))}
            </div>

            {/* Toolbar */}
            <div className="mail__toolbar">
                <ToolBtn icon={ICONS.newMail} label="Nouveau" />
                <div className="mail__sep" />
                <ToolBtn icon={ICONS.reply} label="Répondre" />
                <ToolBtn icon={ICONS.forward} label="Transférer" />
                <div className="mail__sep" />
                <ToolBtn icon={ICONS.delete} label="Supprimer" />
                <ToolBtn icon={ICONS.print} label="Imprimer" />
            </div>

            {/* Body : 2 panneaux (dossiers | messages+preview) */}
            <div className="mail__body">
                {/* Folder tree */}
                <div className="mail__sidebar">
                    <div className="mail__sb-title">Dossiers</div>
                    <div className="mail__sb-tree">
                        <div className="mail__sb-root">
                            <img src={ICONS.inbox} alt="" />
                            <span>{MAILBOX_LABEL}</span>
                        </div>
                        {FOLDERS.map(f => (
                            <div
                                key={f.id}
                                className={`mail__folder${folder === f.id ? ' is-active' : ''}`}
                                onClick={() => { setFolder(f.id); setSelected(null) }}
                                data-testid={`outlook-folder-${f.id}`}
                            >
                                <img src={f.icon} alt="" />
                                <span>{f.label}</span>
                                {f.id === 'inbox' && unreadCount > 0 && (
                                    <span className="mail__badge">({unreadCount})</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right pane : list + preview */}
                <div className="mail__right">
                    <div className="mail__list">
                        <div className="mail__list-head">
                            <div className="col-flag"></div>
                            <div className="col-from">De</div>
                            <div className="col-subj">Objet</div>
                            <div className="col-date">Reçu</div>
                        </div>
                        <div className="mail__list-body">
                            {messages.length === 0 && (
                                <div className="mail__empty">— Aucun message —</div>
                            )}
                            {messages.map(m => {
                                const isUnread = !readIds.has(m.id) && folder === 'inbox'
                                const isSel = selected?.id === m.id
                                return (
                                    <div
                                        key={m.id}
                                        className={`mail__row${isSel ? ' is-sel' : ''}${isUnread ? ' is-unread' : ''}`}
                                        onClick={() => handleSelect(m)}
                                        data-testid={`outlook-msg-${m.id}`}
                                    >
                                        <div className="col-flag">
                                            <img src={isUnread ? ICONS.mailUnread : ICONS.mailRead} alt="" />
                                        </div>
                                        <div className="col-from">{m.from}</div>
                                        <div className="col-subj">{m.subject}</div>
                                        <div className="col-date">{m.date}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Preview pane */}
                    <div className="mail__preview">
                        {selected ? (
                            <>
                                <div className="mail__prev-head">
                                    <div><b>De :</b> {selected.from} &lt;{selected.fromAddr}&gt;</div>
                                    <div><b>Objet :</b> {selected.subject}</div>
                                    <div><b>Date :</b> {selected.date}</div>
                                </div>
                                <pre className="mail__prev-body">{selected.body}</pre>
                            </>
                        ) : (
                            <div className="mail__prev-empty">Sélectionnez un message pour le lire.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status bar */}
            <div className="mail__statusbar">
                <span>{messages.length} message(s)</span>
                <span>{unreadCount} non lu(s)</span>
                <span>Connexion sécurisée vers #0791</span>
            </div>
        </div>
    )
}

function ToolBtn({ icon, label }) {
    return (
        <button className="mail__tbtn" title={label} type="button">
            <img src={icon} alt="" />
            <span>{label}</span>
        </button>
    )
}