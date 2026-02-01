"use client";
import { useRef, useState, useEffect, RefObject, ChangeEvent, KeyboardEvent, DragEvent } from "react";
import Editor from "@monaco-editor/react";
import { Upload, Play, Square, Download, Settings, Code2, Terminal as TerminalIcon, FileCode, Trash2, Moon, Sun } from "lucide-react";

type Language = "python" | "javascript";
type Theme = "dark" | "light";

interface LanguageConfig {
  name: string;
  icon: string;
  color: string;
  editorLang: string;
}

interface LanguageConfigMap {
  python: LanguageConfig;
  javascript: LanguageConfig;
}

export default function CodeEditor() {
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  
  // Language selection
  const [language, setLanguage] = useState<Language>("python");
  
  // Code states for different languages
  const [pythonCode, setPythonCode] = useState<string>(
`# Python Interactive Console
name = input("Enter your name: ")
age = input("Enter your age: ")
print(f"Hello {name}, you are {age} years old!")

# Calculate something
num = int(input("Enter a number: "))
print(f"Square of {num} is {num * num}")`
  );
  
  const [javascriptCode, setJavascriptCode] = useState<string>(
`// JavaScript Interactive Console
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your name: ', (name) => {
  rl.question('Enter your age: ', (age) => {
    console.log(\`Hello \${name}, you are \${age} years old!\`);
    rl.close();
  });
});`
  );
  
  const getCode = (): string => language === "python" ? pythonCode : javascriptCode;
  const setCode = (code: string): void => {
    language === "python" ? setPythonCode(code) : setJavascriptCode(code);
  };
  
  // Terminal state
  const [terminal, setTerminal] = useState<string>("");
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // UI state
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editorHeight, setEditorHeight] = useState<number>(400);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setEditorHeight(window.innerWidth <= 768 ? 300 : 400);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminal]);
  
  const appendOutput = (text: string): void => {
    setTerminal(prev => prev + text);
  };
  
  const execute = (): void => {
    setTerminal("");
    setTerminalInput("");
    setRunning(true);

      // const [url, setUrl] = useState<string | null>(null);

    
    const wsUrl = location.protocol === "http:" ? 
     `ws://127.0.0.1:4000/ws/${language}`
    : `wss://api.compiler.studic.in/ws/${language}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      appendOutput(`▶ Running ${language.toUpperCase()}...\n`);
      ws.send(getCode());
    };
    
    ws.onmessage = (e: MessageEvent<string>) => {
      appendOutput(e.data);
    };
    
    ws.onclose = () => {
      appendOutput("\n✓ Program finished\n");
      setRunning(false);
      wsRef.current = null;
    };
    
    ws.onerror = () => {
      appendOutput("\n✗ WebSocket error\n");
      setRunning(false);
      wsRef.current = null;
    };
    
    wsRef.current = ws;
  };
  
  const stopExecution = (): void => {
    if (wsRef.current) {
      wsRef.current.close();
      appendOutput("\n⚠ Execution stopped by user\n");
      setRunning(false);
      wsRef.current = null;
    }
  };
  
  const handleTerminalInput = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && wsRef.current && running) {
      // Display what user typed
      setTerminal(prev => prev + terminalInput + "\n");
      
      // Send to backend
      if (wsRef.current) {
        wsRef.current.send(terminalInput);
      }
      
      // Clear input
      setTerminalInput("");
    }
  };
  
  // File handling
  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      loadFile(files[0]);
    }
  };
  
  const loadFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>): void => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCode(result);
        
        // Auto-detect language from extension
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'py') setLanguage('python');
        else if (ext === 'js') setLanguage('javascript');
      }
    };
    reader.readAsText(file);
  };
  
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadFile(files[0]);
    }
  };
  
  const downloadCode = (): void => {
    const ext = language === 'python' ? 'py' : 'js';
    const blob = new Blob([getCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const clearTerminal = (): void => {
    setTerminal("");
  };
  
  const toggleTheme = (): void => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };
  
  const languageConfig: LanguageConfigMap = {
    python: {
      name: "Python",
      icon: "🐍",
      color: "#3776ab",
      editorLang: "python"
    },
    javascript: {
      name: "JavaScript",
      icon: "⚡",
      color: "#f7df1e",
      editorLang: "javascript"
    }
  };
  
  const isDark = theme === "dark";
  
  return (
    <div 
      className="container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;600;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Manrope', -apple-system, sans-serif;
          background: ${isDark ? '#0a0a0f' : '#f8f9fa'};
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
          overflow-x: hidden;
        }
        
        .container {
          min-height: 100vh;
          background: ${isDark 
            ? 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)' 
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)'};
          position: relative;
        }
        
        .container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, ${isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'} 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'} 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        
        .wrapper {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
          padding: ${isMobile ? '16px' : '24px'};
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isMobile ? '20px' : '32px'};
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: ${isMobile ? '24px' : '32px'};
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .logo-icon {
          width: ${isMobile ? '36px' : '48px'};
          height: ${isMobile ? '36px' : '48px'};
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${isMobile ? '20px' : '24px'};
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }
        
        .icon-btn:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          transform: translateY(-2px);
        }
        
        .icon-btn:active {
          transform: translateY(0);
        }
        
        .language-selector {
          display: flex;
          gap: 8px;
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          padding: 6px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        
        .lang-btn {
          padding: ${isMobile ? '8px 16px' : '10px 20px'};
          border: none;
          border-radius: 8px;
          background: transparent;
          color: ${isDark ? '#a0a0a0' : '#666'};
          cursor: pointer;
          font-weight: 600;
          font-size: ${isMobile ? '13px' : '14px'};
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Manrope', sans-serif;
        }
        
        .lang-btn.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        
        .main-grid {
          display: grid;
          grid-template-columns: ${isMobile ? '1fr' : '1fr 1fr'};
          gap: ${isMobile ? '16px' : '24px'};
          margin-bottom: 24px;
        }
        
        .panel {
          background: ${isDark ? 'rgba(26, 26, 46, 0.6)' : 'rgba(255, 255, 255, 0.8)'};
          border-radius: 16px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
        }
        
        .panel-header {
          padding: ${isMobile ? '14px 16px' : '16px 20px'};
          background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'};
          border-bottom: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .panel-title {
          font-weight: 700;
          font-size: ${isMobile ? '15px' : '16px'};
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${isDark ? '#fff' : '#1a1a1a'};
        }
        
        .panel-actions {
          display: flex;
          gap: 6px;
        }
        
        .editor-wrapper {
          position: relative;
          height: ${editorHeight}px;
        }
        
        .drag-overlay {
          position: absolute;
          inset: 0;
          background: ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'};
          border: 3px dashed #6366f1;
          border-radius: 16px;
          display: ${isDragging ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(8px);
        }
        
        .drag-text {
          font-size: ${isMobile ? '18px' : '24px'};
          font-weight: 700;
          color: #6366f1;
          text-align: center;
        }
        
        .control-panel {
          padding: ${isMobile ? '14px 16px' : '16px 20px'};
          background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'};
          border-top: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: ${isMobile ? '10px 18px' : '12px 24px'};
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: ${isMobile ? '13px' : '14px'};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          font-family: 'Manrope', sans-serif;
          flex: ${isMobile ? '1' : '0'};
          min-width: ${isMobile ? '0' : 'auto'};
          justify-content: center;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          transform: translateY(-2px);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .btn-danger:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
          transform: translateY(-2px);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .terminal {
          height: ${isMobile ? '250px' : '300px'};
          overflow-y: auto;
          padding: ${isMobile ? '14px' : '20px'};
          font-family: 'JetBrains Mono', monospace;
          font-size: ${isMobile ? '12px' : '13px'};
          line-height: 1.6;
          background: ${isDark ? '#0d0d12' : '#1e1e1e'};
          color: #0f0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .terminal::-webkit-scrollbar {
          width: 8px;
        }
        
        .terminal::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'};
        }
        
        .terminal::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
          border-radius: 4px;
        }
        
        .terminal-input {
          background: transparent;
          border: none;
          outline: none;
          color: #0f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: ${isMobile ? '12px' : '13px'};
          width: auto;
          min-width: 200px;
          caret-color: #0f0;
          display: inline;
        }
        
        .input-wrapper {
          display: inline;
        }
        
        .settings-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: ${showSettings ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }
        
        .settings-content {
          background: ${isDark ? '#1a1a2e' : '#fff'};
          border-radius: 16px;
          padding: ${isMobile ? '24px' : '32px'};
          max-width: 500px;
          width: 100%;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        }
        
        .settings-header {
          font-size: ${isMobile ? '20px' : '24px'};
          font-weight: 700;
          margin-bottom: 24px;
          color: ${isDark ? '#fff' : '#1a1a1a'};
        }
        
        .setting-item {
          margin-bottom: 20px;
        }
        
        .setting-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 14px;
          color: ${isDark ? '#e0e0e0' : '#333'};
        }
        
        .setting-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          color: ${isDark ? '#e0e0e0' : '#1a1a1a'};
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
        }
        
        .hidden {
          display: none;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .running-indicator {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          
          .logo {
            font-size: 20px;
          }
          
          .lang-btn span {
            display: none;
          }
        }
      `}</style>
      
      <div className="wrapper">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <div className="logo-icon">
              <Code2 size={isMobile ? 20 : 24} />
            </div>
            CodeRunner
          </div>
          
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="language-selector" style={{ marginBottom: isMobile ? '16px' : '24px' }}>
          <button
            className={`lang-btn ${language === 'python' ? 'active' : ''}`}
            onClick={() => setLanguage('python')}
          >
            <span>{languageConfig.python.icon}</span>
            <span>Python</span>
          </button>
          <button
            className={`lang-btn ${language === 'javascript' ? 'active' : ''}`}
            onClick={() => setLanguage('javascript')}
          >
            <span>{languageConfig.javascript.icon}</span>
            <span>JavaScript</span>
          </button>
        </div>
        
        {/* Main Grid */}
        <div className="main-grid">
          {/* Code Editor Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <FileCode size={18} />
                Code Editor
              </div>
              <div className="panel-actions">
                <button 
                  className="icon-btn" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload file"
                >
                  <Upload size={16} />
                </button>
                <button 
                  className="icon-btn" 
                  onClick={downloadCode}
                  title="Download code"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <div className="editor-wrapper">
              <div className="drag-overlay">
                <div className="drag-text">
                  📁 Drop your code file here
                </div>
              </div>
              
              <Editor
                height={`${editorHeight}px`}
                language={languageConfig[language].editorLang}
                theme={isDark ? "vs-dark" : "light"}
                value={getCode()}
                onChange={(v) => setCode(v || "")}
                options={{
                  fontSize: fontSize,
                  minimap: { enabled: !isMobile },
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: isMobile ? 'on' : 'off',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontLigatures: true,
                }}
              />
            </div>
            
            <div className="control-panel">
              {!running ? (
                <button className="btn btn-primary" onClick={execute}>
                  <Play size={18} />
                  Run Code
                </button>
              ) : (
                <button className="btn btn-danger running-indicator" onClick={stopExecution}>
                  <Square size={18} />
                  Stop
                </button>
              )}
              
              <button className="btn btn-secondary" onClick={downloadCode}>
                <Download size={18} />
                {!isMobile && 'Download'}
              </button>
            </div>
          </div>
          
          {/* Terminal Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">
                <TerminalIcon size={18} />
                Output Console
              </div>
              <div className="panel-actions">
                <button 
                  className="icon-btn" 
                  onClick={clearTerminal}
                  title="Clear terminal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="terminal">
              <span>{terminal}</span>
              {running && wsRef.current && (
                <span className="input-wrapper">
                  <input
                    className="terminal-input"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalInput}
                    autoFocus
                    placeholder=""
                  />
                </span>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".py,.js,.txt"
          onChange={handleFileSelect}
        />
        
        {/* Settings Modal */}
        <div className="settings-modal" onClick={() => setShowSettings(false)}>
          <div className="settings-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">⚙️ Settings</div>
            
            <div className="setting-item">
              <label className="setting-label">Font Size</label>
              <input
                type="range"
                className="setting-input"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
                {fontSize}px
              </div>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Editor Height</label>
              <input
                type="range"
                className="setting-input"
                min="200"
                max="600"
                step="50"
                value={editorHeight}
                onChange={(e) => setEditorHeight(Number(e.target.value))}
              />
              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
                {editorHeight}px
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}