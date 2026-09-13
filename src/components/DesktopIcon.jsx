import { useRef, useCallback } from 'react'
import Sounds from '../components/Sounds'

const CELL = 78

const snapToGrid = (x, y) => ({
    x: Math.round(x / CELL) * CELL,
    y: Math.round(y / CELL) * CELL,
})

export default function DesktopIcon({ id, label, icon, onOpen, onSelect, selected, position, onDragEnd }) {
    const dragRef    = useRef(null)
    const movedRef   = useRef(false)
    const snapPosRef = useRef(null)

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return
        e.preventDefault()

        const startX = e.clientX - position.x
        const startY = e.clientY - position.y
        movedRef.current  = false
        snapPosRef.current = null

        const onMouseMove = (ev) => {
            const dx = Math.abs(ev.clientX - e.clientX)
            const dy = Math.abs(ev.clientY - e.clientY)
            if (dx > 4 || dy > 4) movedRef.current = true
            if (dragRef.current) {
                const snapped = snapToGrid(
                    Math.max(0, ev.clientX - startX),
                    Math.max(0, ev.clientY - startY),
                )
                snapPosRef.current = snapped
                // Transform au lieu de left/top → position d'origine préservée
                dragRef.current.style.transform = `translate(${snapped.x - position.x}px, ${snapped.y - position.y}px)`
                dragRef.current.style.opacity = '0.7'
            }
        }

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)

            if (dragRef.current) {
                // Efface le transform → revient visuellement à la position d'origine
                dragRef.current.style.transform = ''
                dragRef.current.style.opacity = '1'
            }

            if (movedRef.current && snapPosRef.current) {
                onDragEnd(id, snapPosRef.current)
            } else {
                Sounds.click()
                onSelect(id)
            }
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }, [id, position, onSelect, onDragEnd])

    return (
        <div
            ref={dragRef}
            className={`desktop-icon${selected ? ' desktop-icon--selected' : ''}`}
            style={{ position: 'absolute', left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => { Sounds.doubleClick(); onOpen(id) }}
            tabIndex={0}
            data-testid={`desktop-icon-${id}`}
            title={`Ouvrir ${label}`}
        >
            <img className="desktop-icon__img" src={icon} alt={label} draggable={false} />
            <span className="desktop-icon__label">{label}</span>
        </div>
    )
}