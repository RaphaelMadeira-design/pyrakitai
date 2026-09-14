import { useState, useEffect } from 'react'
import '../styles/Intranet.scss'
import intranetData from '../data/intranet.json'
import Sounds from '../components/Sounds'

// ─── WELLS CREDENTIALS ───────────────────────────────────────────
const WELLSTON_CREDENTIALS = {
    matricule: 'CHANGE_ME',
    password:  'CHANGE_ME',
}

const { 
    tasks: TASKS,
    missions: MISSIONS, 
    schedule: SCHEDULE, 
    trombinoscope: TROMBINOSCOPE, 
    trombinoscopeStructure: TROMBINOSCOPE_STRUCTURE, 
    groups: GROUPS, 
    logs: LOGS, 
    tabs: TABS, 
    secure: SECURE 
} = intranetData

const isAuthorized = () => {
    const v = sessionStorage.getItem('wellston_clearance')
    return v != null && v !== '0' && v !== ''
}

// ─── Sections de profil (boutons + modals) ─────────────────────
const PROFILE_SECTIONS = [
    {
        key: 'physical',
        label: 'Description physique',
        field: 'physicalDescription',
    },
    {
        key: 'condition',
        label: 'Condition physique',
        field: 'condition',
    },
    {
        key: 'psych',
        label: 'Profil psychologique',
        field: 'psychProfile',
    },
    {
        key: 'likes',
        label: "Aime et n'aime pas",
        field: 'likesDislikes',
    },
    {
        key: 'hobbies',
        label: 'Loisirs',
        field: 'hobbies',
    },
    {
        key: 'opinion',
        label: 'Opinion hiérarchie',
        field: 'opinion',
    },
]

// ─── WELLSTON INTRANET LOGIN ────────────────────────────────────────
function IntranetLogin({ onLogin }) {
    const [matricule, setMatricule] = useState('')
    const [password, setPassword]   = useState('')
    const [error, setError]         = useState('')
    const [loading, setLoading]     = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            if (
                matricule.trim() === WELLSTON_CREDENTIALS.matricule &&
                password === WELLSTON_CREDENTIALS.password
            ) {
                Sounds?.msnNotify?.()
                sessionStorage.setItem('wellston_auth', '1')
                onLogin()
            } else {
                Sounds?.error?.()
                setError("Matricule ou code d'accès invalide. Vérifiez vos informations et réessayez.")
                setLoading(false)
            }
        }, 900)
    }

    return (
        <div className="wellston-login" data-testid="intranet-login">
            {/* Bandeau de marque WELLSTON */}
            <div className="wellston-login__header">
                <div className="wellston-login__crest" />
                    <div>
                        <div className="wellston-login__title">SERVEUR INTERNE — WELLSTON-NET</div>
                        <div className="wellston-login__subtitle">
                            POSTE DE TRAVAIL MONITORÉ
                        </div>
                    </div>
                </div>

                {/* Corps : centre le formulaire */}
                <div className="wellston-login__body">
                    <form onSubmit={handleSubmit} className="wellston-login__form">
                        <div className="wellston-login__banner">
                            ACCÈS RESTREINT — AUTHENTIFICATION REQUISE
                        </div>

                        <p className="wellston-login__intro">
                            Veuillez saisir votre matricule et votre code d'accèspour consulter le réseau interne.
                        </p>

                        <div className="wellston-login__form-group">
                            <label className="wellston-login__label" htmlFor="wellston-matricule">
                                Identifiant élève&nbsp;:
                            </label>
                            <input
                                id="wellston-matricule"
                                type="text"
                                className="win98-input"
                                value={matricule}
                                onChange={(e) => setMatricule(e.target.value)}
                                placeholder="Ex. #1234"
                                autoFocus
                                autoComplete="off"
                                spellCheck={false}
                                data-testid="wellston-matricule-input"
                            />
                        </div>

                        <div className="wellston-login__form-group">
                            <label className="wellston-login__label" htmlFor="wellston-password">
                                Code d'accès&nbsp;:
                            </label>
                            <input
                                id="wellston-password"
                                type="password"
                                className="win98-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off"
                                data-testid="wellston-password-input"
                            />
                        </div>

                        {error && (
                            <div className="wellston-login__error">⚠ {error}</div>
                        )}

                        <div className="wellston-login__actions">
                            <button
                                type="submit"
                                className="win98-btn"
                                disabled={loading}
                                data-testid="wellston-login-submit"
                            >
                                {loading ? 'Vérification...' : 'Se connecter'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer collé tout en bas de la fenêtre */}
                <div className="wellston-login__footer">
                    Toute tentative d'intrusion est consignée et tracée.<br/>
                    WELLSTON-NET VERSION 5.04
                </div>
        </div>
    )
}

