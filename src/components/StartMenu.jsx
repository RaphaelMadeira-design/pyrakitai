import { useState, useCallback } from 'react'
import Sounds from '../components/Sounds'

const ICONS = {
    start:        'https://win98icons.alexmeub.com/icons/png/windows-0.png',
    powers:       'https://win98icons.alexmeub.com/icons/png/shell_window5-0.png',
    folderExplorer: 'https://win98icons.alexmeub.com/icons/png/directory_explorer-2.png',
    folderClosed: 'https://win98icons.alexmeub.com/icons/png/directory_closed-0.png',
    shutdown:     'https://win98icons.alexmeub.com/icons/png/monitor_blue_grad-0.png',
    lock:         'https://win98icons.alexmeub.com/icons/png/key_padlock-1.png',
    snake:        'https://win98icons.alexmeub.com/icons/png/joystick_alt-0.png',
    jump:         'https://win98icons.alexmeub.com/icons/png/joystick_alt-0.png',
    virus:        'https://win98icons.alexmeub.com/icons/png/joystick_alt-0.png',
    games:        'https://win98icons.alexmeub.com/icons/png/joystick-2.png',
    media:        'https://win98icons.alexmeub.com/icons/png/wm-2.png',
    cmd:          'https://win98icons.alexmeub.com/icons/png/console_prompt-0.png',
    browser:      'https://win98icons.alexmeub.com/icons/png/msie1-1.png',
    msn:          '/images/icons/32x32/messenger.png',
    mail:         'https://win98icons.alexmeub.com/icons/png/outlook_express-0.png',
    computer:     'https://win98icons.alexmeub.com/icons/png/computer_explorer-2.png',
    intranet:     'https://win98icons.alexmeub.com/icons/png/network_internet_pcs_installer-3.png'
}

export default function StartMenu({ onClose, onOpenWindow, onShutdown, onLock }) {
    const [gamesOpen, setGamesOpen] = useState(false)
    const [docsOpen,  setDocsOpen]  = useState(false)

    const handle = useCallback((id, options = {}) => {
        Sounds.click()
        onOpenWindow(id, options)
        onClose()
    }, [onOpenWindow, onClose])

    return (
        <>
            <div className="start-menu__overlay" onClick={onClose} />

            <div className="start-menu" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="start-menu__sidebar">
                    <span><strong>WindOS</strong> 98</span>
                </div>

                <div className="start-menu__content">
                    <div className="start-menu__item" onClick={() => handle('intranet')} data-testid="start-menu-intranet">
                        <img src={ICONS.intranet} alt="WELLSTON-NET" />
                        WELLSTON-NET v5.04
                    </div>

                    <div className="start-menu__item" onClick={() => handle('powers')} data-testid="start-menu-powers">
                        <img src={ICONS.powers} alt="Jinsei" />
                        ABILITY_GAUGE.exe
                    </div>

                    <div className="start-menu__item" onClick={() => handle('browser')} data-testid="start-menu-browser">
                        <img src={ICONS.browser} alt="Internet Explorer" />
                        Internet Voyager
                    </div>

                    <div className="start-menu__item" onClick={() => handle('msn')} data-testid="start-menu-msn">
                        <img src={ICONS.msn} alt="MSN" />
                        NSN Messenger
                    </div>

                    <div className="start-menu__item" onClick={() => handle('mail')} data-testid="start-menu-mail">
                        <img src={ICONS.mail} alt="Mail" />
                        Inlook Express
                    </div>

                    <div className="start-menu__item" onClick={() => handle('media')} data-testid="start-menu-media">
                        <img src={ICONS.media} alt="Media" />
                        Media Player
                    </div>

                    {/* Mes Documents avec sous-menu */}
                    <div
                        className={`start-menu__item${docsOpen ? ' start-menu__item--sub-open' : ''}`}
                        onMouseEnter={() => setDocsOpen(true)}
                        onMouseLeave={() => setDocsOpen(false)}
                        data-testid="start-menu-docs"
                        >
                        <img src={ICONS.folderExplorer} alt="Explorateur de fichiers" />
                        Explorateur de fichiers
                        <span className="start-menu__item__arrow">▶</span>

                        {docsOpen && (
                            <div className="start-menu__submenu">
                                <div className="start-menu__item" onClick={() => handle('explorer', { initialFolder: 'important' })} data-testid="start-menu-docs-important">
                                    <img src={ICONS.folderClosed} alt="Important" />
                                    Important
                                </div>
                                <div className="start-menu__item" onClick={() => handle('explorer', { initialFolder: 'musique' })} data-testid="start-menu-docs-musique">
                                    <img src={ICONS.folderClosed} alt="Musique" />
                                    Musique
                                </div>
                                <div className="start-menu__item" onClick={() => handle('explorer', { initialFolder: 'images' })} data-testid="start-menu-docs-images">
                                    <img src={ICONS.folderClosed} alt="Images" />
                                    Images
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Jeux avec sous-menu */}
                    <div
                        className={`start-menu__item${gamesOpen ? ' start-menu__item--sub-open' : ''}`}
                        onMouseEnter={() => setGamesOpen(true)}
                        onMouseLeave={() => setGamesOpen(false)}
                        data-testid="start-menu-games"
                        >
                        <img src={ICONS.games} alt="Jeux" />
                        <span>Jeux</span>
                        <span className="start-menu__item__arrow">▶</span>

                        {gamesOpen && (
                            <div className="start-menu__submenu">
                                <div className="start-menu__item" onClick={() => handle('snake')} data-testid="start-menu-snake">
                                    <img src={ICONS.snake} alt="Snake" />
                                    SNAKE.exe
                                </div>
                                <div className="start-menu__item" onClick={() => handle('jump')} data-testid="start-menu-jump">
                                    <img src={ICONS.jump} alt="Jump" />
                                    JUMP.exe
                                </div>
                                <div className="start-menu__item" onClick={() => handle('virus')} data-testid="start-menu-virus">
                                    <img src={ICONS.virus} alt="VirusSurvivors" />
                                    VIRUS.exe
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="start-menu__separator" />

                    <div className="start-menu__item" onClick={() => handle('computer')} data-testid="start-menu-computer">
                        <img src={ICONS.computer} alt="Poste de travail" />
                        Poste de travail
                    </div>

                    <div className="start-menu__item" onClick={() => handle('cmd')} data-testid="start-menu-cmd">
                        <img src={ICONS.cmd} alt="CMD" />
                        Invite de commandes
                    </div>

                    <div className="start-menu__separator" />

                    <div className="start-menu__item" onClick={() => { Sounds.click(); onLock?.(); onClose(); }} data-testid="start-menu-lock">
                        <img src={ICONS.lock} alt="Verrouiller" />
                        Verrouiller la session
                    </div>

                    <div className="start-menu__item" onClick={() => { Sounds.error(); onShutdown(); onClose(); }} data-testid="start-menu-shutdown">
                        <img src={ICONS.shutdown} alt="Arrêt" />
                        <strong>Arrêter...</strong>
                    </div>

                </div>
            </div>
        </>
    )
}