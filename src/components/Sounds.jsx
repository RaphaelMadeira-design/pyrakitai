let audioCtx = null

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
}

function playChord(notes) {
    const ctx = getCtx()
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
}

const Sounds = {
    // Windows 98 startup
    startup() {
        playChord([
            { freq: 523.25, delay: 0,    dur: 0.6,  vol: 0.05,  type: 'sine' },     // C5
            { freq: 659.25, delay: 0.15, dur: 0.5,  vol: 0.05,  type: 'sine' },     // E5
            { freq: 783.99, delay: 0.3,  dur: 0.45, vol: 0.045, type: 'sine' },     // G5
            { freq: 1046.5, delay: 0.45, dur: 0.7,  vol: 0.04,  type: 'sine' },     // C6
            // Harmony
            { freq: 261.63, delay: 0,    dur: 0.8,  vol: 0.03,  type: 'triangle' }, // C4
            { freq: 329.63, delay: 0.15, dur: 0.7,  vol: 0.03,  type: 'triangle' }, // E4
            { freq: 392.00, delay: 0.3,  dur: 0.65, vol: 0.025, type: 'triangle' }, // G4
            { freq: 523.25, delay: 0.45, dur: 0.9,  vol: 0.025, type: 'triangle' }, // C5
        ])
    },

    // Shutdown
    shutdown() {
        playChord([
            { freq: 784, delay: 0,    dur: 0.4, vol: 0.04,  type: 'sine' },
            { freq: 659, delay: 0.12, dur: 0.35, vol: 0.04, type: 'sine' },
            { freq: 523, delay: 0.24, dur: 0.3, vol: 0.035, type: 'sine' },
            { freq: 392, delay: 0.36, dur: 0.5, vol: 0.03,  type: 'sine' },
            { freq: 392, delay: 0,    dur: 0.6, vol: 0.02,  type: 'triangle' },
            { freq: 329, delay: 0.12, dur: 0.5, vol: 0.02,  type: 'triangle' },
            { freq: 261, delay: 0.24, dur: 0.5, vol: 0.02,  type: 'triangle' },
            { freq: 196, delay: 0.36, dur: 0.7, vol: 0.015, type: 'triangle' },
        ])
    },
}

export default Sounds
