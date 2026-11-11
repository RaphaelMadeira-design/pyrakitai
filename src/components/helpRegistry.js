import HELP from '../data/help.json'

// Les fenêtres Bloc-notes ont un id du type « notepad-xxx » : elles partagent la même aide.
export const getHelpKey = (windowId = '') =>
    windowId.startsWith('notepad-') ? 'notepad' : windowId

export const hasHelp = (windowId) => Boolean(HELP.apps[getHelpKey(windowId)])

export const getHelpTitle = (key) => {
    const app = HELP.apps[key]
    return app ? `Rubriques d'aide : ${app.name}` : 'Aide'
}

export const HELP_ICON = 'https://win98icons.alexmeub.com/icons/png/help_book_big-0.png'