export default function Intranet() {
    const [authed, setAuthed] = useState(
        () => sessionStorage.getItem('wellston_auth') === '1'
    )
    const [tab, setTab] = useState('tasks')
    const [openPerson, setOpenPerson] = useState(null)
    const [openModal, setOpenModal] = useState(null)
    const [authorized, setAuthorized] = useState(isAuthorized())
    const [openGroup, setOpenGroup] = useState('B')

    useEffect(() => {
        const i = setInterval(() => setAuthorized(isAuthorized()), 1000)
        return () => clearInterval(i)
    }, [])

    if (!authed) {
        return <IntranetLogin onLogin={() => setAuthed(true)} />
    }

    const priColor = (p) => ({
        'CRITIQUE': '#c00',
        'HAUTE': '#d2691e',
        'MOYENNE': '#7a6f00',
        'BASSE': '#3a6e3a',
    }[p] || '#333')

    const statusColor = (s) => ({
        'EN COURS': '#06408b',
        'À RENDRE': '#a05a00',
        'EN RETARD': '#b00',
        'PLANIFIÉE': '#555',
        'COMPLÉTÉE': '#2c7a2c',
        'BLOQUÉE': '#888',
    }[s] || '#333')

    const renderTrombinoscopeCard = (p) => {
        const locked = p.locked && !authorized
        const clickAllowed = p.id === '0791' && !locked
        return (
            <div
                key={p.id}
                className={`intranet__card${!clickAllowed ? ' is-locked' : ''}`}
                onClick={() => clickAllowed && setOpenPerson(p)}
                title={!clickAllowed ? 'Accès restreint — dossier verrouillé' : ''}
                >
                <div className="intranet__card-id">N° {p.id.toUpperCase()}</div>
                <div className="intranet__card-name">{locked ? '████████████' : p.name}</div>
                <div className="intranet__card-rank">{locked ? '[ACCÈS RESTREINT]' : p.rank}</div>
                <div className={`intranet__card-status s-${p.status.toLowerCase().replace(/ /g, '-')}`}>{p.status}</div>
            </div>
        )
    }

    return (
        <div className="intranet" data-testid="intranet-window">
            {/* Header */}
            <div className="intranet__header">
                <div className="intranet__crest"></div>
                <div className="intranet__title">
                    <div className="intranet__org">UNIVERSITÉ DE WELLSTON</div>
                    <div className="intranet__sub">Intranet WELLSTON-NET v5.04 — UFR Information et Communication</div>
                </div>
                <div
                    className={`intranet__clearance ${authorized ? 'is-authed' : 'is-locked'}`}
                    data-testid="intranet-clearance"
                >
                    {authorized ? 'AUTORISÉ' : 'NON AUTORISÉ'}
                </div>
            </div>

            {/* Tabs */}
            <div className="intranet__tabs">
                {TABS.map(t => {
                    const label = t.id === 'tasks' && authorized ? 'Missions' : t.label
                    return (
                        <button
                            key={t.id}
                            className={`intranet__tab${tab === t.id ? ' is-active' : ''}`}
                            onClick={() => setTab(t.id)}
                            data-testid={`intranet-tab-${t.id}`}
                            >
                            <img src={t.icon} alt="" className="intranet__tab-icon" />
                            <span>{label}</span>
                        </button>
                    )
                })}
            </div>

            <div className="intranet__body">
                {/* Tasks */}
                {tab === 'tasks' && (
                    <table className="intranet__table" data-testid="intranet-tasks-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{authorized ? 'Mission' : 'Tâche'}</th>
                                <th>Priorité</th>
                                <th>Échéance</th>
                                <th>Statut</th>
                                <th>{authorized ? 'Commanditaire' : 'Assigné par'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(authorized ? (MISSIONS || []) : TASKS).map(t => (
                                <tr key={t.id}>
                                    <td>{String(t.id).padStart(3,'0')}</td>
                                    <td>{t.title}</td>
                                    <td><span className="intranet__pill" style={{ background: priColor(t.priority) }}>{t.priority}</span></td>
                                    <td>{t.deadline}</td>
                                    <td><span className="intranet__pill" style={{ background: statusColor(t.status) }}>{t.status}</span></td>
                                    <td>{t.assigned}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Emploi du temps */}
                {tab === 'reports' && (
                    <div className="intranet__table">
                        <table className="intranet__table intranet__table--schedule">
                            <thead>
                                <tr>
                                    <th>Horaire</th>
                                    {SCHEDULE.days.map(d => <th key={d}>{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {SCHEDULE.slots.map(slot => (
                                    <tr key={slot.time}>
                                        <td className="intranet__slot-time">{slot.time}</td>
                                        {SCHEDULE.days.map(d => {
                                            const s = slot.sessions[d]
                                            if (!s) return <td key={d} className="intranet__slot-empty">—</td>
                                            const cancelled = s.status === 'ANNULÉ'
                                            return (
                                                <td key={d} className={`intranet__slot${cancelled ? ' is-cancelled' : ''}`}>
                                                    <div className="intranet__slot-course">{s.course}</div>
                                                    <div className="intranet__slot-meta">{s.room} · {s.teacher}</div>
                                                    {s.status && <div className="intranet__slot-status">{s.status}</div>}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Trombinoscope */}
                {tab === 'trombinoscope' && !openPerson && (
                    <div className="intranet__trombinoscope-groups">
                        <section className="intranet__group">
                            <div className="intranet__group-title">RESPONSABLE DE FORMATION</div>
                            <div className="intranet__cards">
                                {TROMBINOSCOPE.filter(p => TROMBINOSCOPE_STRUCTURE.dean.includes(p.id)).map(renderTrombinoscopeCard)}
                            </div>
                        </section>

                        {GROUPS.map(letter => (
                            <section key={letter} className="intranet__group">
                                <button
                                    className="intranet__group-header"
                                    onClick={() => setOpenGroup(openGroup === letter ? null : letter)}
                                >
                                    {openGroup === letter ? '▼' : '▶'} GROUPE {letter}
                                </button>

                                {openGroup === letter && (
                                    <>
                                        {/* Élèves */}
                                        <div className="intranet__subgroup">
                                            <div className="intranet__subgroup-title">ÉLÈVES</div>
                                            <div className="intranet__cards">
                                                {TROMBINOSCOPE_STRUCTURE[`group${letter}`]?.classmates
                                                    .map(id => TROMBINOSCOPE.find(p => p.id === id))
                                                    .filter(Boolean)
                                                    .map(renderTrombinoscopeCard)}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>
                        ))}
                    </div>
                )}

                {tab === 'trombinoscope' && openPerson && (
                    <div className="intranet__doc">
                        <button className="intranet__back" onClick={() => setOpenPerson(null)}>
                            ◄ Retour fiches
                        </button>
                        <div className="intranet__doc-head">
                            <div className="intranet__doc-org">DOSSIER ÉLÈVE — N° {openPerson.id.toUpperCase()}</div>
                            <div className={`intranet__stamp classifié`}>USAGE INTERNE</div>
                        </div>

                        <div className="intranet__fiche-layout">
                            <table className="intranet__fiche">
                                <tbody>
                                    {Object.entries({ 
                                        "Nom complet": openPerson.name,
                                        "Âge": openPerson.age,
                                        "Genre": openPerson.genre,
                                        "Orientation sexuelle": openPerson.orientation,
                                        "Spécialisation": openPerson.specialization,
                                        "Cycle": openPerson.cycle,
                                        "Année": openPerson.year,
                                        "Équipement": openPerson.equipment,
                                        "MBTI": openPerson.mbti, 
                                        "Alignement": openPerson.alignment 
                                    }).map(([k,v]) => (
                                        <tr key={k}>
                                            <th>{k}</th>
                                            <td>{v}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="intranet__profile-actions" data-testid="intranet-profile-actions">
                                {PROFILE_SECTIONS.map(s => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        className="intranet__profile-btn"
                                        onClick={() => setOpenModal(s)}
                                        data-testid={`intranet-profile-btn-${s.key}`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {openPerson.image && (
                                <figure className="intranet__photo-frame">
                                    <div className="intranet__photo-caption">TROMBINOSCOPE</div>
                                    <div className="intranet__photo-inner">
                                        <img
                                            src={openPerson.image}
                                            alt={openPerson.name}
                                            className="intranet__photo-img"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    </div>
                                    <figcaption className="intranet__photo-id">
                                        N° {openPerson.id.toUpperCase()}
                                    </figcaption>
                                </figure>
                            )}
                        </div>
                    </div>
                )}

                {/* Logs */}
                {tab === 'logs' && (
                    <div className="intranet__logs">
                        {LOGS.map((l,i) => <div key={i} className="intranet__logline">{l}</div>)}
                    </div>
                )}

                {/* Secure */}
                {tab === 'secure' && (
                    <div className="intranet__secure" data-testid="intranet-secure">
                        {!authorized ? (
                            <div className="intranet__sealed" data-testid="intranet-secure-locked">
                                <div className="intranet__sealed-head">◈ ACCÈS CONFIDENTIEL — VERROUILLÉ</div>
                                <div className="intranet__sealed-lock">
                                    Autorisation requise. Contactez votre administrateur système ou authentifiez-vous via l'<code>invite de commandes</code>.
                                </div>
                            </div>
                        ) : (
                            Object.values(SECURE).map(item => (
                                <div key={item.title} className="intranet__sealed is-open">
                                    <div className="intranet__sealed-head">{item.title}</div>
                                    <pre>{item.content}</pre>
                                </div>
                            ))
                         )} 
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="intranet__footer">
                WELLSTON-NET — UFR Information et Communication — Utilisateur : S. ASHU'RA # 0791 — Session : {new Date().toLocaleTimeString('fr-FR')}
            </div>

            {/* Modal profil (même style que les encarts de description) */}
            {openModal && (
                <div
                    className="intranet__modal-overlay"
                    onClick={() => setOpenModal(null)}
                    data-testid="intranet-profile-modal"
                >
                    <section
                        className="intranet__profile-card intranet__modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="intranet__profile-head intranet__modal-head">
                            <span>{openModal.label.toUpperCase()}</span>
                            <button
                                type="button"
                                className="intranet__modal-close"
                                onClick={() => setOpenModal(null)}
                                aria-label="Fermer"
                                data-testid="intranet-profile-modal-close"
                            >
                            </button>
                        </div>
                        <div className="intranet__profile-body">
                            {(openModal.field && openPerson && openPerson[openModal.field])
                                ? openPerson[openModal.field]
                                : (openModal.placeholder
                                    ? openModal.placeholder
                                    : <span className="intranet__profile-empty">— Donnée non renseignée —</span>)}
                        </div>
                    </section>
                </div>
            )}

        </div>
    )
}