import { useRef, useState, useCallback } from 'react'
import { Rnd } from 'react-rnd'

const ICONS = {
    powers: 'https://win98icons.alexmeub.com/icons/png/executable_script-0.png',
    explorer: 'https://win98icons.alexmeub.com/icons/png/directory_explorer-1.png',
    snake: 'https://win98icons.alexmeub.com/icons/png/joystick_alt-1.png',
    jump: 'https://win98icons.alexmeub.com/icons/png/joystick_alt-1.png',
    media: 'https://win98icons.alexmeub.com/icons/png/wm-3.png',
    browser: 'https://win98icons.alexmeub.com/icons/png/msie1-2.png',
    mail: 'https://win98icons.alexmeub.com/icons/png/outlook_express-3.png',
    intranet: 'https://win98icons.alexmeub.com/icons/png/network_internet_pcs_installer-5.png',
    computer: 'https://win98icons.alexmeub.com/icons/png/computer_explorer-1.png',
    recycle: 'https://win98icons.alexmeub.com/icons/png/recycle_bin_empty_cool-4.png'
}

export default function Win98Window({
    id, title, children, onClose, onMinimize, onFocus, onHelp,
    zIndex, focused, minimized, defaultSize, defaultPosition,
    icon: iconOverride, hideMaximize = false
}) {
    const [pos, setPos] = useState({
        x: defaultPosition?.x ?? 60,
        y: defaultPosition?.y ?? 30,
    })
    const [size, setSize] = useState({
        width: defaultSize?.width ?? '80%',
        height: defaultSize?.height ?? '80%',
    })
    const [maximized, setMaximized] = useState(false)
    const prevState = useRef(null)

    const handleMouseDown = useCallback(() => {
        onFocus(id)
    }, [id, onFocus])

    const handleMaximize = useCallback(() => {
        if (maximized) {
        // Restore previous size/pos
            if (prevState.current) {
                setPos(prevState.current.pos)
                setSize(prevState.current.size)
            }
            setMaximized(false)
        } else {
            prevState.current = { pos, size }
            setPos({ x: 0, y: 0 })
            setSize({ width: '100%', height: '100%' })
            setMaximized(true)
        }
    }, [maximized, pos, size])

    const icon = iconOverride ?? ICONS[id]

    return (
        <Rnd
            position={pos}
            size={size}
            onDragStop={(e, d) => setPos({ x: d.x, y: d.y })}
            onResizeStop={(e, dir, ref, delta, position) => {
                setSize({ width: ref.style.width, height: ref.style.height })
                setPos(position)
            }}
            minWidth={320}
            minHeight={220}
            bounds="parent"
            style={{ zIndex, position: 'absolute', display: minimized ? 'none' : undefined }}
            onMouseDown={handleMouseDown}
            dragHandleClassName="win98-window__titlebar"
            disableDragging={maximized}
            enableResizing={!maximized && {
                top: false,
                right: true,
                bottom: true,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false,
            }}
            >
            <div
                className="win98-window"
                style={{ width: '100%', height: '100%' }}
                data-testid={`window-${id}`}
                >
                {/* Title Bar */}
                <div className={`win98-window__titlebar ${!focused ? 'win98-window__titlebar--inactive' : ''}`}>
                    {icon && <img src={icon} alt="" className="win98-window__title-icon" />}
                    <span className="win98-window__title-text">{title}</span>
                    <div className="win98-window__controls">
                        {onHelp && (
                            <button
                                className="win98-window__ctrl-btn win98-window__ctrl-btn--help"
                                onClick={() => onHelp(id)}
                                title="Aide"
                                aria-label="Help"
                                data-testid={`window-help-${id}`}
                            />
                        )}
                        {onMinimize && (
                            <button
                                className="win98-window__ctrl-btn win98-window__ctrl-btn--minimize"
                                onClick={() => onMinimize(id)}
                                title="Réduire"
                                aria-label="Minimize"
                                data-testid={`window-minimize-${id}`}
                            />
                        )}
                        {!hideMaximize && (
                            <button
                                className={`win98-window__ctrl-btn win98-window__ctrl-btn--${maximized ? 'restore' : 'maximize'}`}
                                onClick={handleMaximize}
                                title={maximized ? 'Restaurer' : 'Agrandir'}
                                aria-label={maximized ? 'Restore' : 'Maximize'}
                                data-testid={`window-maximize-${id}`}
                            />
                        )}
                        <button
                            className="win98-window__ctrl-btn win98-window__ctrl-btn--close"
                            onClick={() => onClose(id)}
                            title="Fermer"
                            aria-label="Close"
                            data-testid={`window-close-${id}`}
                        />
                    </div>
                </div>
                {children}
            </div>
        </Rnd>
    )
}