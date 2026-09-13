export default function Notepad({ fileName, content }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Menubar */}
            <div className="win98-window__menubar">
                <span>Fichier</span>
                <span>Édition</span>
                <span>Format</span>
                <span>Aide</span>
            </div>

            {/* Zone de texte éditable style Bloc-notes */}
            <textarea
                defaultValue={content || ''}
                style={{
                flex: 1,
                resize: 'none',
                border: 'none',
                outline: 'none',
                padding: '4px 6px',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                background: '#ffffff',
                color: '#000000',
                overflowY: 'auto',
                }}
                data-testid="notepad-textarea"
                spellCheck={false}
            />

            {/* Statusbar */}
            <div className="win98-window__statusbar">
                <span>{fileName}</span>
                <span>Ln 1, Col 1</span>
            </div>
        </div>
    )
}