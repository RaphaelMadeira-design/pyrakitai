import { useState, useEffect, useRef } from 'react'
import Sounds from '../components/Sounds'
import '../styles/Boot.scss'

const BIOS_LINES = [
    { text: 'Award Modular BIOS v4.51PG, An Energy Star Ally', delay: 0 },
    { text: 'Copyright (C) XXXX-XX, Award Software, Inc.', delay: 80 },
    { text: '', delay: 160 },
    { text: 'PYR_PC BIOS Version 1.00', delay: 240 },
    { text: '', delay: 320 },
    { text: 'CPU : AMD K6-2/350MHz', delay: 600 },
    { text: 'Memory Test :  32768K OK', delay: 900, typewrite: true },
    { text: '', delay: 1300 },
    { text: 'Detecting Primary Master ... ST34321A', delay: 1500 },
    { text: 'Detecting Primary Slave  ... None', delay: 1900 },
    { text: 'Detecting Secondary Master ... APATI CD-ROM', delay: 2260 },
    { text: '', delay: 2440 },
    { text: 'Press DEL to enter SETUP', delay: 3220, dim: true },
    { text: '', delay: 3600 },
    { text: 'Verifying DMI Pool Data ........', delay: 5000 },
    { text: 'Boot from CD : .', delay: 6000 },
    { text: 'Boot from CD : ..Fail', delay: 6500 },
    { text: 'Boot from Floppy : Fail', delay: 6700 },
    { text: 'Boot from HDD-0 : OK', delay: 8900, highlight: true },
]

const SETUP_LEFT = [
    '► Standard CMOS Features',
    '► Advanced BIOS Features',
    '► Advanced Chipset Features',
    '► Integrated Peripherals',
    '► Power Management Setup',
    '► PnP/PCI Configurations',
    '► PC Health Status',
]
const SETUP_RIGHT = [
    '► Frequency/Voltage Control',
    '  Load Fail-Safe Defaults',
    '  Load Optimized Defaults',
    '  Set Supervisor Password',
    '  Set User Password',
    '  Save & Exit Setup',
    '  Exit Without Saving',
]

