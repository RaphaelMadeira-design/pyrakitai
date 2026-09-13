import { useState, useEffect, useRef, useCallback } from 'react'
import '../styles/MediaPlayer.scss'

const PLAYLIST = [
    { title: 'M.O.O.N. — Dust', file: '/music/track01.mp3' },
    { title: '憂鬱 — Sun', file: '/music/track02.mp3' },
    { title: 'Lonely Lies, GOLDKID$ — Interlinked', file: '/music/track03.mp3' },
    { title: 'Visitor — RnB', file: '/music/track04.mp3' },
    { title: 'ILLENIUM — Fractures', file: '/music/track05.mp3' },
]

const fmt = (s) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
}

export default function MediaPlayer({ requestedTrack }) {
    const audioRef = useRef(null)
    const canvasRef = useRef(null)
    const analyserRef = useRef(null)
    const sourceRef = useRef(null)
    const animRef = useRef(null)
    const ctxRef = useRef(null)

    const [trackIdx, setTrackIdx] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [current, setCurrent] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const [status, setStatus] = useState('Prêt')

    const track = PLAYLIST[trackIdx]
    const trackIdxRef = useRef(trackIdx)
    useEffect(() => { trackIdxRef.current = trackIdx }, [trackIdx])

    // ── Init Web Audio ────────────────────────────────────
    const initAudio = useCallback(() => {
        if (analyserRef.current) return
        const actx = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = actx.createAnalyser()
        analyser.fftSize = 64
        const source = actx.createMediaElementSource(audioRef.current)
        source.connect(analyser)
        analyser.connect(actx.destination)
        analyserRef.current = analyser
        sourceRef.current = source
        ctxRef.current = actx
    }, [])

    // ── Visualiseur ───────────────────────────────────────
    const drawViz = useCallback(() => {
        const canvas = canvasRef.current
        const analyser = analyserRef.current
        if (!canvas || !analyser) return
        const ctx = canvas.getContext('2d')
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const W = canvas.width, H = canvas.height
        ctx.fillStyle = '#000810'
        ctx.fillRect(0, 0, W, H)
        const barW = Math.floor(W / data.length) - 1
        data.forEach((val, i) => {
            const pct = val / 255
            const h = Math.floor(pct * H)
            const r = Math.floor(20 + pct * 80)
            const g = Math.floor(180 + pct * 60)
            const b = Math.floor(255)
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(i * (barW + 1), H - h, barW, h)
            ctx.fillStyle = '#00ffff'
            ctx.fillRect(i * (barW + 1), H - h - 2, barW, 2)
        })
        animRef.current = requestAnimationFrame(drawViz)
    }, [])

    const startViz = useCallback(() => {
        cancelAnimationFrame(animRef.current)
        drawViz()
    }, [drawViz])

    const stopViz = useCallback(() => {
        cancelAnimationFrame(animRef.current)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000810'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [])

// ── Play / Pause / Stop ───────────────────────────────
    const play = useCallback(() => {
        initAudio()
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
        audioRef.current.play()
        setPlaying(true)
        setStatus(`Lecture : ${PLAYLIST[trackIdxRef.current].title}`)
        startViz()
    }, [initAudio, startViz])

    const pause = useCallback(() => {
        audioRef.current.pause()
        setPlaying(false)
        setStatus('En pause')
        stopViz()
    }, [stopViz])

    const stop = useCallback(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setPlaying(false)
        setProgress(0)
        setCurrent(0)
        setStatus('Arrêté')
        stopViz()
    }, [stopViz])

    const prev = useCallback(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setProgress(0)
        setCurrent(0)
        setTrackIdx(i => (i - 1 + PLAYLIST.length) % PLAYLIST.length)
    }, [])

    const next = useCallback(() => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setProgress(0)
        setCurrent(0)
        setTrackIdx(i => (i + 1) % PLAYLIST.length)
    }, [])

    // ── Changer de piste (boutons prev/next) ──────────────
    useEffect(() => {
        audioRef.current.load()
        if (playing) {
            audioRef.current.play()
            startViz()
            setStatus(`Lecture : ${PLAYLIST[trackIdx].title}`)
        }
    }, [trackIdx])

    // ── Piste demandée depuis FileExplorer ────────────────
    useEffect(() => {
        if (!requestedTrack) return
        const idx = PLAYLIST.findIndex(t => t.file === requestedTrack.file)
        if (idx === -1) return
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setProgress(0)
        setCurrent(0)
        setTrackIdx(idx)
        setTimeout(() => {
            initAudio()
            if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
            audioRef.current.load()
            audioRef.current.play()
            setPlaying(true)
            setStatus(`Lecture : ${PLAYLIST[idx].title}`)
            startViz()
        }, 50)
    }, [requestedTrack])

    // ── Progression ───────────────────────────────────────
    useEffect(() => {
        const audio = audioRef.current
        const onTime = () => {
            setCurrent(audio.currentTime)
            setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
        }
        const onLoad = () => setDuration(audio.duration)
        const onEnd = () => next()
        audio.addEventListener('timeupdate', onTime)
        audio.addEventListener('loadedmetadata', onLoad)
        audio.addEventListener('ended', onEnd)
        return () => {
            audio.removeEventListener('timeupdate', onTime)
            audio.removeEventListener('loadedmetadata', onLoad)
            audio.removeEventListener('ended', onEnd)
        }
    }, [next])

    // ── Volume ────────────────────────────────────────────
    useEffect(() => { audioRef.current.volume = volume }, [volume])

    // ── Seek ──────────────────────────────────────────────
    const seek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const pct = (e.clientX - rect.left) / rect.width
        audioRef.current.currentTime = pct * (audioRef.current.duration || 0)
    }

    // ── Nettoyage ─────────────────────────────────────────
    useEffect(() => () => {
        cancelAnimationFrame(animRef.current)
        ctxRef.current?.close()
    }, [])

    return (
        <div className="wmp">
            <audio ref={audioRef} src={track.file} preload="metadata" />

            {/* Menu bar */}
            <div className="wmp__menubar">
                {['Fichier', 'Affichage', 'Lecture', 'Aide'].map(m => (
                    <span key={m}>{m}</span>
                ))}
            </div>

            {/* Visualiseur */}
            <div className="wmp__viz-wrap">
                <canvas ref={canvasRef} className="wmp__canvas" width={320} height={80} />
                <div className="wmp__viz-overlay">
                    <span className="wmp__viz-title">{track.title}</span>
                </div>
            </div>

            {/* Infos piste */}
            <div className="wmp__info">
                <span className="wmp__track-name">{track.title}</span>
                <span className="wmp__time">{fmt(current)} / {fmt(duration)}</span>
            </div>

            {/* Barre de progression */}
            <div className="wmp__seek" onClick={seek} title="Cliquez pour chercher">
                <div className="wmp__seek-fill" style={{ width: `${progress * 100}%` }} />
                <div className="wmp__seek-thumb" style={{ left: `${progress * 100}%` }} />
            </div>

            {/* Contrôles */}
            <div className="wmp__controls">
                <div className="wmp__btns">
                    <button className="wmp__btn" onClick={prev} title="Précédent">⏮</button>
                    {playing
                        ? <button className="wmp__btn wmp__btn--pause" onClick={pause} title="Pause">⏸</button>
                        : <button className="wmp__btn wmp__btn--play" onClick={play} title="Lecture">▶</button>
                    }
                    <button className="wmp__btn wmp__btn--stop" onClick={stop} title="Stop">■</button>
                    <button className="wmp__btn" onClick={next} title="Suivant">⏭</button>
                </div>

                {/* Volume */}
                <div className="wmp__volume">
                    <span className="wmp__vol-label">VOLUME</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.02"
                        value={volume}
                        className="wmp__vol-slider"
                        style={{ "--value": volume }}
                        onChange={e => setVolume(+e.target.value)}
                    />
                </div>
            </div>

            {/* Playlist */}
            <div className="wmp__playlist">
                {PLAYLIST.map((t, i) => (
                    <div
                        key={i}
                        className={`wmp__pl-item${trackIdx === i ? ' wmp__pl-item--active' : ''}`}
                        onDoubleClick={() => { setTrackIdx(i); setTimeout(play, 50) }}
                    >
                        <span className="wmp__pl-idx">{String(i + 1).padStart(2, '0')}</span>
                        <span className="wmp__pl-name">{t.title}</span>
                    </div>
                ))}
            </div>

            {/* Barre de statut */}
            <div className="wmp__statusbar">
                <span>{status}</span>
            </div>
        </div>
    )
}