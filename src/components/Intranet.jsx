import { useState, useEffect, useMemo } from 'react'
import '../styles/Intranet.scss'
import intranetData from '../data/intranet.json'
import Sounds from '../components/Sounds'

// ─── PYRAKI-NET CREDENTIALS ─────────────────────────────────────
const PYRAKI_CREDENTIALS = {
    matricule: 'KAI-01',
    password: 'getback',
}

const {
    operator: OPERATOR,
    missions: MISSIONS,
    clients: CLIENTS,
    inventory: INVENTORY,
    ledger: LEDGER,
    logs: LOGS,
    confidential: CONFIDENTIAL,
    trombinoscope: TROMBI,
    tabs: TABS,
} = intranetData

// ─── Sections du profil trombinoscope (boutons + modals) ────────
const PROFILE_SECTIONS = [
    { key: 'physical',   label: 'Description physique',    field: 'physicalDescription' },
    { key: 'psych',      label: 'Profil psychologique',    field: 'psychProfile' },
    { key: 'likes',      label: "Aime et n'aime pas",      field: 'likesDislikes' },
    { key: 'goal',       label: 'Objectif personnel',      field: 'personalGoal' },
    { key: 'skills',     label: 'Aptitudes',               field: 'skills' },
    { key: 'fears',      label: 'Peurs & traumatismes',    field: 'fearsTraumas' },
]

// Le token « Confidentiel » est posé via l'invite de commandes (CMD)
// dans la clé sessionStorage 'pyraki_clearance'. On la conserve
// pour ne pas casser l'ancien mécanisme d'accès.
const CLEARANCE_KEY = 'pyraki_clearance'
const isAuthorized = () => {
    const v = sessionStorage.getItem(CLEARANCE_KEY)
    return v != null && v !== '0' && v !== ''
}

