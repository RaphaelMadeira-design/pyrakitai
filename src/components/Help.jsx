import HELP from "../data/help.json"

export default function Help({ app }) {

    const data = HELP[app]

    if (!data) {
        return (
            <div className="help">
                <p>Aucune aide disponible.</p>
            </div>
        )
    }

    return (
        <div className="help">

            <h2>{data.title}</h2>

            {data.sections.map((section, index) => (
                <div key={index}>

                    <h3>{section.title}</h3>

                    <p>{section.text}</p>

                </div>
            ))}

        </div>
    )
}