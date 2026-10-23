import { useState, useCallback, useEffect } from 'react'
import './styles/Desktop.scss'

import DesktopIcon from './components/DesktopIcon'
import Win98Window from './components/Win98Window'
import LoginScreen from './components/LoginScreen'
import Taskbar from './components/Taskbar'
import StartMenu from './components/StartMenu'
import Pouvoirs from './components/Pouvoirs'
import FileExplorer from './components/FileExplorer'
import Intranet from './components/Intranet'
import Notepad from './components/Notepad'
import BootScreen from './components/BootScreen'
import ShutdownDialog from './components/ShutdownDialog'
import Snake from './components/Snake'
import JumpGame from './components/JumpGame'
import VirusSurvivors from "./components/VirusSurvivors"
import MyComputer from './components/MyComputer'
import Loading from './components/Loading'
import MediaPlayer from './components/MediaPlayer'
import Mail from './components/Mail'
import PDAView from './components/PDAView'
import CRTFrame from './components/CRTFrame'
import CMD from './components/CMD'
import ImageViewer from './components/ImageViewer'
import Browser from './components/Browser'
import MSNApp from './components/MSN'
import Sounds from './components/Sounds'
import Help from './components/Help'
import Trash from './components/Trash'
import './styles/Alterego.scss'

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false
        return window.innerWidth <= breakpoint || 'ontouchstart' in window
    })

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= breakpoint || 'ontouchstart' in window)
        }
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [breakpoint])
    return isMobile
}

const CELL = 78

const INITIAL_ICONS = [
    {
        id: 'mail',
        label: 'Inlook Express',
        icon: 'https://win98icons.alexmeub.com/icons/png/outlook_express-4.png',
        x: 0, y: 2
    },
    {
        id: 'browser',
        label: 'Internet Voyager',
        icon: 'https://win98icons.alexmeub.com/icons/png/msie2-1.png',
        x: 1, y: 0,
    },
    {
        id: 'computer',
        label: 'Poste de travail',
        icon: 'https://win98icons.alexmeub.com/icons/png/computer_explorer-4.png',
        x: 0, y: 0,
    },
    { 
        id: 'msn', 
        label: 'NSN Messenger', 
        icon: '/images/icons/32x32/messenger.png', 
        x: 0, y: 1,
    },
    {
        id: 'intranet',
        label: 'Intranet',
        icon: 'https://win98icons.alexmeub.com/icons/png/network_internet_pcs_installer-2.png',
        x: 1, y: 1,
    },
    {
        id: 'recycle',
        label: 'Corbeille',
        icon: 'https://win98icons.alexmeub.com/icons/png/recycle_bin_full-3.png',
        x: 0, y: 4,
    },
].map(icon => ({ ...icon, x: icon.x * CELL, y: icon.y * CELL }))

const WINDOW_CONFIGS = {
    powers: {
        title: 'Registre des capacités — ABILITY_GAUGE.exe',
        defaultSize: { width: '87%', height: '95%' },
        defaultPosition: { x: 150, y: 20 },
    },
    explorer: {
        title: 'Explorateur de Fichiers',
        defaultSize: { width: '82%', height: '80%' },
        defaultPosition: { x: 50, y: 25 },
    },
    snake: {
        title: 'Snake — SNAKE.exe',
        defaultSize: { width: '40%', height: '70%' },
        defaultPosition: { x: 40, y: 20 },
    },
    jump: {
        title: 'Jeu de saut — JUMP.exe',
        defaultSize: { width: '40%', height: '50%' },
        defaultPosition: { x: 40, y: 20 },
    },
    virus: {
        title: 'VirusSurvivors — VIRUS.exe',
        defaultSize: { width: '50%', height: '90%' },
        defaultPosition: { x: 60, y: 20 },
    },
    mail: {
        title: 'Courrier électronique — Boîte de réception',
        defaultSize: { width: '70%', height: '85%' },
        defaultPosition: { x: 100, y: 40 },
    },
    computer: {
        title: 'Poste de travail',
        defaultSize: { width: 760, height: 520 },
        defaultPosition: { x: 90, y: 40 },
    },
    media: {
        title: 'Vindows Media Player',
        defaultSize: { width: 340, height: 460 },
        defaultPosition: { x: 80, y: 20 },
    },
    cmd: {
        title: 'Invite de commandes',
        defaultSize: { width: 600, height: 380 },
        defaultPosition: { x: 80, y: 60 },
    },
    imageviewer: {
        title: "Visionneuse d'image",
        defaultSize: { width: 500, height: 520 },
        defaultPosition: { x: 100, y: 30 },
    },
    browser: {
        title: 'Internet Voyager',
        defaultSize: { width: '100%', height: '100%' },
        defaultPosition: { x: 0, y: 0 },
    },
    intranet: {
        title: 'Intranet — PYRAKI-NET v1.02',
        defaultSize: { width: '80%', height: '85%' },
        defaultPosition: { x: 60, y: 30 },
    },
    help: {
    title: "Aide",
    defaultSize: { width: 540, height: 420 },
    defaultPosition: { x: 120, y: 60 },
    },
    recycle: {
        title: 'Corbeille',
        defaultSize: { width: 680, height: 460 },
        defaultPosition: { x: 110, y: 50 },
    },
}