// ─── LOGIN PYRAKI-NET ───────────────────────────────────────────
function IntranetLogin({ onLogin }) {
    const [matricule, setMatricule] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            if (
                matricule.trim().toUpperCase() === PYRAKI_CREDENTIALS.matricule &&
                password === PYRAKI_CREDENTIALS.password
            ) {
                Sounds?.msnNotify?.()
                sessionStorage.setItem('pyraki_auth', '1')
                onLogin()
            } else {
                Sounds?.error?.()
                setError("Identifiant utilisateur ou code d'accès invalide. Vérifiez et réessayez.")
                setLoading(false)
            }
        }, 900)
    }

    return (
        <div className="pyraki-login" data-testid="intranet-login">
            <div className="pyraki-login__header">
                <div className="pyraki-login__crest" />
                <div>
                    <div className="pyraki-login__title">PYRAKI-NET — TERMINAL UTILISATEUR</div>
                    <div className="pyraki-login__subtitle">
                        DISTRICT N°6
                    </div>
                </div>
            </div>

            <div className="pyraki-login__body">
                <form onSubmit={handleSubmit} className="pyraki-login__form">
                    <div className="pyraki-login__banner">
                        ACCÈS RESTREINT — AUTHENTIFICATION REQUISE
                    </div>

                    <p className="pyraki-login__intro">
                        Terminal privé de <b>Kaï SEDO — Gran Regalia</b>. Toute intrusion est
                        journalisée et signalée à l'administrateur.
                    </p>

                    <div className="pyraki-login__form-group">
                        <label className="pyraki-login__label" htmlFor="pyraki-matricule">
                            Identifiant &nbsp;:
                        </label>
                        <input
                            id="pyraki-matricule"
                            type="text"
                            className="win98-input"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            placeholder="Ex. KAI-01"
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            data-testid="pyraki-matricule-input"
                        />
                    </div>

                    <div className="pyraki-login__form-group">
                        <label className="pyraki-login__label" htmlFor="pyraki-password">
                            Code d'accès&nbsp;:
                        </label>
                        <input
                            id="pyraki-password"
                            type="password"
                            className="win98-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="off"
                            data-testid="pyraki-password-input"
                        />
                    </div>

                    {error && <div className="pyraki-login__error">⚠ {error}</div>}

                    <div className="pyraki-login__actions">
                        <button
                            type="submit"
                            className="win98-btn"
                            disabled={loading}
                            data-testid="pyraki-login-submit"
                        >
                            {loading ? 'Vérification...' : 'Se connecter'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="pyraki-login__footer">
                Terminal privé — Enregistrement local uniquement.<br />
                PYRAKI-NET VERSION 1.02 — TABLEAU DE BORD POUR PROFESSIONNELS INDÉPENDANTS
            </div>
        </div>
    )
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Intranet({ onOpenWindow }) {
    const [authed, setAuthed] = useState(
        () => sessionStorage.getItem('pyraki_auth') === '1'
    )
    const [tab, setTab] = useState('missions')
    const [openMission, setOpenMission] = useState(null)
    const [openClient, setOpenClient] = useState(null)
    const [openModal, setOpenModal] = useState(null)
    const [authorized, setAuthorized] = useState(isAuthorized())

    useEffect(() => {
        const i = setInterval(() => setAuthorized(isAuthorized()), 1000)
        return () => clearInterval(i)
    }, [])

    const balance = useMemo(
        () => LEDGER.reduce((sum, t) => sum + (t.type === 'IN' ? t.amount : -t.amount), 0),
        []
    )

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
        'À LIVRER': '#a05a00',
        'EN RETARD': '#b00',
        'PLANIFIÉE': '#555',
        'COMPLÉTÉE': '#2c7a2c',
        'REFUSÉE': '#666',
        'EN RECHERCHE': '#a05a00',
        'EN COFFRE': '#06408b',
        'REMISE AU CLIENT': '#2c7a2c',
        'CONFISQUÉE': '#666',
    }[s] || '#333')

    const trustDots = (n) => '●'.repeat(n) + '○'.repeat(5 - n)

    return (
        <div className="intranet" data-testid="intranet-window">
            {/* Header */}
            <div className="intranet__header">
                <div className="intranet__crest"></div>
                <div className="intranet__title">
                    <div className="intranet__org">PYRAKI-NET · TABLEAU DE BORD</div>
                    <div className="intranet__sub">
                        Utilisateur : {OPERATOR.office} — {OPERATOR.name}
                    </div>
                </div>
                <div
                    className={`intranet__clearance ${authorized ? 'is-authed' : 'is-locked'}`}
                    data-testid="intranet-clearance"
                >
                    {authorized ? 'CONFIDENTIEL' : 'STANDARD'}
                </div>
            </div>

            {/* Tabs */}
            <div className="intranet__tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`intranet__tab${tab === t.id ? ' is-active' : ''}`}
                        onClick={() => {
                            setTab(t.id)
                            setOpenMission(null)
                            setOpenClient(null)
                            setOpenModal(null)
                        }}
                        data-testid={`intranet-tab-${t.id}`}
                    >
                        <img src={t.icon} alt="" className="intranet__tab-icon" />
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="intranet__body">
                {/* MISSIONS */}
                {tab === 'missions' && !openMission && (
                    <table className="intranet__table" data-testid="intranet-missions-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Titre</th>
                                <th>Client</th>
                                <th>Priorité</th>
                                <th>Échéance</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Récomp. (₡)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MISSIONS.map(m => (
                                <tr
                                    key={m.id}
                                    onClick={() => setOpenMission(m)}
                                    style={{ cursor: 'pointer' }}
                                    data-testid={`mission-row-${m.id}`}
                                >
                                    <td>{m.id}</td>
                                    <td>{m.title}</td>
                                    <td>{m.client}</td>
                                    <td><span className="intranet__pill" style={{ background: priColor(m.priority) }}>{m.priority}</span></td>
                                    <td>{m.deadline}</td>
                                    <td><span className="intranet__pill" style={{ background: statusColor(m.status) }}>{m.status}</span></td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{m.reward.toLocaleString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'missions' && openMission && (
                    <div className="intranet__doc">
                        <button className="intranet__back" onClick={() => setOpenMission(null)}>
                            ◄ Retour missions
                        </button>
                        <div className="intranet__doc-head">
                            <div className="intranet__doc-org">CONTRAT — {openMission.id}</div>
                            <div className="intranet__stamp classifié">USAGE INTERNE</div>
                        </div>
                        <div className="intranet__doc-title">{openMission.title}</div>
                        <table className="intranet__fiche">
                            <tbody>
                                {Object.entries({
                                    'Client': openMission.client,
                                    'Objet cible': openMission.target_item,
                                    'Lieu': openMission.location,
                                    'Priorité': openMission.priority,
                                    'Échéance': openMission.deadline,
                                    'Statut': openMission.status,
                                    'Récompense': `${openMission.reward.toLocaleString('fr-FR')} ₡`,
                                }).map(([k, v]) => (
                                    <tr key={k}><th>{k}</th><td>{v}</td></tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="intranet__doc-body">
                            <b>Notes de terrain :</b>{'\n'}{openMission.notes || '—'}
                        </div>
                        <div className="intranet__doc-sign">— Consigné dans PYRAKI-NET</div>
                    </div>
                )}

                {/* CLIENTS */}
                {tab === 'clients' && !openClient && (
                    <table className="intranet__table" data-testid="intranet-clients-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>District</th>
                                <th>Confiance</th>
                                <th style={{ textAlign: 'right' }}>Missions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CLIENTS.map(c => (
                                <tr
                                    key={c.id}
                                    onClick={() => setOpenClient(c)}
                                    style={{ cursor: 'pointer' }}
                                    data-testid={`client-row-${c.id}`}
                                >
                                    <td>{c.id}</td>
                                    <td>{c.name}</td>
                                    <td>{c.type}</td>
                                    <td>{c.district}</td>
                                    <td style={{ letterSpacing: 2 }}>{trustDots(c.trust)}</td>
                                    <td style={{ textAlign: 'right' }}>{c.missions_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {tab === 'clients' && openClient && (
                    <div className="intranet__doc">
                        <button className="intranet__back" onClick={() => setOpenClient(null)}>
                            ◄ Retour clients
                        </button>
                        <div className="intranet__doc-head">
                            <div className="intranet__doc-org">FICHE CLIENT — {openClient.id}</div>
                            <div className="intranet__stamp classifié">USAGE INTERNE</div>
                        </div>
                        <div className="intranet__doc-title">{openClient.name}</div>
                        <table className="intranet__fiche">
                            <tbody>
                                {Object.entries({
                                    'Type': openClient.type,
                                    'District': openClient.district,
                                    'Niveau de confiance': trustDots(openClient.trust) + ` (${openClient.trust}/5)`,
                                    'Missions effectuées': openClient.missions_count,
                                }).map(([k, v]) => (
                                    <tr key={k}><th>{k}</th><td>{v}</td></tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="intranet__doc-body">
                            <b>Notes personnelles :</b>{'\n'}{openClient.notes}
                        </div>
                    </div>
                )}

                {/* INVENTORY */}
                {tab === 'inventory' && (
                    <table className="intranet__table" data-testid="intranet-inventory-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Objet</th>
                                <th>État</th>
                                <th>Mission liée</th>
                                <th style={{ textAlign: 'right' }}>Valeur (₡)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INVENTORY.map(i => (
                                <tr key={i.id}>
                                    <td>{i.id}</td>
                                    <td>{i.name}</td>
                                    <td><span className="intranet__pill" style={{ background: statusColor(i.state) || '#555' }}>{i.state}</span></td>
                                    <td>{i.linked_mission}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{i.estimated_value.toLocaleString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* LEDGER */}
                {tab === 'ledger' && (
                    <div className="intranet__ledger">
                        <div className="intranet__ledger-summary" data-testid="ledger-summary">
                            <div><b>Solde actuel :</b> <span style={{ fontFamily: 'monospace' }}>{OPERATOR.credits.toLocaleString('fr-FR')} ₡</span></div>
                            <div><b>Delta 30j :</b> <span style={{ fontFamily: 'monospace', color: balance >= 0 ? '#2c7a2c' : '#b00' }}>{balance >= 0 ? '+' : ''}{balance.toLocaleString('fr-FR')} ₡</span></div>
                            <div><b>Notation :</b> {OPERATOR.rating} / 5 ★</div>
                        </div>
                        <table className="intranet__table" data-testid="intranet-ledger-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Date</th>
                                    <th>Libellé</th>
                                    <th>Type</th>
                                    <th style={{ textAlign: 'right' }}>Montant (₡)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {LEDGER.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.id}</td>
                                        <td>{t.date}</td>
                                        <td>{t.label}</td>
                                        <td><span className="intranet__pill" style={{ background: t.type === 'IN' ? '#2c7a2c' : '#b00' }}>{t.type === 'IN' ? 'ENTRÉE' : 'SORTIE'}</span></td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: t.type === 'IN' ? '#2c7a2c' : '#b00' }}>
                                            {t.type === 'IN' ? '+' : '−'}{t.amount.toLocaleString('fr-FR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TROMBINOSCOPE — Fiche Kaï SEDO */}
                {tab === 'trombinoscope' && (
                    <div className="intranet__doc" data-testid="intranet-trombinoscope">
                        <div className="intranet__doc-head">
                            <div className="intranet__doc-org">DOSSIER UTILISATEUR — N° {TROMBI.id}</div>
                            <div className="intranet__stamp classifié">USAGE INTERNE</div>
                        </div>

                        <div className="intranet__fiche-layout">
                            <table className="intranet__fiche">
                                <tbody>
                                    {Object.entries({
                                        "Nom complet": TROMBI.name,
                                        "Âge": TROMBI.age,
                                        "Genre": TROMBI.genre,
                                        "Race": TROMBI.race,
                                        "Origine": TROMBI.origin,
                                        "Archétype": TROMBI.archetype,
                                        "MBTI": TROMBI.mbti,
                                        "Alignement": TROMBI.alignment,
                                    }).map(([k, v]) => (
                                        <tr key={k}>
                                            <th>{k}</th>
                                            <td>{v}</td>
                                        </tr>
                                    ))}
                                    <tr className="intranet__fiche-sep" aria-hidden="true">
                                        <td colSpan={2}></td>
                                    </tr>
                                    {Object.entries({
                                        "Dénomination": TROMBI.office,
                                        "Domiciliation": TROMBI.district,
                                        "Secteur d'activité": TROMBI.activity,
                                    }).map(([k, v]) => (
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
                                <button
                                    type="button"
                                    className="intranet__profile-btn intranet__profile-btn--blue"
                                    onClick={() => onOpenWindow?.('powers')}
                                    data-testid="intranet-profile-btn-ability"
                                >
                                    Registre des capacités
                                </button>
                            </div>

                            {TROMBI.image && (
                                <figure className="intranet__photo-frame">
                                    <div className="intranet__photo-caption">TROMBINOSCOPE</div>
                                    <div className="intranet__photo-inner">
                                        <img
                                            src={TROMBI.image}
                                            alt={TROMBI.name}
                                            className="intranet__photo-img"
                                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                                        />
                                    </div>
                                    <figcaption className="intranet__photo-id">
                                        N° {TROMBI.id}
                                    </figcaption>
                                </figure>
                            )}
                        </div>
                    </div>
                )}

                {/* LOGS */}
                {tab === 'logs' && (
                    <div className="intranet__logs">
                        {LOGS.map((l, i) => <div key={i} className="intranet__logline">{l}</div>)}
                    </div>
                )}

                {/* CONFIDENTIAL */}
                {tab === 'confidential' && (
                    <div className="intranet__secure" data-testid="intranet-secure">
                        {!authorized ? (
                            <div className="intranet__sealed" data-testid="intranet-secure-locked">
                                <div className="intranet__sealed-head">◈ ACCÈS CONFIDENTIEL — VERROUILLÉ</div>
                                <div className="intranet__sealed-lock">
                                    Autorisation requise. Élevez votre niveau via l'<code>invite de commandes</code>.
                                </div>
                            </div>
                        ) : (
                            Object.values(CONFIDENTIAL).map(item => (
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
                PYRAKI-NET — Utilisateur : {OPERATOR.name} ({OPERATOR.office}) — Session : {new Date().toLocaleTimeString('fr-FR')}
            </div>

            {/* Modal profil trombinoscope */}
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
                            {openModal.field === 'likesDislikes' && TROMBI?.likesDislikes ? (
                                <>
                                    <p>
                                        <strong>Aime :</strong> {TROMBI.likesDislikes.likes}
                                    </p>

                                    <p>
                                        <strong>N'aime pas :</strong> {TROMBI.likesDislikes.dislikes}
                                    </p>
                                </>
                            ) : (
                                (openModal.field && TROMBI && TROMBI[openModal.field])
                                    ? TROMBI[openModal.field]
                                    : <span className="intranet__profile-empty">
                                        — Donnée non renseignée —
                                    </span>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}