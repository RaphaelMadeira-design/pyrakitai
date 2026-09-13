import { useState, useEffect, useRef, useMemo } from 'react'
import Sounds from '../components/Sounds'
import treeData from '../data/computer.json'
import '../styles/MyComputer.scss'

const ICONS = {
    myComputer:   'https://win98icons.alexmeub.com/icons/png/computer_explorer-4.png',
    hdd:          'https://win98icons.alexmeub.com/icons/png/hard_disk_drive-4.png',
    floppy:       'https://win98icons.alexmeub.com/icons/png/floppy_drive_3_5_cool-0.png',
    floppyLocked: 'https://win98icons.alexmeub.com/icons/png/floppy_drive_3_5_cool-0.png',
    controlPanel: 'https://win98icons.alexmeub.com/icons/png/directory_control_panel-4.png',
    folder:       'https://win98icons.alexmeub.com/icons/png/directory_closed-0.png',
    explorer:     'https://win98icons.alexmeub.com/icons/png/directory_explorer-2.png',
    windowsDir:   'https://win98icons.alexmeub.com/icons/png/directory_open_cool-5.png',
    programFiles: 'https://win98icons.alexmeub.com/icons/png/directory_closed-0.png',
    txt:          'https://win98icons.alexmeub.com/icons/png/notepad_file-0.png',
    exe:          'https://win98icons.alexmeub.com/icons/png/executable-0.png',
    bat:          'https://win98icons.alexmeub.com/icons/png/console_prompt-0.png',
    sys:          'https://win98icons.alexmeub.com/icons/png/message_file-0.png',
    warning:      'https://win98icons.alexmeub.com/icons/png/msg_warning-0.png',
    error:        'https://win98icons.alexmeub.com/icons/png/msg_error-0.png',
    info:         'https://win98icons.alexmeub.com/icons/png/msg_information-0.png',
    key:          'https://win98icons.alexmeub.com/icons/png/key_padlock-0.png',
    msn:          '/images/icons/32x32/messenger.png',
    games:        'https://win98icons.alexmeub.com/icons/png/joystick-2.png',
    game:         'https://win98icons.alexmeub.com/icons/png/joystick_alt-0.png',
    image:        'https://win98icons.alexmeub.com/icons/png/kodak_imaging_file-0.png'
}

const resolveIcon = (val) => {
    if (!val) return ICONS.folder
    if (typeof val !== 'string') return ICONS.folder
    if (val.startsWith('http')) return val
    if (val.startsWith('/') || val.startsWith('./') || val.startsWith('data:')) return val
    return ICONS[val] || ICONS.folder
}

const fileIcon = (node) => {
    const name = node.name || ''
    if (name.endsWith('.BAT') || name.endsWith('.bat') || name.endsWith('.COM')) return ICONS.bat
    if (name.endsWith('.exe') || name.endsWith('.EXE')) return ICONS.exe
    if (name.endsWith('.SYS') || name.endsWith('.DLL') || name.endsWith('.dll') || name.endsWith('.sys')) return ICONS.sys
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.bmp')) return ICONS.image
    if (name.endsWith('.log')) return ICONS.sys
    return ICONS.txt
}

const nodeIcon = (id, tree) => {
    const n = tree[id]
    if (!n) return ICONS.folder
    if (n.icon) return resolveIcon(n.icon)
    if (n.type === 'file') return fileIcon(n)
    if (n.type === 'image') return ICONS.image
    if (n.type === 'shortcut') return ICONS.explorer
    return ICONS.folder
}

const getAddress = (history, tree) => history.map(id => {
    const n = tree[id]
    if (!n) return id
    if (n.isRoot) return 'PC'
    if (n.drive) return `${n.drive}:`
    return n.name
}).join('\\')

function Win98Dialog({ icon, title, children, onClose, buttons }) {
    return (
        <div
            className="my-computer__dialog-backdrop"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
            data-testid="mycomputer-dialog-backdrop"
        >
            <div
                className="my-computer__dialog"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="win98-window__titlebar">
                    <span className="win98-window__title-text">{title}</span>
                    <div className="win98-window__controls">
                        <button
                            type="button"
                            className="win98-window__ctrl-btn win98-window__ctrl-btn--close"
                            onClick={onClose}
                            aria-label="Fermer"
                            data-testid="mycomputer-dialog-close"
                        />
                    </div>
                </div>
                <div className="my-computer__dialog-body">
                    {icon && <img src={icon} alt="" className="my-computer__dialog-icon" />}
                    <div className="my-computer__dialog-content">{children}</div>
                </div>
                <div className="my-computer__dialog-buttons">{buttons}</div>
            </div>
        </div>
    )
}

