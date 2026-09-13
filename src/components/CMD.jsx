import { useState, useRef, useEffect } from 'react'
import '../styles/CMD.scss'
import content from '../data/cmd.json'

const STORAGE_KEY = 'wellston_clearance'

const fmt = (lines, vars = {}) =>
lines.map(line =>
    line.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`))
)

export default function CMD() {
    const [history, setHistory] = useState(content.boot)
    const [input, setInput] = useState('')
    const [cmdHistory, setCmdHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [isMatrix, setIsMatrix] = useState(false)
    const [isHacking, setIsHacking] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)
    const matrixRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (!isMatrix) return
        const canvas = matrixRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        const cols = Math.floor(canvas.width / 16)
        const drops = Array(cols).fill(1)

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#00ff41'
            ctx.font = '14px monospace'
            drops.forEach((y, i) => {
                const char = content.matrixChars[Math.floor(Math.random() * content.matrixChars.length)]
                ctx.fillText(char, i * 16, y * 16)
                if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i]++
            })
        }

        const interval = setInterval(draw, 50)
        const timeout = setTimeout(() => {
            clearInterval(interval)
            setIsMatrix(false)
            setHistory(prev => [...prev, ...content.matrix.end])
        }, 6000)

        return () => { clearInterval(interval); clearTimeout(timeout) }
    }, [isMatrix])

    const runCommand = (raw) => {
        const cmd = raw.trim().toLowerCase()
        const newHistory = [...history, `${content.bootPrompt}${raw}`]

        if (cmd === 'cls') {
            setHistory([content.prompt])
            return
        }

        if (cmd.startsWith('echo ')) {
            setHistory([...newHistory, raw.slice(5), ''])
            return
        }

        if (cmd.startsWith('ping ')) {
            const host = raw.slice(5).trim()
            setHistory([...newHistory, ...fmt(content.templates.ping, { host })])
            return
        }

        if (cmd === 'matrix') {
            setHistory([...newHistory, ...content.matrix.start])
            setIsMatrix(true)
            return
        }

        if (cmd === 'hack') {
            setIsHacking(true)
            const lines = content.hack.lines
            let i = 0
            const base = [...newHistory]
            const interval = setInterval(() => {
                base.push(lines[i])
                setHistory([...base])
                i++
                if (i >= lines.length) {
                clearInterval(interval)
                setIsHacking(false)
                }
            }, 300)
            return
        }

        if (cmd === 'auth' || cmd.startsWith('auth ')) {
            const parts = raw.trim().split(/\s+/)
            const token = (parts[1] || '').toUpperCase()

            if (!token) {
                setHistory([...newHistory, ...content.auth.usage])
                return
            }
            if (token !== content.auth.token.toUpperCase()) {
                setHistory([...newHistory, ...content.auth.rejected])
                return
            }
            sessionStorage.setItem(STORAGE_KEY, '1')
            setHistory([...newHistory, ...content.auth.success])
            return
        }

        if (cmd === 'status') {
            const v = sessionStorage.getItem(STORAGE_KEY)
            const authed = v != null && v !== '0' && v !== ''
            setHistory([...newHistory, ...fmt(content.templates.status, {
                state: authed ? 'AUTORISÉ' : 'NON AUTORISÉ'
            })])
            return
        }

        if (cmd === 'logout') {
            sessionStorage.removeItem(STORAGE_KEY)
            setHistory([...newHistory, ...content.static.logout])
            return
        }

        if (content.static[cmd]) {
            setHistory([...newHistory, ...content.static[cmd]])
            return
        }

        if (cmd === '') {
            setHistory([...newHistory, content.prompt.trim()])
            return
        }

        setHistory([...newHistory, ...fmt(content.templates.unknownCommand, { cmd })])
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (isHacking) return
            if (isMatrix) { setIsMatrix(false); return }
            runCommand(input)
            setCmdHistory(prev => [input, ...prev])
            setHistoryIndex(-1)
            setInput('')
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const next = Math.min(historyIndex + 1, cmdHistory.length - 1)
            setHistoryIndex(next)
            setInput(cmdHistory[next] || '')
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = Math.max(historyIndex - 1, -1)
            setHistoryIndex(next)
            setInput(next === -1 ? '' : cmdHistory[next])
        }
    }

    return (
        <div className="cmd" onClick={() => inputRef.current?.focus()} data-testid="cmd-window">
            {isMatrix && (
                <canvas
                ref={matrixRef}
                className="cmd__matrix"
                onClick={() => setIsMatrix(false)}
                />
            )}
            <div className="cmd__output">
                {history.map((line, i) => (
                    <div key={i} className="cmd__line">{line}</div>
                ))}
                    <div className="cmd__input-row" ref={bottomRef}>
                        {!isMatrix && !isHacking && (
                        <>
                            <span className="cmd__prompt">{content.prompt}</span>
                            <input
                                ref={inputRef}
                                className="cmd__input"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck={false}
                                autoComplete="off"
                                data-testid="cmd-input"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}