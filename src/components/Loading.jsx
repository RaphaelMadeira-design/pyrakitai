import '../styles/Loading.scss'

export default function Loading({ label }) {

    return (
        <div className="loading-overlay">
            <div className="loading-dialog">
                <div className="loading-dialog__titlebar">Chargement...</div>
                <img
                    className="loading-dialog__icon"
                    src="https://win98icons.alexmeub.com/icons/png/application_hourglass_small-2.png"
                    alt="chargement"
                />
                <div className="loading-dialog__label">
                    <i>Veuillez patienter...</i>
                    <br />Chargement de <strong>{label}</strong>
                </div>
            </div>
        </div>
    )
}