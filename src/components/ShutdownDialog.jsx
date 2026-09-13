import '../styles/ShutdownDialog.scss'

export default function ShutdownDialog({ onCancel, onShutdownSound, onConfirm }) {
    const handleYes = () => {
        if (onShutdownSound) onShutdownSound()
        if (onConfirm) onConfirm()
    }

    return (
        <>
            {/* Fond semi-transparent */}
            <div className="shutdown-dialog__overlay" />

            {/* Fenêtre dialog */}
            <div data-testid="shutdown-dialog" className="shutdown-dialog">
                {/* Titlebar */}
                <div className="shutdown-dialog__titlebar">
                    <img
                        src="https://win98icons.alexmeub.com/icons/png/monitor_blue_grad-0.png"
                        alt=""
                        style={{ width: 16, height: 16, imageRendering: 'pixelated' }}
                    />
                    <span className="title-text">
                        Arrêt de Windows
                    </span>
                </div>

                {/* Corps */}
                <div className="shutdown-dialog__body">
                    <img
                        src="https://win98icons.alexmeub.com/icons/png/monitor_black.png"
                        alt=""
                    />
                    <div className="shutdown-dialog__body-text">
                        <p><b>Voulez-vous arrêter l'ordinateur ?</b></p>
                        <p>Toutes les fenêtres ouvertes seront fermées.</p>
                    </div>
                </div>

                {/* Séparateur */}
                <div className="shutdown-dialog__separator" />

                {/* Boutons */}
                <div className="shutdown-dialog__buttons">
                    <Btn onClick={handleYes} testId="shutdown-yes" autoFocus>
                        <img
                            src="https://win98icons.alexmeub.com/icons/png/trust0-1.png"
                            alt=""
                        />
                        Oui
                    </Btn>
                    <Btn onClick={onCancel} testId="shutdown-no">
                        <img
                            src="https://win98icons.alexmeub.com/icons/png/msg_error-2.png"
                            alt=""
                        />
                        Non
                    </Btn>
                </div>
            </div>
        </>
    )
}

function Btn({ children, onClick, testId, autoFocus }) {
    return (
        <button
            onClick={onClick}
            data-testid={testId}
            autoFocus={autoFocus}
            className="shutdown-dialog__button"
            >
            {children}
        </button>
    )
}