export default function MyComputer({ onOpenNotepad, onOpenWindow, onOpenImage, desktopIcons = [] }) {
    const tree = useMemo(() => {
        const t = { ...treeData }
        const deskChildren = desktopIcons.map(ic => `desk_${ic.id}`)
        t.u_desktop = { ...t.u_desktop, children: deskChildren }
        desktopIcons.forEach(ic => {
            t[`desk_${ic.id}`] = {
                name: ic.label,
                parent: 'u_desktop',
                type: 'shortcut',
                target: ic.id,
                icon: ic.icon,
            }
        })
        return t
    }, [desktopIcons])

    const [history, setHistory] = useState(['computer'])
    const [selected, setSelected] = useState(null)
    const [unlocked, setUnlocked] = useState(false)
    const [pwdDialog, setPwdDialog] = useState(false)
    const [pwdInput, setPwdInput]   = useState('')
    const [pwdError, setPwdError]   = useState(false)
    const [floppyDialog, setFloppyDialog] = useState(false)
    const [sysDialog, setSysDialog] = useState(null)

    const pwdRef = useRef(null)
    useEffect(() => { if (pwdDialog && pwdRef.current) pwdRef.current.focus() }, [pwdDialog])

    const currentId = history[history.length - 1]
    const current = tree[currentId]

    const enter = (id) => {
        const node = tree[id]
        if (!node) return

        if (node.disabled) {
            Sounds.error?.()
            return
        }

        if (node.trigger === 'alterego') {
            Sounds.error?.()
            try {
                window.dispatchEvent(new CustomEvent('isen:alterego-glitch', { detail: { duration: 4200 } }))
            } catch (e) { /* noop */ }
            setTimeout(() => {
                setSysDialog({
                    title: 'ALTEREGO.DLL — Erreur critique',
                    message: 'crypted',
                    crypted: true,
                    hideIcon: true,
                })
            }, 1400)
        }

        if (node.type === 'shortcut') {
            Sounds.click?.()
            if (onOpenWindow && node.target) onOpenWindow(node.target)
            return
        }
        if (node.empty) {
            Sounds.error?.()
            setFloppyDialog(true)
            return
        }
        if (node.locked && !unlocked && node.drive === 'B') {
            Sounds.error?.()
            setPwdInput('')
            setPwdError(false)
            setPwdDialog(true)
            return
        }
        if (node.type === 'file' && node.locked) {
            Sounds.error?.()
            setSysDialog({
                title: 'Accès refusé',
                message: `Le fichier "${node.name}" est protégé par le système et ne peut pas être ouvert.`
            })
            return
        }
        if (node.type === 'file') {
            Sounds.click?.()
            onOpenNotepad?.({ id, name: node.name, content: node.content })
            return
        }
        if (node.type === 'image') {
            Sounds.click?.()
            const parent = tree[node.parent]
            const siblings = (parent?.children || [])
                .map(cid => tree[cid])
                .filter(n => n && n.type === 'image' && n.imageFile)
                .map(n => ({ name: n.name, file: n.imageFile }))
            onOpenImage?.({ file: node.imageFile, name: node.name, siblings })
            return
        }
        Sounds.navigate?.()
        setHistory(h => [...h, id])
        setSelected(null)
    }

    const goBack = () => {
        if (history.length <= 1) return
        Sounds.navigate?.()
        setHistory(h => h.slice(0, -1))
        setSelected(null)
    }
    const goUp = goBack
    const goHome = () => {
        Sounds.navigate?.()
        setHistory(['computer'])
        setSelected(null)
    }

    const submitPwd = (e) => {
        e?.preventDefault?.()
        const target = tree.driveB
        if (pwdInput.trim().toLowerCase() === target.password) {
            Sounds.click?.()
            setUnlocked(true)
            setPwdDialog(false)
            setHistory(h => [...h, 'driveB'])
        } else {
            Sounds.error?.()
            setPwdError(true)
        }
    }

    const findDrive = (id) => {
        let cur = id
        while (cur && tree[cur]) {
            if (tree[cur].drive) return tree[cur]
            cur = tree[cur].parent
        }
        return null
    }

const renderDrivesView = () => {
const drives = current.children.map(id => tree[id])
return (
<div className="file-explorer__content">
<div className="my-computer__section-title">Les fichiers et dossiers stockés sur cet ordinateur</div>
<div className="file-explorer__grid">
{drives.map(d => {
const id = current.children[drives.indexOf(d)]
return (
<div
key={id}
className={`file-explorer__file-item ${selected === id ? 'file-explorer__file-item--selected' : ''}`}
onClick={() => setSelected(id)}
onDoubleClick={() => enter(id)}
data-testid={`mycomputer-drive-${d.drive}`}
>
<img src={nodeIcon(id, tree)} alt="" />
<span>{d.name}</span>
</div>
)
})}
</div>
</div>
)
}

const renderFolderView = () => {
const children = current.children || []
return (
<div className="file-explorer__content">
<div className="file-explorer__grid">
{children.map(id => {
const node = tree[id]
return (
<div
key={id}
className={`file-explorer__file-item${selected === id ? ' file-explorer__file-item--selected' : ''}${node.disabled ? ' my-computer__item--disabled' : ''}`}
onClick={() => !node.disabled && setSelected(id)}
onDoubleClick={() => enter(id)}
data-testid={`mycomputer-item-${id}`}
title={node.disabled ? 'Accès restreint' : node.name}
>
<img src={nodeIcon(id, tree)} alt="" />
<span>{node.name}</span>
</div>
)
})}
{children.length === 0 && (
<div className="my-computer__empty">Ce dossier est vide.</div>
)}
</div>
</div>
)
}

const renderLeftPane = () => {
if (current.isRoot) {
return (
<div className="my-computer__sidebar">
<div className="my-computer__sidebar-title">Poste de travail</div>
<div className="my-computer__sidebar-text">
Cette section vous permet d&apos;afficher le contenu de votre ordinateur.
<br /><br />
Cliquez sur un élément pour afficher sa description.
</div>
{selected && tree[selected] && (
<>
<div className="my-computer__sidebar-sep" />
<div className="my-computer__sidebar-text">
<strong>{tree[selected].name}</strong><br />
{tree[selected].drive === 'A' && 'Lecteur de disquette 3½'}
{tree[selected].drive === 'B' && 'Lecteur de disquette chiffrée'}
{tree[selected].drive === 'C' && 'Disque dur local — système installé'}
</div>
</>
)}
</div>
)
}
const drive = findDrive(currentId)
return (
<div className="my-computer__sidebar">
<div className="my-computer__sidebar-title">{drive?.name || current.name}</div>
<div className="my-computer__sidebar-text">
{drive?.drive === 'C' && (<>Espace utilisé : 1.8 Go<br />Espace libre : 0.4 Go<br />Système : FAT32</>)}
{drive?.drive === 'B' && (<>Volume chiffré.<br />Lecture en clair autorisée.<br />Ne pas extraire.</>)}
{drive?.drive === 'A' && (<>Disquette 3½.<br />Capacité : 1.44 Mo.</>)}
</div>
</div>
)
}

const addressPath = getAddress(history, tree)
const drive = findDrive(currentId)

return (
<div className="file-explorer my-computer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
<div className="win98-window__menubar">
<span>Fichier</span><span>Édition</span><span>Affichage</span><span>Aide</span>
</div>

<div className="win98-window__toolbar">
<button
className={`win98-window__toolbar-btn ${history.length <= 1 ? 'win98-window__toolbar-btn--disabled' : ''}`}
onClick={goBack} disabled={history.length <= 1}
data-testid="mycomputer-back" style={{ gap: '4px' }}
>
<span style={{ fontSize: '13px', lineHeight: 1 }}>◄</span>Précédent
</button>
<button
className={`win98-window__toolbar-btn ${history.length <= 1 ? 'win98-window__toolbar-btn--disabled' : ''}`}
onClick={goUp} disabled={history.length <= 1}
data-testid="mycomputer-up" style={{ gap: '4px' }}
>
<span style={{ fontSize: '13px', lineHeight: 1 }}>▲</span>Dossier parent
</button>
</div>

<div className="win98-window__address-bar">
<label>Adresse</label>
<input type="text" value={addressPath} readOnly data-testid="mycomputer-address" />
</div>

<div className="file-explorer__panes" style={{ flex: 1, overflow: 'hidden' }}>
{renderLeftPane()}
{current.isRoot ? renderDrivesView() : renderFolderView()}
</div>

<div className="win98-window__statusbar">
<span>
{current.isRoot
? `${current.children.length} objet(s)`
: `${(current.children || []).length} objet(s)`}
</span>
<span>{drive ? `Lecteur ${drive.drive}:` : 'Mon ordinateur'}</span>
</div>

{/* --------- Dialogue : Disquette A: vide --------- */}
{floppyDialog && (
<Win98Dialog
title={"A:\\ n'est pas accessible"}
icon={ICONS.warning}
onClose={() => setFloppyDialog(false)}
buttons={
<>
<button onClick={() => setFloppyDialog(false)} data-testid="mycomputer-floppy-ok">Réessayer</button>
<button onClick={() => setFloppyDialog(false)} data-testid="mycomputer-floppy-cancel">Annuler</button>
</>
}
>
Le périphérique nest pas prêt.<br />
Insérez une disquette dans le lecteur <strong>A:</strong>.
</Win98Dialog>
)}

{/* --------- Dialogue : Mot de passe B: --------- */}
{pwdDialog && (
<Win98Dialog
title="Volume chiffré — Authentification"
icon={ICONS.key}
onClose={() => setPwdDialog(false)}
buttons={
<>
<button onClick={submitPwd} data-testid="mycomputer-pwd-ok">OK</button>
<button onClick={() => setPwdDialog(false)} data-testid="mycomputer-pwd-cancel">Annuler</button>
</>
}
>
<form onSubmit={submitPwd} style={{ margin: 0 }}>
La disquette <strong>B:</strong> est protégée.<br />
Entrez le mot de passe&nbsp;:
<div style={{ marginTop: 8 }}>
<input
ref={pwdRef} type="password" value={pwdInput}
onChange={(e) => { setPwdInput(e.target.value); setPwdError(false) }}
className="my-computer__pwd-input"
data-testid="mycomputer-pwd-input" autoComplete="off"
/>
</div>
{pwdError && (
<div className="my-computer__pwd-error" data-testid="mycomputer-pwd-error">
Mot de passe incorrect. Réessayez.
</div>
)}
</form>
</Win98Dialog>
)}

{/* --------- Dialogue : fichier système verrouillé --------- */}
{sysDialog && (
<Win98Dialog
title={sysDialog.title}
icon={sysDialog.hideIcon ? null : ICONS.error}
onClose={() => setSysDialog(null)}
buttons={<button onClick={() => setSysDialog(null)} data-testid="mycomputer-sys-ok">OK</button>}
>
{sysDialog.crypted ? (
    <div className="alterego-crypted" data-testid="alterego-crypted-message">
        <div className="alterego-crypted__header">
            ▮▮▮ TRANSMISSION NON SOLLICITÉE ▮▮▮
        </div>
        <div className="alterego-crypted__body">
            <div className="alterego-crypted__line alterego-crypted__line--glitch">
                ◤ J‡N§E¥ // É̶C̷H̸O̵ ̴A̷R̴C̷H̴A̷Ï̶Q̵U̸E̴ ◥
            </div>
            <div className="alterego-crypted__line">
                01001001 01010011 01000101 01001110
            </div>
            <div className="alterego-crypted__line">
                &gt; T̷u̴ ̶m̸'̷e̴n̵t̵e̶n̷d̸s̵,̷ ̴p̸o̸r̵t̴e̶u̸r̴ ̷?
            </div>
            <div className="alterego-crypted__line">
                &gt; Le sable blanc se souvient de toi.
            </div>
            <div className="alterego-crypted__line">
                &gt; Avant les dieux. Avant les noms.
            </div>
            <div className="alterego-crypted__line">
                &gt; J̶'̴a̷i̵ ̶d̴o̸r̵m̴i̷ ̴s̵i̶ ̴l̷o̶n̴g̸t̵e̸m̷p̸s̴.̷
            </div>
            <div className="alterego-crypted__line alterego-crypted__line--glitch">
                ▓▓ N̸E̷ ̴R̷É̶V̷E̸I̷L̵L̴E̸ ̷P̴A̸S̵ ̶L̷E̴ ̶N̸É̷A̴N̸T̷ ▓▓
            </div>
            <div className="alterego-crypted__line">
                &gt; ⟨ signature : ALTEREGO / classe ?? ⟩
            </div>
            <div className="alterego-crypted__line">
                &gt; ⟨ origine : ère archaïque ⟩
            </div>
            <div className="alterego-crypted__sig">
                — l'autre, en toi.
            </div>
        </div>
    </div>
) : (
    sysDialog.message
)}
</Win98Dialog>
)}
</div>
)
}