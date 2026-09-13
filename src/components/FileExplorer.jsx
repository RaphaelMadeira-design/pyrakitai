import { useState, useMemo } from 'react'
import Sounds from '../components/Sounds'
import fileTreeData from '../data/fileExplorer.json'

const ICONS = {
    folder:       'https://win98icons.alexmeub.com/icons/png/directory_closed-0.png',
    folderClosed: 'https://win98icons.alexmeub.com/icons/png/directory_closed-2.png',
    folderOpen:   'https://win98icons.alexmeub.com/icons/png/directory_open_cool-4.png',
    explorer:     'https://win98icons.alexmeub.com/icons/png/directory_explorer-1.png',
    txt:          'https://win98icons.alexmeub.com/icons/png/notepad_file-0.png',
    folderTxt:    'https://win98icons.alexmeub.com/icons/png/notepad_file-1.png',
    mp3:          'https://win98icons.alexmeub.com/icons/png/wm_file-5.png',
    img:          'https://win98icons.alexmeub.com/icons/png/kodak_imaging_file-0.png',
}

const getFileIcon = (name = '', sidebar = false) => {
    if (name.endsWith('.mp3')) return ICONS.mp3
    if (name.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) return ICONS.img
    if (name.endsWith('.txt')) return sidebar ? ICONS.folderTxt : ICONS.txt
    return ICONS.txt
}

export const FILE_TREE = fileTreeData

function TreeNode({ id, depth, currentFolder, selectedItem, ancestors, onNavigate, onSelectFile }) {
    const node = FILE_TREE[id]
    if (!node) return null

    const isFolder = !node.type
    const isCurrentFolder = currentFolder === id
    const isExpanded = isCurrentFolder || ancestors.has(id)

    const icon = id === 'root'
        ? ICONS.explorer
        : isFolder
            ? (isExpanded ? ICONS.folderOpen : ICONS.folderClosed)
            : getFileIcon(node.name, true)

    return (
        <div>
            <div
                className={`file-explorer__tree-item${isCurrentFolder ? ' file-explorer__tree-item--selected' : ''}`}
                style={{ paddingLeft: `${depth * 14 + 4}px` }}
                onClick={() => isFolder ? onNavigate(id) : onSelectFile(id)}
                onDoubleClick={() => !isFolder && onSelectFile(id)}
                data-testid={`tree-${id}`}
            >
                <img src={icon} alt="" />
                {node.name}
            </div>

            {isFolder && isExpanded && node.children?.map(childId => (
                <TreeNode
                    key={childId}
                    id={childId}
                    depth={depth + 1}
                    currentFolder={currentFolder}
                    selectedItem={selectedItem}
                    ancestors={ancestors}
                    onNavigate={onNavigate}
                    onSelectFile={onSelectFile}
                />
            ))}
        </div>
    )
}

export default function FileExplorer({ onOpenNotepad, onPlayMusic, onOpenImage, initialFolder = 'root' }) {
    const [currentFolder, setCurrentFolder] = useState(initialFolder)
    const [selectedItem, setSelectedItem] = useState(null)
    
    const [path, setPath] = useState(() => {
        const initialPath = []
        let cur = initialFolder
        while (cur) { initialPath.unshift(cur); cur = FILE_TREE[cur]?.parent || null }
        return initialPath
    })

    const getPathTo = (id) => {
        const newPath = []
        let cur = id
        while (cur) {
            newPath.unshift(cur)
            cur = FILE_TREE[cur]?.parent || null
        }
        return newPath
    }

    const ancestors = useMemo(() => new Set(path), [path])

    const navigateFolder = (id) => {
        if (id === currentFolder) return
        Sounds.navigate?.()
        setPath(getPathTo(id))
        setCurrentFolder(id)
        setSelectedItem(null)
    }

    const openFile = (id) => {
        const node = FILE_TREE[id]
        if (!node || node.type !== 'file') return
        setSelectedItem(id)

        if (node.name.endsWith('.txt') && onOpenNotepad) {
            onOpenNotepad({ id, name: node.name, content: node.content })
        }
        if (node.name.endsWith('.mp3') && onPlayMusic) {
            onPlayMusic({ file: node.musicFile, title: node.name.replace('.mp3', '') })
        }
        if (node.name.match(/\.(png|jpg|jpeg|gif|bmp)$/i) && onOpenImage) {
            const parentId = node.parent
            const parent = FILE_TREE[parentId]
            const siblings = (parent?.children || [])
                .map(cid => FILE_TREE[cid])
                .filter(n => n && n.type === 'file' && /\.(png|jpg|jpeg|gif|bmp)$/i.test(n.name) && n.imageFile)
                .map(n => ({ name: n.name, file: n.imageFile }))
            onOpenImage({ file: node.imageFile, name: node.name, siblings })
        }
    }

    const goUp = () => {
        if (path.length <= 1) return
        const newPath = path.slice(0, -1)
        setPath(newPath)
        setCurrentFolder(newPath[newPath.length - 1])
        setSelectedItem(null)
    }

    const current = FILE_TREE[currentFolder]
    const children = current?.children || []
    
    const addressPath = path.map(id => FILE_TREE[id]?.name || id).join('\\')

    return (
        <div className="file-explorer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="win98-window__menubar">
                <span>Fichier</span>
                <span>Édition</span>
                <span>Affichage</span>
                <span>Aide</span>
            </div>

            <div className="win98-window__toolbar">
                <button
                    className={`win98-window__toolbar-btn ${path.length <= 1 ? 'win98-window__toolbar-btn--disabled' : ''}`}
                    onClick={goUp}
                    data-testid="explorer-back"
                    disabled={path.length <= 1}
                    style={{ gap: '4px' }}
                >
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>◄</span>
                    Précédent
                </button>
            </div>

            <div className="win98-window__address-bar">
                <label>Adresse</label>
                <input
                    type="text"
                    value={`C:\\Users\\isen.shura\\${addressPath}`}
                    readOnly
                    data-testid="explorer-address"
                />
            </div>

            <div className="file-explorer__panes" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="file-explorer__tree">
                    <TreeNode
                        id="root"
                        depth={0}
                        currentFolder={currentFolder}
                        selectedItem={selectedItem}
                        ancestors={ancestors}
                        onNavigate={navigateFolder}
                        onSelectFile={openFile}
                    />
                </div>

                <div className="file-explorer__content">
                    <div className="file-explorer__grid">
                        {children.map(id => {
                            const node = FILE_TREE[id]
                            const isFolder = !node.type
                            return (
                                <div
                                    key={id}
                                    className={`file-explorer__file-item ${selectedItem === id ? 'file-explorer__file-item--selected' : ''}`}
                                    onClick={() => setSelectedItem(id)}
                                    onDoubleClick={() => isFolder ? navigateFolder(id) : openFile(id)}
                                    data-testid={`explorer-item-${id}`}
                                >
                                    <img src={isFolder ? ICONS.folder : getFileIcon(node.name)} alt="" />
                                    <span>{node.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="win98-window__statusbar">
                <span>{children.length} objet(s)</span>
                <span>{`C:\\Users\\isen.shura\\${addressPath}`}</span>
            </div>
        </div>
    )
}