const SETUP_PAGES = {
    'Standard CMOS Features': [
        ['Date (mm:dd:yy)', 'Sat, Oct 18 2026'],
        ['Time (hh:mm:ss)', '04:20:00'],
        ['Primary Master', 'ST34321A — 4.3 GB'],
        ['Primary Slave', 'None'],
        ['Secondary Master', 'APATI CD-ROM'],
        ['Floppy Drive A', '1.44M, 3.5 in', ['None', '360K, 5.25 in', '1.2M, 5.25 in', '720K, 3.5 in', '1.44M, 3.5 in', '2.88M, 3.5 in']],
        ['Halt On', 'All, But Keyboard', ['All Errors', 'No Errors', 'All, But Keyboard', 'All, But Diskette']],
    ],
    'Advanced BIOS Features': [
        ['Virus Warning', 'Disabled', ['Enabled', 'Disabled']],
        ['Quick Power On Self Test', 'Enabled', ['Enabled', 'Disabled']],
        ['First Boot Device', 'HDD-0', ['Floppy', 'HDD-0', 'CDROM', 'LAN', 'Disabled']],
        ['Second Boot Device', 'Floppy', ['Floppy', 'HDD-0', 'CDROM', 'LAN', 'Disabled']],
        ['Third Boot Device', 'CDROM', ['Floppy', 'HDD-0', 'CDROM', 'LAN', 'Disabled']],
        ['Boot Up NumLock Status', 'On', ['On', 'Off']],
        ['Security Option', 'Setup', ['Setup', 'System']],
    ],
    'Advanced Chipset Features': [
        ['SDRAM CAS Latency Time', '3', ['2', '3']],
        ['SDRAM Cycle Time (Tras/Trc)', '6/8', ['5/7', '6/8', '7/9']],
        ['Memory Hole At 15M-16M', 'Disabled', ['Enabled', 'Disabled']],
        ['AGP Aperture Size', '64M', ['16M', '32M', '64M', '128M', '256M']],
        ['Video BIOS Shadow', 'Enabled', ['Enabled', 'Disabled']],
    ],
    'Integrated Peripherals': [
        ['On-Chip Primary PCI IDE', 'Enabled', ['Enabled', 'Disabled']],
        ['On-Chip Secondary PCI IDE', 'Enabled', ['Enabled', 'Disabled']],
        ['USB Controller', 'Enabled', ['Enabled', 'Disabled']],
        ['AC97 Audio', 'Auto', ['Auto', 'Disabled']],
        ['Onboard FDC Controller', 'Enabled', ['Enabled', 'Disabled']],
        ['Onboard Serial Port 1', '3F8/IRQ4', ['Disabled', '3F8/IRQ4', '2F8/IRQ3', '3E8/IRQ4']],
    ],
    'Power Management Setup': [
        ['ACPI Function', 'Enabled', ['Enabled', 'Disabled']],
        ['ACPI Suspend Type', 'S1 (POS)', ['S1 (POS)', 'S3 (STR)']],
        ['Power Management', 'User Define', ['Min Saving', 'Max Saving', 'User Define']],
        ['Video Off Method', 'DPMS', ['Blank Screen', 'V/H SYNC+Blank', 'DPMS']],
        ['Suspend Mode', 'Disabled', ['Disabled', '1 Min', '10 Min', '1 Hour']],
        ['Soft-Off by PWR-BTTN', 'Delay 4 Sec', ['Instant-Off', 'Delay 4 Sec']],
        ['Wake-Up by LAN', 'Disabled', ['Enabled', 'Disabled']],
    ],
    'PnP/PCI Configurations': [
        ['Reset Configuration Data', 'Disabled', ['Enabled', 'Disabled']],
        ['Resources Controlled By', 'Auto (ESCD)', ['Auto (ESCD)', 'Manual']],
        ['PCI/VGA Palette Snoop', 'Disabled', ['Enabled', 'Disabled']],
        ['Assign IRQ For VGA', 'Enabled', ['Enabled', 'Disabled']],
        ['Assign IRQ For USB', 'Enabled', ['Enabled', 'Disabled']],
    ],
    'PC Health Status': [
        ['CPU Temperature', '42°C / 107°F'],
        ['System Temperature', '35°C / 95°F'],
        ['CPU Fan Speed', '3512 RPM'],
        ['Vcore', '2.0V'],
        ['+3.3V', '3.29V'],
        ['+5V', '5.02V'],
        ['+12V', '12.06V'],
    ],
    'Frequency/Voltage Control': [
        ['CPU Host Clock', '100 MHz', ['66 MHz', '75 MHz', '100 MHz', '112 MHz']],
        ['CPU Ratio', 'x 3.5', ['x 2.0', 'x 2.5', 'x 3.0', 'x 3.5', 'x 4.0']],
        ['DRAM Clock', '100 MHz', ['66 MHz', '100 MHz', '133 MHz']],
        ['CPU Vcore', '2.0V Default', ['1.8V', '2.0V Default', '2.2V', '2.4V']],
    ],
    'Load Fail-Safe Defaults': [
        ['Load Fail-Safe Defaults', 'N', ['N', 'Y']],
        ['Effet', 'Restaure les réglages sûrs'],
    ],
    'Load Optimized Defaults': [
        ['Load Optimized Defaults', 'N', ['N', 'Y']],
        ['Effet', 'Restaure les réglages optimaux'],
    ],
    'Set Supervisor Password': [
        ['Supervisor Password', 'Disabled', ['Disabled', 'Enabled']],
        ['Note', "Protège l'accès au SETUP"],
    ],
    'Set User Password': [
        ['User Password', 'Disabled', ['Disabled', 'Enabled']],
        ['Note', 'Demandé à chaque démarrage'],
    ],
    'Save & Exit Setup': [
        ['Save & Exit Setup', 'N', ['N', 'Y']],
        ['Effet', 'Sauvegarde et redémarre'],
    ],
    'Exit Without Saving': [
        ['Exit Without Saving', 'N', ['N', 'Y']],
        ['Effet', 'Quitte sans sauvegarder'],
    ],
}

