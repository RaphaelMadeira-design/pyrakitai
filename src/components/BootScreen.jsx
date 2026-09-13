import { useState, useEffect, useRef } from 'react'
import Sounds from '../components/Sounds'
import '../styles/Boot.scss'

// Séquence BIOS - lignes qui s'affichent une par une
const BIOS_LINES = [
    { text: 'Award Modular BIOS v4.51PG, An Energy Star Ally', delay: 0 },
    { text: 'Copyright (C) XXXX-XX, Award Software, Inc.', delay: 80 },
    { text: '', delay: 160 },
    { text: 'PYR_PC BIOS Version 1.00', delay: 240 },
    { text: '', delay: 320 },
    { text: 'CPU : AMD K6-2/350MHz', delay: 400 },
    { text: 'Memory Test :  32768K OK', delay: 600, typewrite: true },
    { text: '', delay: 1100 },
    { text: 'Detecting Primary Master ... ST34321A', delay: 1200 },
    { text: 'Detecting Primary Slave  ... None', delay: 1380 },
    { text: 'Detecting Secondary Master ... APATI CD-ROM', delay: 1560 },
    { text: '', delay: 1740 },
    { text: 'Press DEL to enter SETUP', delay: 1820, dim: true },
    { text: '', delay: 1900 },
    { text: 'Verifying DMI Pool Data ........', delay: 2000 },
    { text: 'Boot from CD : .', delay: 2300 },
    { text: 'Boot from CD : ..Fail', delay: 2500 },
    { text: 'Boot from Floppy : Fail', delay: 2700 },
    { text: 'Boot from HDD-0 : OK', delay: 2900, highlight: true },
]

// Phases : 'bios' | 'win98' | 'progress' | 'done'
export default function BootScreen({ onDone }) {
    const [phase, setPhase] = useState('bios')
    const [visibleBios, setVisibleBios] = useState([])
    const [progress, setProgress] = useState(0)
    const [scanOn, setScanOn] = useState(true)
    const timerRef = useRef(null)

    useEffect(() => {
        const img = new Image()
        img.src = '/images/Windows_98_logo.png'
    }, [])

    // --- Phase BIOS ---
    useEffect(() => {
        if (phase !== 'bios') return
        const timers = BIOS_LINES.map((line, i) =>
            setTimeout(() => {
                setVisibleBios(prev => [...prev, i])
            }, line.delay)
        )
        // Fin du BIOS → transition vers Win98
        const end = setTimeout(() => { 
            Sounds.biosBeep()
            setPhase('win98') 
        }, 3200)
        return () => { 
            timers.forEach(clearTimeout)
            clearTimeout(end)
        }
    }, [phase])

    // --- Phase Win98 logo ---
    useEffect(() => {
        if (phase !== 'win98') return
        const end = setTimeout(() => setPhase('progress'), 1200)
        return () => clearTimeout(end)
    }, [phase])

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

            {/* Phase Windows 98 logo */}
            {(phase === 'win98' || phase === 'progress') && (
                <div className="boot-win98" data-testid="boot-win98">
                    <img
                        src="/images/Windows_98_logo.png"
                        alt="Windows 98"
                        className="boot-win98__logo"
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