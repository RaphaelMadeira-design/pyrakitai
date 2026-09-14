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
    tabs: TABS,
} = intranetData

const isAuthorized = () => {
    const v = sessionStorage.getItem('pyraki_clearance')
    return v != null && v !== '0' && v !== ''
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''
const API = `${BACKEND_URL}/api`

// ─── LOGIN ──────────────────────────────────────────────────────
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
                setError("Identifiant opérateur ou code d'accès invalide. Vérifiez et réessayez.")
                setLoading(false)
            }
        }, 900)
    }

    return (
        <div className="wellston-login" data-testid="intranet-login">
            <div className="wellston-login__header">
                <div className="wellston-login__crest" />
                <div>
                    <div className="wellston-login__title">PYRAKI-NET — TERMINAL OPÉRATEUR</div>
                    <div className="wellston-login__subtitle">
                        DISTRICT N°6 · LE DISTRICT ROUGE
                    </div>
                </div>
            </div>

            <div className="wellston-login__body">
                <form onSubmit={handleSubmit} className="wellston-login__form">
                    <div className="wellston-login__banner">
                        ACCÈS RESTREINT — AUTHENTIFICATION REQUISE
                    </div>

                    <p className="wellston-login__intro">
                        Terminal privé de <b>Kaï SEDO — Récupération</b>. Toute intrusion est
                        journalisée et signalée à l'opérateur.
                    </p>

                    <div className="wellston-login__form-group">
                        <label className="wellston-login__label" htmlFor="pyraki-matricule">
                            Identifiant opérateur&nbsp;:
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

                    <div className="wellston-login__form-group">
                        <label className="wellston-login__label" htmlFor="pyraki-password">
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

                    {error && <div className="wellston-login__error">⚠ {error}</div>}

                    <div className="wellston-login__actions">
                        <button
                            type="submit"
                            className="win98-btn"
                            disabled={loading}
                            data-testid="pyraki-login-submit"
                        >
                            {loading ? 'Vérification...' : 'Se connecter'}
                        </button>
                    </div>

                    <p className="wellston-login__hint">
                        <i>Indice opérateur&nbsp;: KAI-01 / getback</i>
                    </p>
                </form>
            </div>

            <div className="wellston-login__footer">
                Terminal privé — Enregistrement local uniquement.<br/>
                PYRAKI-NET VERSION 1.02 — Récupération &amp; Services Indépendants
            </div>
        </div>
    )
}

