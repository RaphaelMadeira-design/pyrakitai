let audioCtx = null

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
}

// ── Utility ──────────────────────────────────────────────────────

function playTone(freq, duration, type = 'square', volume = 0.08, ramp = true) {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    if (ramp) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
}

function playNoise(duration, volume = 0.04) {
    const ctx = getCtx()
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
}

// ── Individual sounds ────────────────────────────────────────────

const Sounds = {
    // Short click for buttons, icons, menus
    click() {
        const ctx = getCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = 1000
        gain.gain.value = 0.06
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.04)
    },

    // Window open — ascending two-note chime
    windowOpen() {
        playTone(440, 0.08, 'sine', 0.07)
        setTimeout(() => playTone(587, 0.1, 'sine', 0.06), 60)
    },

    // Window close — descending two-note
    windowClose() {
        playTone(523, 0.07, 'sine', 0.06)
        setTimeout(() => playTone(392, 0.1, 'sine', 0.05), 50)
    },

    // Minimize — quick drop
    minimize() {
        playTone(600, 0.06, 'sine', 0.05)
        setTimeout(() => playTone(400, 0.08, 'sine', 0.04), 40)
    },

    // Error dialog — classic Windows error beep
    error() {
        playTone(440, 0.15, 'square', 0.06)
        setTimeout(() => playTone(349, 0.2, 'square', 0.05), 150)
    },

    // Start menu open
    menuOpen() {
        playTone(523, 0.05, 'sine', 0.06)
        setTimeout(() => playTone(659, 0.06, 'sine', 0.05), 40)
        setTimeout(() => playTone(784, 0.08, 'sine', 0.04), 80)
    },

    // Start menu close  
    menuClose() {
        playTone(659, 0.04, 'sine', 0.04)
        setTimeout(() => playTone(523, 0.06, 'sine', 0.03), 30)
    },

    // Navigation / folder open
    navigate() {
        playTone(800, 0.03, 'sine', 0.04)
        setTimeout(() => playTone(1000, 0.04, 'sine', 0.03), 25)
    },

    // Windows 98 startup chime — 4-note ascending chord
    startup() {
        const ctx = getCtx()
        const notes = [
            { freq: 523.25, delay: 0,    dur: 0.6,  vol: 0.05, type: 'sine' },    // C5
            { freq: 659.25, delay: 0.15, dur: 0.5,  vol: 0.05, type: 'sine' },    // E5
            { freq: 783.99, delay: 0.3,  dur: 0.45, vol: 0.045, type: 'sine' },   // G5
            { freq: 1046.5, delay: 0.45, dur: 0.7,  vol: 0.04, type: 'sine' },    // C6
            // Harmony
            { freq: 261.63, delay: 0,    dur: 0.8,  vol: 0.03, type: 'triangle' }, // C4
            { freq: 329.63, delay: 0.15, dur: 0.7,  vol: 0.03, type: 'triangle' }, // E4
            { freq: 392.00, delay: 0.3,  dur: 0.65, vol: 0.025, type: 'triangle' },// G4
            { freq: 523.25, delay: 0.45, dur: 0.9,  vol: 0.025, type: 'triangle' },// C5
        ]
        notes.forEach(n => {
            setTimeout(() => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = n.type
                osc.frequency.value = n.freq
                gain.gain.setValueAtTime(n.vol, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.dur)
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + n.dur)
            }, n.delay * 1000)
        })
    },

    // Shutdown — descending chord
    shutdown() {
        const ctx = getCtx()
        const notes = [
            { freq: 784,  delay: 0,    dur: 0.4, vol: 0.04, type: 'sine' },
            { freq: 659,  delay: 0.12, dur: 0.35, vol: 0.04, type: 'sine' },
            { freq: 523,  delay: 0.24, dur: 0.3, vol: 0.035, type: 'sine' },
            { freq: 392,  delay: 0.36, dur: 0.5, vol: 0.03, type: 'sine' },
            { freq: 392,  delay: 0,    dur: 0.6, vol: 0.02, type: 'triangle' },
            { freq: 329,  delay: 0.12, dur: 0.5, vol: 0.02, type: 'triangle' },
            { freq: 261,  delay: 0.24, dur: 0.5, vol: 0.02, type: 'triangle' },
            { freq: 196,  delay: 0.36, dur: 0.7, vol: 0.015, type: 'triangle' },
        ]
        notes.forEach(n => {
            setTimeout(() => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = n.type
                osc.frequency.value = n.freq
                gain.gain.setValueAtTime(n.vol, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.dur)
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + n.dur)
            }, n.delay * 1000)
        })
    },

    // MSN notification — the classic \"nudge\"
    msnNotify() {
        playTone(880, 0.08, 'sine', 0.06)
        setTimeout(() => playTone(1175, 0.08, 'sine', 0.06), 100)
        setTimeout(() => playTone(880, 0.12, 'sine', 0.05), 200)
    },

    // Double-click — two rapid clicks
    doubleClick() {
        Sounds.click()
        setTimeout(() => Sounds.click(), 80)
    },

    // Boot beep (BIOS POST)
    biosBeep() {
        playTone(1000, 0.12, 'square', 0.05)
    },

    // ── Game sounds ────────────────────────────────────────────────

    // Score / eat food — quick ascending bling
    gameScore() {
        playTone(880, 0.05, 'square', 0.06)
        setTimeout(() => playTone(1320, 0.08, 'square', 0.05), 40)
    },

    // Game over — descending crash
    gameOver() {
        playTone(440, 0.1, 'square', 0.07)
        setTimeout(() => playTone(330, 0.1, 'square', 0.06), 80)
        setTimeout(() => playTone(220, 0.15, 'square', 0.05), 160)
        setTimeout(() => playNoise(0.12, 0.04), 240)
    },

    // Game start — quick ascending jingle
    gameStart() {
        playTone(523, 0.06, 'square', 0.05)
        setTimeout(() => playTone(659, 0.06, 'square', 0.05), 60)
        setTimeout(() => playTone(784, 0.06, 'square', 0.05), 120)
        setTimeout(() => playTone(1047, 0.1, 'square', 0.04), 180)
    },

    // Jump — quick whoosh
    gameJump() {
        const ctx = getCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
        gain.gain.value = 0.05
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)
    },
}

export default Sounds