const NO_LOADING_WINDOWS = new Set([
    'explorer',
    'cmd',
    'media',
    'computer',
    'browser',
    'mail',
    'imageviewer',
    'recycle',
])

const LOADING_LABELS = {
    powers: 'ABILITY_GAUGE.exe',
    snake: 'SNAKE.exe',
    jump: 'JUMP.exe',
    virus: 'VIRUS.exe',
    intranet : 'PYRAKI-NET v1.02',
}

const makeNotepadConfig = (fileId, fileName) => ({
    title: `${fileName} - Bloc-notes`,
    defaultSize: { width: 540, height: 420 },
    defaultPosition: { x: 80 + Math.random() * 120, y: 40 + Math.random() * 80 },
    notepadFile: { id: fileId, name: fileName },
})

let zCounter = 100

function App() {
    const isMobile = useIsMobile()
    const [booted, setBooted] = useState(false)
    const [loggedIn, setLoggedIn] = useState(false)
    const [windows, setWindows] = useState([])
    const [startOpen, setStartOpen] = useState(false)
    const [showShutdown, setShowShutdown] = useState(false)
    const [icons, setIcons] = useState(INITIAL_ICONS)
    const [selectedIcon, setSelectedIcon] = useState(null)
    const [loading, setLoading] = useState(null)
    const [mediaTrack, setMediaTrack] = useState(null)
    const [imageToView, setImageToView] = useState(null)
    const [msnOpen, setMsnOpen] = useState(false)
    const [msnMinimized, setMsnMinimized] = useState(false)
    const [alteregoGlitch, setalteregoGlitch] = useState(false)

    useEffect(() => {
        const handler = (e) => {
            const duration = e?.detail?.duration ?? 4000
            setalteregoGlitch(true)
            const t = setTimeout(() => setalteregoGlitch(false), duration)
            return () => clearTimeout(t)
        }
        window.addEventListener('isen:alterego-glitch', handler)
        return () => window.removeEventListener('isen:alterego-glitch', handler)
    }, [])

    const handleIconDragEnd = useCallback((id, pos) => {
        setIcons(prev => {
            const others = prev.filter(ic => ic.id !== id)
            const isOccupied = (x, y) => others.some(ic => ic.x === x && ic.y === y)

            if (!isOccupied(pos.x, pos.y)) {
                return prev.map(ic => ic.id === id ? { ...ic, ...pos } : ic)
            }

            return prev
        })
    }, [])

    useEffect(() => {
        if (msnOpen) {
            setWindows(prev => {
                if (prev.find(w => w.id === 'msn')) return prev
                return [
                ...prev.map(w => ({ ...w, focused: false })),
                    { id: 'msn', title: 'NSN Messenger', minimized: false, focused: true, zIndex: ++zCounter }
                ]
            })
        } else {
            setWindows(prev => prev.filter(w => w.id !== 'msn'))
            setMsnMinimized(false)
        }
    }, [msnOpen])

    useEffect(() => {
        if (!msnOpen) return
        setWindows(prev => prev.map(w =>
            w.id === 'msn' ? { ...w, minimized: msnMinimized, focused: !msnMinimized } : w
        ))
    }, [msnMinimized, msnOpen])

    const openWindow = useCallback((id, options = {}) => {
        if (id === 'msn') { 
            setMsnOpen(true)
            setMsnMinimized(false)
            setStartOpen(false)
            Sounds.windowOpen()
            return
        }
        if (id.startsWith("help-")) {
            setWindows(prev => {
                const existing = prev.find(w => w.id === id)

                if (existing) {
                    return prev.map(w =>
                        w.id === id
                            ? {
                                ...w,
                                minimized: false,
                                focused: true,
                                zIndex: ++zCounter,
                            }
                            : { ...w, focused: false }
                    )
                }

                const { defaultSize, defaultPosition } = WINDOW_CONFIGS.help

                return [
                    ...prev.map(w => ({ ...w, focused: false })),
                    {
                        id,
                        title: `Aide - ${options.helpApp}`,
                        defaultSize,
                        defaultPosition,
                        helpApp: options.helpApp,
                        minimized: false,
                        focused: true,
                        zIndex: ++zCounter,
                    }
                ]
            })

            Sounds.windowOpen()
            return
        }
        const skipLoading = NO_LOADING_WINDOWS.has(id) || id.startsWith('notepad-')
        setWindows(prev => {
            const existing = prev.find(w => w.id === id)
            if (existing) {
                return prev.map(w =>
                    w.id === id
                    ? { ...w, minimized: false, focused: true, zIndex: ++zCounter, ...(options.initialFolder ? { initialFolder: options.initialFolder } : {}) }
                    : { ...w, focused: false }
                )
            }
            return prev
        })
        setStartOpen(false)

        setWindows(prev => {
            const existing = prev.find(w => w.id === id)
            if (existing) return prev

            if (skipLoading) {
                Sounds.windowOpen()
                return [
                    ...prev.map(w => ({ ...w, focused: false })),
                    { id, ...WINDOW_CONFIGS[id], initialFolder: options.initialFolder, helpApp: options.helpApp, minimized: false, focused: true, zIndex: ++zCounter }
                ]
            }

            const delay = 1200 + Math.random() * 1000
            setLoading({ id, label: LOADING_LABELS[id] || id })
            setTimeout(() => {
                setLoading(null)
                Sounds.windowOpen()
                setWindows(prev2 => {
                    if (prev2.find(w => w.id === id)) return prev2
                    return [
                        ...prev2.map(w => ({ ...w, focused: false })),
                        { id, ...WINDOW_CONFIGS[id], initialFolder: options.initialFolder, helpApp: options.helpApp, minimized: false, focused: true, zIndex: ++zCounter }
                    ]
                })
            }, delay)
            return prev
        })
    }, [])

    const closeWindow = useCallback((id) => {
        if (id === 'msn') { 
            setMsnOpen(false)
            Sounds.windowClose()
            return 
        }
        Sounds.windowClose()
        setWindows(prev => prev.filter(w => w.id !== id))
    }, [])

    const minimizeWindow = useCallback((id) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, minimized: true, focused: false } : w
        ))
    }, [])

    const focusWindow = useCallback((id) => {
        setWindows(prev => prev.map(w =>
            w.id === id
            ? { ...w, focused: true, zIndex: ++zCounter }
            : { ...w, focused: false }
        ))
    }, [])

    const handleHelp = useCallback((id) => {
        openWindow(`help-${id}`, {
            helpApp: id,
        })
    }, [openWindow])

    const toggleWindow = useCallback((id) => {
        if (id === 'msn') { 
            if (!msnOpen) {
                setMsnOpen(true)
                setMsnMinimized(false)
            } else {
                setMsnMinimized(prev => !prev)
            }
            return 
        }
        setWindows(prev => {
            const win = prev.find(w => w.id === id)
            if (!win) return prev
            if (win.minimized) {
                return prev.map(w =>
                    w.id === id
                    ? { ...w, minimized: false, focused: true, zIndex: ++zCounter }
                    : { ...w, focused: false }
                )
            }
            if (win.focused) {
                return prev.map(w =>
                    w.id === id ? { ...w, minimized: true, focused: false } : w
                )
            }
            return prev.map(w =>
                w.id === id
                ? { ...w, focused: true, zIndex: ++zCounter }
                : { ...w, focused: false }
            )
        })
    }, [msnOpen])

    const openNotepad = useCallback(({ id, name, content }) => {
        const winId = `notepad-${id}`
        setWindows(prev => {
            const existing = prev.find(w => w.id === winId)
            if (existing) {
                return prev.map(w =>
                    w.id === winId
                    ? { ...w, minimized: false, focused: true, zIndex: ++zCounter }
                    : { ...w, focused: false }
                )
            }
            return [
                ...prev.map(w => ({ ...w, focused: false })),
                {
                    id: winId,
                    ...makeNotepadConfig(id, name),
                    notepadContent: content,
                    minimized: false,
                    focused: true,
                    zIndex: ++zCounter,
                },
            ]
        })
    }, [])

    const handlePlayMusic = useCallback((track) => {
        openWindow('media')
        setMediaTrack(track)
    }, [openWindow])

    const handleOpenImage = useCallback((img) => {
        openWindow('imageviewer')
        setImageToView(img)
    }, [openWindow])

    const renderWindowContent = (win) => {
        const { id } = win
        if (id === 'powers') return <Pouvoirs />
        if (id === 'cmd') return <CMD />
        if (id === 'browser') return <Browser />
        if (id === 'snake') return <Snake />
        if (id === 'jump') return <JumpGame />
        if (id === 'virus') return <VirusSurvivors />
        if (id === 'mail') return <Mail />
        if (id === 'intranet') return <Intranet onOpenWindow={openWindow} />
        if (id === 'recycle') return <Trash />
        if (id.startsWith("help-")) { return <Help app={win.helpApp} />}
        if (id === 'imageviewer') return <ImageViewer requestedImage={imageToView} />
        if (id === 'media') return <MediaPlayer requestedTrack={mediaTrack} />
        if (id === 'computer') return (<MyComputer onOpenNotepad={openNotepad} onOpenWindow={openWindow} onOpenImage={handleOpenImage} desktopIcons={icons}/>)
        if (id === 'explorer') return (<FileExplorer key={win.initialFolder ?? 'root'} onOpenNotepad={openNotepad} onPlayMusic={handlePlayMusic} onOpenImage={handleOpenImage} initialFolder={win.initialFolder}/>)
        if (id.startsWith('notepad-')) return <Notepad fileName={win.notepadFile?.name} content={win.notepadContent} />
        return null
    }

    const handleReset = useCallback(() => {
        setBooted(false)
        setLoggedIn(false)
        setWindows([])
        setStartOpen(false)
        setShowShutdown(false)
        setLoading(null)
        setMsnOpen(false)
        setMsnMinimized(false)
    }, [])

    const handleLock = useCallback(() => {
        setStartOpen(false)
        setLoggedIn(false)
    }, [])

    if (isMobile) {
        return <PDAView />
    }

    return (
        <CRTFrame onReset={handleReset}>
            {({ powerOff }) => (
                <div className={`desktop${alteregoGlitch ? ' desktop--alterego-glitch' : ''}`} data-testid="desktop"
                    onMouseDown={(e) => {
                        if (!e.target.closest('.start-menu') && !e.target.closest('.taskbar')) {
                            setStartOpen(false)
                        }
                        if (!e.target.closest('.desktop-icon')) {
                            setSelectedIcon(null)
                        }
                    }}>

                    {/* Boot screen */}
                    {!booted && <BootScreen onDone={() => { setBooted(true) }} />}

                    {/* Écran d'accueil (logon) — uniquement après le boot */}
                    {booted && !loggedIn && (
                        <LoginScreen onLogin={() => { Sounds.startup(); setLoggedIn(true) }} />
                    )}

                    {/* Wallpaper */}
                    {loggedIn && (
                        <div className={`desktop__wallpaper${windows.some(w => !w.minimized && w.id !== 'msn') ? ' desktop__wallpaper--dimmed' : ''}`} data-testid="desktop-wallpaper" />
                    )}

                    {/* Scan lines overlay */}
                    <div className="scanlines" />

                    {/* alterego glitch overlay */}
                    {alteregoGlitch && (
                        <div className="alterego-overlay" data-testid="alterego-glitch-overlay">
                            <div className="alterego-overlay__noise" />
                            <div className="alterego-overlay__bars" />
                            <div className="alterego-overlay__rgb" />
                            <div className="alterego-overlay__text">
                                <span className="alterego-overlay__line">J̷I̷N̸S̴E̵I̷</span>
                                <span className="alterego-overlay__line">É̶C̷H̸O̵ ̴A̷R̴C̷H̴A̷Ï̶Q̵U̸E̴</span>
                                <span className="alterego-overlay__line">011010 01101001</span>
                                <span className="alterego-overlay__line">N̸E̷ ̴R̷É̶V̷E̸I̷L̵L̴E̸ ̷P̴A̸S̵</span>
                            </div>
                        </div>
                    )}

                    {/* Watermark */}
                    {loggedIn && (
                        <div className="desktop__watermark">
                            <span>PC-98</span>
                        </div>
                    )}

                    {/* Desktop Icons */}
                    {loggedIn && icons.map(icon => (
                        <DesktopIcon
                            key={icon.id}
                            id={icon.id}
                            label={icon.label}
                            icon={icon.icon}
                            position={{ x: icon.x, y: icon.y }}
                            selected={selectedIcon === icon.id}
                            onSelect={setSelectedIcon}
                            onOpen={openWindow}
                            onDragEnd={handleIconDragEnd}
                        />
                    ))}

                    {/* Windows container */}
                    {loggedIn && (
                        <div className="desktop__content" style={{ position: 'absolute', inset: '0 0 32px 0' }}>
                            {windows.filter(win => win.id !== 'msn').map(win => (
                                <Win98Window
                                    key={win.id}
                                    id={win.id}
                                    title={win.title}
                                    zIndex={win.zIndex}
                                    focused={win.focused}
                                    minimized={win.minimized}
                                    defaultSize={win.defaultSize}
                                    defaultPosition={win.defaultPosition}
                                    onClose={closeWindow}
                                    onMinimize={minimizeWindow}
                                    onFocus={focusWindow}
                                    onHelp={
                                        ["browser", "intranet", "mail", "computer"].includes(win.id)
                                            ? handleHelp
                                            : undefined
                                    }
                                >
                                    {renderWindowContent(win)}
                                </Win98Window>
                            ))}
                        </div>
                    )}

                    {/* Spinner de chargement */}
                    {loading && <Loading label={loading.label} />}

                    {/* Start Menu */}
                    {startOpen && (
                        <StartMenu
                            onClose={() => setStartOpen(false)}
                            onOpenWindow={openWindow}
                            onShutdown={() => setShowShutdown(true)}
                            onLock={handleLock}
                        />
                    )}

                    {/* Dialog Arrêt de Windows */}
                    {showShutdown && (
                        <ShutdownDialog
                            onCancel={() => setShowShutdown(false)}
                            onShutdownSound={Sounds.shutdown}
                            onConfirm={() => {
                                setShowShutdown(false)
                                powerOff()
                            }}
                        />
                    )}

                    {/* MSN App */}
                    {msnOpen && loggedIn && (
                        <div
                            className="desktop__content"
                            style={{
                                position: 'absolute',
                                inset: '0 0 32px 0',
                                display: msnMinimized ? 'none' : undefined,
                            }}
                        >
                            <MSNApp
                                onClose={() => { setMsnOpen(false); setMsnMinimized(false) }}
                                onMinimize={() => setMsnMinimized(true)}
                            />
                        </div>
                    )}

                    {/* Taskbar */}
                    {loggedIn && (
                        <Taskbar
                            windows={windows}
                            onWindowFocus={focusWindow}
                            onWindowToggle={toggleWindow}
                            onStartClick={(e) => { e.stopPropagation(); setStartOpen(prev => !prev); }}
                            startOpen={startOpen}
                        />
                    )}
                </div>
            )}
        </CRTFrame>
    )
}

export default App