import '../styles/Page404.scss'

export default function Page404({ url, config }) {
    const p = config
    return (
        <div className="page404" data-testid="page-404">
            <div className="page404-header">
                <img src={p.errorIcon} alt="" />
                <h1>{p.title}</h1>
            </div>
            <div className="page404-body">
                <p>{p.description}</p>
                <ul>
                    <li>{p.checks[0]} : <em>{url}</em></li>
                    <li>{p.checks[1]}</li>
                </ul>
                <div className="page404-code">{p.code}</div>
            </div>
            <details className="page404-details">
                <summary>Informations techniques</summary>
                <pre className="page404-hidden">{p.hiddenComment}</pre>
            </details>
        </div>
    )
}