// ─── AI ASSISTANT PANEL ─────────────────────────────────────────
function AssistantPanel() {
    const [mode, setMode] = useState('report') // report | target
    const [form, setForm] = useState({
        mission_title: '',
        client: '',
        target_item: '',
        location: '',
        notes: '',
        outcome: 'SUCCESS',
        target_name: '',
        context: '',
        known_info: '',
    })
    const [loading, setLoading] = useState(false)
    const [output, setOutput] = useState('')
    const [error, setError] = useState('')

    const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setOutput('')
        setLoading(true)
        try {
            const endpoint = mode === 'report' ? '/ai/mission-report' : '/ai/target-analysis'
            const payload = mode === 'report'
                ? {
                    mission_title: form.mission_title,
                    client: form.client,
                    target_item: form.target_item,
                    location: form.location,
                    notes: form.notes,
                    outcome: form.outcome,
                }
                : {
                    target_name: form.target_name,
                    context: form.context,
                    known_info: form.known_info,
                }

            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const t = await res.text()
                throw new Error(`HTTP ${res.status} — ${t}`)
            }
            const data = await res.json()
            setOutput(mode === 'report' ? data.report : data.analysis)
        } catch (err) {
            setError(String(err.message || err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="pyraki-assistant" data-testid="pyraki-assistant">
            <div className="pyraki-assistant__modes">
                <button
                    type="button"
                    className={`intranet__tab${mode === 'report' ? ' is-active' : ''}`}
                    onClick={() => { setMode('report'); setOutput(''); setError('') }}
                    data-testid="assistant-mode-report"
                >
                    Rapport de mission
                </button>
                <button
                    type="button"
                    className={`intranet__tab${mode === 'target' ? ' is-active' : ''}`}
                    onClick={() => { setMode('target'); setOutput(''); setError('') }}
                    data-testid="assistant-mode-target"
                >
                    Analyse de cible
                </button>
            </div>

            <form onSubmit={submit} className="pyraki-assistant__form">
                {mode === 'report' ? (
                    <>
                        <label>Titre mission
                            <input className="win98-input" value={form.mission_title}
                                required onChange={(e) => setF('mission_title', e.target.value)}
                                placeholder="Ex. Récupérer le pendentif d'Alma'tea"
                                data-testid="assistant-input-mission" />
                        </label>
                        <label>Client
                            <input className="win98-input" value={form.client}
                                onChange={(e) => setF('client', e.target.value)}
                                placeholder="Ex. H. Vergès" />
                        </label>
                        <label>Objet cible
                            <input className="win98-input" value={form.target_item}
                                onChange={(e) => setF('target_item', e.target.value)}
                                placeholder="Ex. Pendentif Coeur d'Ambre" />
                        </label>
                        <label>Lieu
                            <input className="win98-input" value={form.location}
                                onChange={(e) => setF('location', e.target.value)}
                                placeholder="Ex. District n°3 — Parc Commercial" />
                        </label>
                        <label>Issue
                            <select className="win98-input" value={form.outcome}
                                onChange={(e) => setF('outcome', e.target.value)}>
                                <option value="SUCCESS">Succès</option>
                                <option value="PARTIAL">Partiel</option>
                                <option value="FAILURE">Échec</option>
                                <option value="ABORTED">Avortée</option>
                            </select>
                        </label>
                        <label>Notes de terrain
                            <textarea className="win98-input pyraki-assistant__textarea"
                                value={form.notes} rows={3}
                                onChange={(e) => setF('notes', e.target.value)}
                                placeholder="Éléments observés, complications, contacts..." />
                        </label>
                    </>
                ) : (
                    <>
                        <label>Nom / alias cible
                            <input className="win98-input" value={form.target_name}
                                required onChange={(e) => setF('target_name', e.target.value)}
                                placeholder="Ex. « Le pickpocket du Parc »"
                                data-testid="assistant-input-target" />
                        </label>
                        <label>Contexte
                            <textarea className="win98-input pyraki-assistant__textarea"
                                value={form.context} rows={3}
                                onChange={(e) => setF('context', e.target.value)}
                                placeholder="Ex. Signalé au District n°3 par plusieurs commerçants" />
                        </label>
                        <label>Infos connues
                            <textarea className="win98-input pyraki-assistant__textarea"
                                value={form.known_info} rows={3}
                                onChange={(e) => setF('known_info', e.target.value)}
                                placeholder="Ex. Grand, veste bleue, opère aux heures de pointe" />
                        </label>
                    </>
                )}

                <div className="pyraki-assistant__actions">
                    <button type="submit" className="win98-btn"
                        disabled={loading} data-testid="assistant-submit">
                        {loading ? 'Analyse en cours…' : (mode === 'report' ? 'Générer rapport' : 'Analyser cible')}
                    </button>
                </div>
            </form>

            {error && <div className="pyraki-assistant__error" data-testid="assistant-error">⚠ {error}</div>}
            {output && (
                <div className="pyraki-assistant__output" data-testid="assistant-output">
                    <div className="pyraki-assistant__output-head">
                        {mode === 'report' ? 'RAPPORT — PYRAKI-NET' : 'ANALYSE TACTIQUE — PYRAKI-NET'}
                    </div>
                    <pre>{output}</pre>
                </div>
            )}
        </div>
    )
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Intranet() {
    const [authed, setAuthed] = useState(
        () => sessionStorage.getItem('pyraki_auth') === '1'
    )
    const [tab, setTab] = useState('missions')
    const [openMission, setOpenMission] = useState(null)
    const [openClient, setOpenClient] = useState(null)
    const [authorized, setAuthorized] = useState(isAuthorized())

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
        'À LIVRER': '#a05a00',
        'EN RETARD': '#b00',
        'PLANIFIÉE': '#555',
        'COMPLÉTÉE': '#2c7a2c',
        'REFUSÉE': '#666',
    }[s] || '#333')

    const trustDots = (n) => '●'.repeat(n) + '○'.repeat(5 - n)

    const balance = useMemo(
        () => LEDGER.reduce((sum, t) => sum + (t.type === 'IN' ? t.amount : -t.amount), 0),
        []
    )

    return (
        <div className="intranet" data-testid="intranet-window">
            {/* Header */}
            <div className="intranet__header">
                <div className="intranet__crest"></div>
                <div className="intranet__title">
                    <div className="intranet__org">PYRAKI-NET · RÉCUPÉRATION KAÏ SEDO</div>
                    <div className="intranet__sub">
                        Opérateur : {OPERATOR.name} — {OPERATOR.district} — Actif depuis {OPERATOR.since}
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
                        onClick={() => { setTab(t.id); setOpenMission(null); setOpenClient(null) }}
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
                                <tr key={m.id} onClick={() => setOpenMission(m)}
                                    style={{ cursor: 'pointer' }}
                                    data-testid={`mission-row-${m.id}`}>
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
                                <tr key={c.id} onClick={() => setOpenClient(c)} style={{ cursor: 'pointer' }}>
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
                                <th>Emplacement</th>
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
                                    <td>{i.location}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{i.estimated_value.toLocaleString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* LEDGER */}
                {tab === 'ledger' && (
                    <div>
                        <div className="pyraki-ledger__summary" data-testid="ledger-summary">
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

                {/* ASSISTANT IA */}
                {tab === 'assistant' && <AssistantPanel />}

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
                PYRAKI-NET — District n°6, Le Rouge — Opérateur : {OPERATOR.codename} ({OPERATOR.name}) — Session : {new Date().toLocaleTimeString('fr-FR')}
            </div>
        </div>
    )
}