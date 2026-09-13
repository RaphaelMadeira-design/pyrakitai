import { useState } from 'react'
import '../styles/CRTFrame.scss'

export default function CRTFrame({ children, onReset }) {
    const [powerOn, setPowerOn] = useState(false)
    const [screenOn, setScreenOn] = useState(true)
    const [brightness, setBrightness] = useState(100)
    const [animatingOff, setAnimatingOff] = useState(false)

    const handlePower = () => {
        if (powerOn) {
            // Animation CRT shutdown : shrink → line → black
            setAnimatingOff(true)
            setTimeout(() => {
                setAnimatingOff(false)
                setPowerOn(false)
                setScreenOn(true)
            }, 650)
        } else {
            onReset?.()
            setScreenOn(true)
            setPowerOn(true)
        }
    }

    return (
        <div className="crt-monitor" data-testid="crt-monitor">
            <div className="crt-monitor__frame">
                <div className="crt-monitor__screen-area">
                    <div className="crt-monitor__bezel">
                        <div className={`crt-monitor__screen ${screenOn ? 'crt-monitor__screen--on' : ''}`}>
                            <div className="crt-monitor__scanlines" />
                            <div className="crt-monitor__flicker" />
                            <div className="crt-monitor__vignette" />
                            <div className="crt-monitor__curvature" />

                            <div
                                className={`crt-monitor__content${animatingOff ? ' crt-monitor__content--off-anim' : ''}`}
                                style={{ filter: `brightness(${brightness}%)` }}
                            >
                                {powerOn ? (
                                    typeof children === 'function'
                                    ? children({ powerOff: handlePower })
                                    : children
                                ) : (
                                    <div className="crt-monitor__off-screen">
                                        <span>NO SIGNAL</span>
                                    </div>
                                )}
                            </div>

                            <div className="crt-monitor__reflection" />
                        </div>
                    </div>
                </div>

                <div className="crt-monitor__controls">
                    <div className="crt-monitor__brand">
                        <span className="crt-monitor__brand-logo">PYRAKITAI</span>
                        <span className="crt-monitor__brand-model">MultiSync 98</span>
                    </div>

                    <div className="crt-monitor__buttons">
                        <div className="crt-monitor__button-group">
                            <button
                                className="crt-monitor__btn crt-monitor__btn--small"
                                onClick={() => setBrightness(b => Math.max(50, b - 10))}
                                title="Luminosité -"
                            >
                                <span>◐</span>
                            </button>
                            <button
                                className="crt-monitor__btn crt-monitor__btn--small"
                                onClick={() => setBrightness(b => Math.min(120, b + 10))}
                                title="Luminosité +"
                            >
                                <span>◑</span>
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className={`crt-monitor__btn crt-monitor__btn--power${powerOn ? ' crt-monitor__btn--power-on' : ''}`}
                                onClick={handlePower}
                                title="Power"
                            >
                                <span>⏻</span>
                            </button>
                            <div className={`crt-monitor__led${powerOn ? ' crt-monitor__led--on' : ''}`} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}