export default function BootScreen({ onDone }) {
    const [phase, setPhase] = useState('bios')
    const [visibleBios, setVisibleBios] = useState([])
    const [logoLoaded, setLogoLoaded] = useState(false)
    const [progress, setProgress] = useState(0)
    const [scanOn, setScanOn] = useState(true)
    const [setupCol, setSetupCol] = useState(0)
    const [setupSel, setSetupSel] = useState(0)
    const [setupPage, setSetupPage] = useState(null)
    const [setupRow, setSetupRow] = useState(0)
    const [setupEdits, setSetupEdits] = useState({})
    const timerRef = useRef(null)

    useEffect(() => {
        const img = new Image()
        img.src = '/images/Windows_98_logo.png'
    }, [])

    // --- Phase BIOS : les lignes s'affichent une par une ---
    useEffect(() => {
        if (phase !== 'bios') return
        const timers = BIOS_LINES.map((line, i) =>
            setTimeout(() => {
                setVisibleBios(prev => [...prev, i])
            }, line.delay)
        )
        return () => { 
            timers.forEach(clearTimeout)
        }
    }, [phase])

    // --- Fin du BIOS : pas de durée fixe en parallèle — la phase Windows ---
    // ne démarre QUE lorsque chaque ligne du BIOS est réellement affichée.
    useEffect(() => {
        if (phase !== 'bios') return
        if (visibleBios.length < BIOS_LINES.length) return
        const end = setTimeout(() => { 
            Sounds.biosBeep()
            setPhase('win98') 
        }, 350)
        return () => clearTimeout(end)
    }, [phase, visibleBios])

    // --- Phase logo Win98 : la barre de progression ne démarre QUE si ---
    // le logo est réellement chargé et resté affiché un instant.
    useEffect(() => {
        if (phase !== 'win98' || !logoLoaded) return
        const end = setTimeout(() => setPhase('progress'), 1100)
        return () => clearTimeout(end)
    }, [phase, logoLoaded])

    // --- Phase barre de progression ---
    useEffect(() => {
        if (phase !== 'progress') return
        const steps = [10, 20, 30, 40, 50, 58, 66, 74, 82, 90, 95, 100]
        let i = 0
        const tick = () => {
            if (i >= steps.length) return
            setProgress(steps[i])
            i++
            timerRef.current = setTimeout(tick, 200 + Math.random() * 180)
        }
        timerRef.current = setTimeout(tick, 300)
        return () => clearTimeout(timerRef.current)
    }, [phase])

    // --- Progression 100% → done ---
    useEffect(() => {
        if (progress === 100) {
            setTimeout(() => {
                setScanOn(false);
                setTimeout(onDone, 600)
            }, 500)
        }
    }, [progress, onDone])

    // --- Clavier : DEL (BIOS) → SETUP · flèches/ENTRÉE naviguent · +/− modifient ---
    // --- ESC revient au menu / ESC·F10 quittent le SETUP -------------------------
    useEffect(() => {
        const onKey = (e) => {
            if (phase === 'bios' && e.key === 'Delete') {
                e.preventDefault()
                Sounds.biosBeep()
                setSetupCol(0)
                setSetupSel(0)
                setSetupPage(null)
                setSetupRow(0)
                setSetupEdits({})
                setPhase('setup')
                return
            }
            if (phase !== 'setup') return

            const cols = [SETUP_LEFT, SETUP_RIGHT]

            // Sous-page ouverte : ↑↓ parcourent, +/− modifient, ESC revient au menu
            if (setupPage) {
                const rows = SETUP_PAGES[setupPage]
                if (e.key === 'Escape') {
                    e.preventDefault()
                    Sounds.click()
                    setSetupPage(null)
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    Sounds.click()
                    const d = e.key === 'ArrowUp' ? -1 : 1
                    setSetupRow(r => (r + d + rows.length) % rows.length)
                } else if (['+', '-', '=', 'PageUp', 'PageDown'].includes(e.key)) {
                    e.preventDefault()
                    const options = rows[setupRow][2]
                    if (!options) return
                    Sounds.click()
                    const d = (e.key === '-' || e.key === 'PageDown') ? -1 : 1
                    const key = `${setupPage}|${setupRow}`
                    setSetupEdits(prev => {
                        const cur = prev[key] ?? rows[setupRow][1]
                        const idx = options.indexOf(cur)
                        const next = options[(idx === -1 ? 0 : idx + d + options.length) % options.length]
                        return { ...prev, [key]: next }
                    })
                }
                return
            }

            if (e.key === 'Escape' || e.key === 'F10') {
                e.preventDefault()
                Sounds.biosBeep()
                setPhase('win98')
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
                Sounds.click()
                const len = cols[setupCol].length
                const d = e.key === 'ArrowUp' ? -1 : 1
                setSetupSel(s => (s + d + len) % len)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault()
                Sounds.click()
                setSetupCol(c => (c === 0 ? 1 : 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                Sounds.biosBeep()
                setSetupRow(0)
                setSetupPage(cols[setupCol][setupSel].replace('► ', '').trim())
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [phase, setupCol, setupSel, setupPage, setupRow])

    return (
        <div className={`boot-screen ${!scanOn ? 'boot-screen--fade' : ''}`} data-testid="boot-screen">
            {/* Effet scanlines CRT */}
            <div className="boot-screen__scanlines" />

            {/* Phase BIOS */}
            {phase === 'bios' && (
                <div className="boot-bios" data-testid="boot-bios">
                    {BIOS_LINES.map((line, i) =>
                        visibleBios.includes(i) ? (
                            <div
                                key={i}
                                className={`boot-bios__line${line.dim ? ' boot-bios__line--dim' : ''}${line.highlight ? ' boot-bios__line--highlight' : ''}`}
                                >
                                {line.text}&nbsp;
                            </div>
                        ) : null
                    )}
                    <div className="boot-bios__cursor">_</div>
                </div>
            )}

            {/* Phase SETUP (DEL pendant le BIOS) */}
            {phase === 'setup' && (
                <div className="boot-setup" data-testid="boot-setup">
                    <div className="boot-setup__title">PYR_PC SETUP UTILITY — VERSION 1.00</div>

                    {!setupPage ? (
                        <>
                            <div className="boot-setup__grid">
                                <div className="boot-setup__col">
                                    {SETUP_LEFT.map((item, i) => (
                                        <div
                                            key={item}
                                            className={`boot-setup__item${setupCol === 0 && setupSel === i ? ' boot-setup__item--selected' : ''}`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <div className="boot-setup__col">
                                    {SETUP_RIGHT.map((item, i) => (
                                        <div
                                            key={item}
                                            className={`boot-setup__item${setupCol === 1 && setupSel === i ? ' boot-setup__item--selected' : ''}`}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="boot-setup__status">
                                <span>CPU : AMD K6-2/350MHz</span>
                                <span>Base Memory : 640K</span>
                                <span>Extended Memory : 31744K</span>
                            </div>

                            <div className="boot-setup__footer">
                                <span><b>ESC</b> : Quitter</span>
                                <span><b>↑↓←→</b> : Choisir un élément</span>
                                <span><b>ENTRÉE</b> : Ouvrir</span>
                                <span><b>F10</b> : Sauvegarder &amp; quitter</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="boot-setup__page" data-testid="boot-setup-page">
                                <div className="boot-setup__page-title">{setupPage}</div>
                                <div className="boot-setup__rows">
                                    {SETUP_PAGES[setupPage].map(([k, v, options], i) => (
                                        <div
                                            key={k}
                                            className={`boot-setup__row${setupRow === i ? ' boot-setup__row--selected' : ''}`}
                                        >
                                            <span>{k}</span>
                                            <span className={`boot-setup__value${options ? ' boot-setup__value--editable' : ''}`}>
                                                {setupEdits[`${setupPage}|${i}`] ?? v}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="boot-setup__footer">
                                <span><b>ESC</b> : Retour au menu</span>
                                <span><b>↑↓</b> : Choisir un paramètre</span>
                                <span><b>+/−</b> : Modifier</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Phase Windows 98 logo */}
            {(phase === 'win98' || phase === 'progress') && (
                <div className="boot-win98" data-testid="boot-win98">
                    <img
                        src="/images/Windows_98_logo.png"
                        alt="Windows 98"
                        className="boot-win98__logo"
                        onLoad={() => setLogoLoaded(true)}
                    />

                    {phase === 'progress' && (
                        <div className="boot-win98__progress-wrap" data-testid="boot-progress">
                            <div className="boot-win98__progress-bar">
                                <div
                                    className="boot-win98__progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}