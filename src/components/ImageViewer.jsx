import { useEffect, useMemo, useState } from 'react'
import '../styles/ImageViewer.scss'

const FALLBACK_IMAGES = [
    { name: '1.jpg',    file: '/images/1.jpg' },
    { name: '2.jpg',    file: '/images/2.jpg' },
    { name: '3.jpg',    file: '/images/3.jpg' },
    { name: '4.jpg',    file: '/images/4.jpg' },
    { name: '5.jpg',    file: '/images/5.jpg' },
    { name: '6.jpg',    file: '/images/6.jpg' },
    { name: 'scar.jpg', file: '/images/scar.jpg' },
    { name: 'cratere.jpg', file: '/images/cratere.jpg' },
]

export default function ImageViewer({ requestedImage }) {
    const images = useMemo(() => {
        const siblings = requestedImage?.siblings
        if (Array.isArray(siblings) && siblings.length > 0) return siblings
        return FALLBACK_IMAGES
    }, [requestedImage])

    const [currentIdx, setCurrentIdx] = useState(0)
    const [zoom, setZoom] = useState(1)

    useEffect(() => {
        if (!requestedImage) return
        const idx = images.findIndex(img => img.file === requestedImage.file)
        if (idx !== -1) {
            setCurrentIdx(idx)
            setZoom(1)
        } else {
            setCurrentIdx(0)
            setZoom(1)
        }
    }, [requestedImage, images])

    const image = images[currentIdx] || images[0]

    const zoomIn  = () => setZoom(z => Math.min(z + 0.25, 4))
    const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25))
    const fitView = () => setZoom(1)
    const prev    = () => { setCurrentIdx(i => (i - 1 + images.length) % images.length); setZoom(1) }
    const next    = () => { setCurrentIdx(i => (i + 1) % images.length); setZoom(1) }

    return (
        <div className="imgv">
            {/* Menu bar */}
            <div className="imgv__menubar">
                {['Fichier', 'Affichage', 'Image', 'Aide'].map(m => (
                    <span key={m}>{m}</span>
                ))}
            </div>

            {/* Toolbar */}
            <div className="imgv__toolbar">
                <button className="imgv__btn" onClick={prev} title="Image précédente" data-testid="imgv-prev">◄</button>
                <button className="imgv__btn" onClick={next} title="Image suivante" data-testid="imgv-next">►</button>
                <div className="imgv__separator" />
                <button className="imgv__btn" onClick={zoomIn}  title="Zoom +" data-testid="imgv-zoom-in">+</button>
                <button className="imgv__btn" onClick={zoomOut} title="Zoom -" data-testid="imgv-zoom-out">−</button>
                <button className="imgv__btn" onClick={fitView} title="Taille normale" data-testid="imgv-zoom-fit">⊡</button>
                <div className="imgv__separator" />
                <span className="imgv__zoom-label">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Zone d'affichage */}
            <div className="imgv__canvas">
                <div className="imgv__checkerboard">
                    <img
                        src={image.file}
                        alt={image.name}
                        className="imgv__image"
                        style={{ transform: `scale(${zoom})` }}
                        draggable={false}
                        data-testid="imgv-image"
                    />
                </div>
            </div>

            {/* Barre de statut */}
            <div className="imgv__statusbar">
                <span data-testid="imgv-name">{image.name}</span>
                <span data-testid="imgv-counter">{currentIdx + 1} / {images.length}</span>
            </div>
        </div>
    )
}