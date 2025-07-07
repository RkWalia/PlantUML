import { useState, useEffect } from 'react'
import { Copy, Download, FileText, Zap, Eye, Code, Sparkles } from 'lucide-react'
import PlantUMLRenderer from './utils/PlantUMLRenderer'
import ExampleTemplates from './components/ExampleTemplates'
import './App.css'

const DEFAULT_PLANTUML = `@startuml
Alice -> Bob: Hello Bob, how are you?
Bob -> Alice: I'm fine, thanks!
@enduml`

function App() {
  const [code, setCode] = useState(DEFAULT_PLANTUML)
  const [diagramSvg, setDiagramSvg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExamples, setShowExamples] = useState(false)

  const generateDiagram = async () => {
    if (!code.trim()) {
      setError('Please enter some PlantUML code')
      setDiagramSvg('')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const svg = await PlantUMLRenderer.render(code)
      setDiagramSvg(svg)
      setIsLoading(false)
    } catch (err) {
      setError('Error generating diagram: ' + err.message)
      setDiagramSvg('')
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
  }

  const downloadDiagram = () => {
    if (diagramSvg) {
      const blob = new Blob([diagramSvg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plantuml-diagram.svg'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const loadTemplate = (template) => {
    setCode(template)
    setShowExamples(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      generateDiagram()
    }, 1000)

    return () => clearTimeout(timer)
  }, [code])

  useEffect(() => {
    generateDiagram()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <h1>PlantUML Studio</h1>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowExamples(!showExamples)}
            >
              <FileText size={16} />
              Examples
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {showExamples && (
          <ExampleTemplates 
            onSelectTemplate={loadTemplate}
            onClose={() => setShowExamples(false)}
          />
        )}
        
        <div className="editor-container">
          <div className="editor-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Code size={16} />
                PlantUML Code
              </div>
              <button 
                className="btn btn-small"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="editor-content">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="code-editor"
                placeholder="Enter your PlantUML code here..."
                spellCheck="false"
              />
            </div>
          </div>

          <div className="preview-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Eye size={16} />
                Preview
              </div>
              <div className="preview-actions">
                <button 
                  className="btn btn-small"
                  onClick={generateDiagram}
                  disabled={isLoading}
                >
                  <Zap size={14} />
                  {isLoading ? 'Generating...' : 'Generate'}
                </button>
                {diagramSvg && (
                  <button 
                    className="btn btn-small"
                    onClick={downloadDiagram}
                    title="Download diagram"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="preview-content">
              {isLoading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Generating diagram...</p>
                </div>
              )}
              {error && (
                <div className="error">
                  <p>{error}</p>
                  <button 
                    className="btn btn-small" 
                    onClick={generateDiagram}
                    style={{ marginTop: '1rem' }}
                  >
                    Try Again
                  </button>
                </div>
              )}
              {diagramSvg && !isLoading && (
                <div className="diagram-container">
                  <div 
                    className="diagram"
                    dangerouslySetInnerHTML={{ __html: diagramSvg }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App