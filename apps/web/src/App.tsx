import { useEffect, useRef, useState } from 'react'
import {
  Bell, ChevronDown, ChevronUp, Code2, Copy, Play, RefreshCw,
  Sparkles, Send, Settings, Terminal, CheckCircle2, Sun, Moon, Monitor, RotateCcw, Maximize2,
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { apiClient } from './services'
import type { AttemptDto, ProgrammingLanguage, QuestionDto, SubmissionResultDto } from '../../../packages/shared/src/types'

const starterCode: Record<string, string> = {
  Python: `def smallest_missing_positive(nums):
    # Write your solution here
    pass`,
  JavaScript: `function smallestMissingPositive(nums) {
  // Write your solution here
}`,
  Java: `class Solution {
    public int smallestMissingPositive(int[] nums) {
        // Write your solution here
    }
}`,
  'C++': `class Solution {
public:
    int smallestMissingPositive(vector<int>& nums) {
        // Write your solution here
    }
};`,
}

const sampleTests = [
  { name: 'Test Case 0', input: '[1, 3, 6, 4, 1, 2]', output: '5', status: 'passed' },
  { name: 'Test Case 1', input: '[1, 2, 0]', output: '3', status: 'passed' },
  { name: 'Test Case 2', input: '[7, 8, 9, 11, 12]', output: '1', status: 'passed' },
]

function App() {
  const [language, setLanguage] = useState<ProgrammingLanguage>('Python')
  const [code, setCode] = useState(starterCode.Python)
  const [question, setQuestion] = useState<QuestionDto>({
    id: 'demo-question',
    title: 'Find the Smallest Missing Positive',
    difficulty: 'medium',
    topic: 'arrays',
    statement: 'Given an unsorted integer array nums, return the smallest positive integer that is missing.',
    constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
    examples: [
      { input: '[1, 3, 6, 4, 1, 2]', output: '5' },
      { input: '[1, 2, 0]', output: '3' },
    ],
    starterCode: starterCode as QuestionDto['starterCode'],
    testCases: sampleTests.map((test, index) => ({
      id: String(index),
      name: test.name,
      input: test.input,
      expectedOutput: test.output,
      hidden: false,
    })),
  })
  const [activeTab, setActiveTab] = useState<'testcases' | 'custom' | 'result'>('testcases')
  const [outputCollapsed, setOutputCollapsed] = useState(false)
  const [editorTab, setEditorTab] = useState<'solution' | 'submissions'>('solution')
  const [selectedTest, setSelectedTest] = useState(0)
  const [running, setRunning] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResultDto | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResultDto[]>([])
  const [customInput, setCustomInput] = useState('')
  const [customOutput, setCustomOutput] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [activeAttempt, setActiveAttempt] = useState<AttemptDto | null>(null)
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving'>('saved')
  const [expandedCase, setExpandedCase] = useState<string | null>(null)
  const revisionRef = useRef(1)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [fontSize, setFontSize] = useState(13)
  const [wordWrap, setWordWrap] = useState(false)
  const [problemWidth, setProblemWidth] = useState(() => {
    const saved = Number(localStorage.getItem('testmeman.layout.problemWidth'))
    return saved >= 320 && saved <= 700 ? saved : 560
  })
  const [outputHeight, setOutputHeight] = useState(() => {
    const saved = Number(localStorage.getItem('testmeman.layout.outputHeight'))
    return saved >= 170 && saved <= 500 ? saved : 220
  })
  const visibleTests = question.testCases.filter((test) => !test.hidden)

  useEffect(() => {
    let cancelled = false
    apiClient.getActiveAttempt()
      .then((attempt) => {
        if (cancelled) return
        setActiveAttempt(attempt)
        setQuestion(attempt.question)
        revisionRef.current = attempt.revision + 1

        const cached = localStorage.getItem(`testmeman:draft:${attempt.id}`)
        let restoredCode = attempt.code
        let restoredLanguage = attempt.language
        if (cached) {
          try {
            const draft = JSON.parse(cached) as { code?: string; language?: ProgrammingLanguage; revision?: number }
            if (typeof draft.code === 'string' && (draft.revision ?? 0) >= attempt.revision) {
              restoredCode = draft.code
            }
            if (draft.language) restoredLanguage = draft.language
          } catch {
            // Ignore malformed browser drafts.
          }
        }
        setLanguage(restoredLanguage)
        setCode(restoredCode || attempt.question.starterCode[restoredLanguage])
        setSelectedTest(0)
        apiClient.getSubmissions(attempt.questionId)
          .then((history) => {
            if (!cancelled) setSubmissionHistory(history)
          })
          .catch(() => {
            if (!cancelled) setSubmissionHistory([])
          })
      })
      .catch((error) => {
        if (!cancelled) {
          setGenerationError(error instanceof Error ? error.message : 'Unable to resume the active attempt.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeAttempt) return
    setDraftStatus('saving')
    const timer = window.setTimeout(() => {
      const revision = revisionRef.current++
      localStorage.setItem(`testmeman:draft:${activeAttempt.id}`, JSON.stringify({
        code,
        language,
        revision,
        updatedAt: new Date().toISOString(),
      }))
      apiClient.saveAttemptDraft({
        attemptId: activeAttempt.id,
        language,
        code,
        revision,
      })
        .then(() => setDraftStatus('saved'))
        .catch(() => setDraftStatus('saving'))
    }, 500)
    return () => window.clearTimeout(timer)
  }, [activeAttempt, code, language])

  useEffect(() => {
    const savedTheme = localStorage.getItem('testmeman.theme') as 'light' | 'dark' | 'system' | null
    const savedFontSize = Number(localStorage.getItem('testmeman.fontSize'))
    const savedWrap = localStorage.getItem('testmeman.wordWrap')
    if (savedTheme) setTheme(savedTheme)
    if (savedFontSize >= 11 && savedFontSize <= 18) setFontSize(savedFontSize)
    if (savedWrap) setWordWrap(savedWrap === 'true')
  }, [])

  useEffect(() => {
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    applyTheme()
    localStorage.setItem('testmeman.theme', theme)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('testmeman.fontSize', String(fontSize))
    localStorage.setItem('testmeman.wordWrap', String(wordWrap))
  }, [fontSize, wordWrap])

  useEffect(() => {
    localStorage.setItem('testmeman.layout.problemWidth', String(problemWidth))
  }, [problemWidth])

  useEffect(() => {
    localStorage.setItem('testmeman.layout.outputHeight', String(outputHeight))
  }, [outputHeight])

  const startVerticalResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = problemWidth
    const move = (pointerEvent: PointerEvent) => {
      const maximumWidth = Math.min(700, Math.max(320, window.innerWidth - 520 - 6))
      setProblemWidth(Math.min(maximumWidth, Math.max(320, startWidth + pointerEvent.clientX - startX)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      document.body.classList.remove('resizing', 'resizing-row')
    }
    document.body.classList.add('resizing', 'resizing-row')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  const startHorizontalResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startY = event.clientY
    const startHeight = outputHeight
    const move = (pointerEvent: PointerEvent) => {
      setOutputHeight(Math.min(500, Math.max(170, startHeight + startY - pointerEvent.clientY)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      document.body.classList.remove('resizing')
    }
    document.body.classList.add('resizing')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  const changeLanguage = (value: ProgrammingLanguage) => {
    setLanguage(value)
    setCode(question.starterCode[value] || starterCode[value])
  }

  const runCode = () => {
    setRunning(true)
    setHasSubmitted(true)
    setOutputCollapsed(false)
    setActiveTab('result')
    apiClient.submit({
      questionId: question.id,
      language,
      code,
      submitted: false,
    })
      .then((result) => {
        setSubmitted(false)
        setSubmissionResult(result)
        setActiveTab('result')
      })
      .catch((error) => {
        setSubmissionResult({
          id: `sub-${Date.now().toString(36)}`,
          questionId: question.id,
          language,
          status: 'runtime_error',
          submitted: false,
          totalCases: visibleTests.length,
          visiblePassed: 0,
          visibleTotal: visibleTests.length,
          hiddenPassed: 0,
          hiddenTotal: 0,
          runtimeMs: null,
          memoryMb: null,
          message: error instanceof Error ? error.message : 'Unable to run the solution.',
        })
      })
      .finally(() => {
        setRunning(false)
      })
  }

  const submitCode = () => {
    setRunning(true)
    setOutputCollapsed(false)
    apiClient.submit({
      questionId: question.id,
      language,
      code,
      submitted: true,
    })
      .then((result) => {
        setSubmitted(result.status === 'accepted')
        setSubmissionResult(result)
        setSubmissionHistory((history) => [result, ...history].slice(0, 20))
        setHasSubmitted(true)
        setActiveTab('result')
      })
      .catch(() => {
        setSubmitted(false)
        setSubmissionResult({
          id: `sub-${Date.now().toString(36)}`,
          questionId: question.id,
          language,
          status: 'runtime_error',
          submitted: true,
          totalCases: visibleTests.length,
          visiblePassed: 0,
          visibleTotal: visibleTests.length,
          hiddenPassed: 0,
          hiddenTotal: 0,
          runtimeMs: null,
          memoryMb: null,
          message: 'Unable to submit the solution. Check that the API server is running.',
        })
        setHasSubmitted(true)
        setActiveTab('result')
      })
      .finally(() => setRunning(false))
  }

  const runCustomTest = () => {
    setRunning(true)
    setHasSubmitted(true)
    setOutputCollapsed(false)
    setCustomMode(true)
    setActiveTab('custom')
    setCustomOutput('Running...')
    apiClient.submit({
      questionId: question.id,
      language,
      code,
      submitted: false,
      customInput,
    })
      .then((result) => {
        setSubmitted(false)
        setSubmissionResult(result)
        setCustomOutput(result.caseResults?.[0]?.actualOutput ?? '')
      })
      .catch((error) => {
        const result: SubmissionResultDto = {
          id: `sub-${Date.now().toString(36)}`,
          questionId: question.id,
          language,
          status: 'runtime_error',
          submitted: false,
          totalCases: 1,
          visiblePassed: 0,
          visibleTotal: 1,
          hiddenPassed: 0,
          hiddenTotal: 0,
          runtimeMs: null,
          memoryMb: null,
          message: error instanceof Error ? error.message : 'Unable to run the custom test.',
        }
        setSubmissionResult(result)
        setCustomOutput(result.message)
      })
      .finally(() => setRunning(false))
  }

  const generateQuestion = () => {
    setGenerating(true)
    apiClient.createNewAttempt({ topic: 'arrays', difficulty: 'medium' })
      .then((attempt) => {
        setActiveAttempt(attempt)
        setQuestion(attempt.question)
        setLanguage(attempt.language)
        setCode(attempt.question.starterCode?.[attempt.language] ?? starterCode[attempt.language])
        revisionRef.current = attempt.revision + 1
        setSelectedTest(0)
        setSubmitted(false)
        setSubmissionResult(null)
        setHasSubmitted(false)
        setGenerationError('')
        setActiveTab('testcases')
        setCustomMode(false)
        setCustomInput('')
        setCustomOutput('')
      })
      .catch((error) => {
        setGenerationError(error instanceof Error ? error.message : 'Question generation failed.')
      })
      .finally(() => setGenerating(false))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Code2 size={20} strokeWidth={2.5} /></div>
          <span>TestMeMan</span>
        </div>
        <nav className="main-nav">
          <a href="#">Practice</a>
          <a href="#">Compete</a>
          <a href="#">Leaderboard</a>
          <a href="#">AI Generator</a>
        </nav>
        <div className="top-actions">
          <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
          <button className="avatar-button"><span>PR</span></button>
        </div>
      </header>

      <main className="workspace" style={{ gridTemplateColumns: `${problemWidth}px 6px minmax(520px, 1fr)` }}>
        <section className="problem-pane">
          <div className="problem-toolbar">
            <div className="breadcrumb">
              <span>Practice</span>
              <span>/</span>
              <strong>Arrays</strong>
            </div>
            <button className="generate-button" onClick={generateQuestion}>
              <RefreshCw size={15} className={generating ? 'spin' : ''} />
              {generating ? 'Generating...' : 'Generate New'}
            </button>
          </div>
          {generationError && <div className="generation-error" role="alert">{generationError}</div>}

          <div className="problem-scroll">
            <div className="problem-heading">
              <div>
                <div className="title-row">
                  <h1>{question.title}</h1>
                  {submitted && <span className="solved-chip"><CheckCircle2 size={14} /> Solved</span>}
                </div>
                <div className="meta-row">
                  <span className={`difficulty ${question.difficulty}`}>{question.difficulty}</span>
                  <span className="meta-item"><Sparkles size={14} /> AI Generated</span>
                </div>
              </div>
            </div>

            <article className="problem-content">
              <p>{question.statement}</p>

              {question.examples.map((example, index) => (
                <div key={`${example.input}-${index}`}>
                  <h2>Example {index + 1}</h2>
                  <div className="example-box">
                    <div><span>Input:</span> {example.input}</div>
                    <div><span>Output:</span> {example.output}</div>
                  </div>
                </div>
              ))}

              <h2>Constraints</h2>
              <ul>
                {question.constraints.map((constraint, index) => <li key={`${constraint}-${index}`}><code>{constraint}</code></li>)}
              </ul>
            </article>
          </div>
        </section>

        <div
          className="vertical-resizer"
          role="separator"
          aria-label="Resize problem and editor panels"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={startVerticalResize}
          onDoubleClick={() => setProblemWidth(560)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setProblemWidth((width) => Math.max(320, width - 20))
            if (event.key === 'ArrowRight') setProblemWidth((width) => Math.min(700, width + 20))
          }}
        />
        <section
          className="editor-pane"
          style={{
            gridTemplateRows: outputCollapsed
              ? '50px minmax(260px, 1fr) 0px 42px 54px'
              : `50px minmax(260px, 1fr) 6px ${outputHeight}px 54px`,
          }}
        >
          <div className="editor-toolbar">
            <div className="tabs">
              <button className={`tab ${editorTab === 'solution' ? 'active' : ''}`} onClick={() => setEditorTab('solution')}>Solution</button>
              <button className={`tab ${editorTab === 'submissions' ? 'active' : ''}`} onClick={() => setEditorTab('submissions')}>Submissions</button>
            </div>
            <div className="editor-actions">
              {activeAttempt && <span className={`draft-status ${draftStatus}`}>{draftStatus === 'saved' ? 'Draft saved' : 'Saving draft...'}</span>}
              <button className="language-button">
                {language} <ChevronDown size={14} />
                <select id="programming-language" name="programmingLanguage" value={language} onChange={(event) => changeLanguage(event.target.value as ProgrammingLanguage)} aria-label="Select language">
                  <option>Python</option>
                  <option>JavaScript</option>
                  <option>Java</option>
                  <option>C++</option>
                </select>
              </button>
              <div className="settings-wrap">
                <button
                  className="icon-button"
                  aria-label="Editor settings"
                  aria-expanded={settingsOpen}
                  onClick={() => setSettingsOpen((open) => !open)}
                >
                  <Settings size={17} />
                </button>
                {settingsOpen && (
                  <div className="settings-menu">
                    <div className="settings-heading">Appearance & editor</div>
                    <div className="theme-options" role="radiogroup" aria-label="Theme">
                      {([
                        ['light', 'Light', Sun],
                        ['dark', 'Dark', Moon],
                        ['system', 'System', Monitor],
                      ] as const).map(([value, label, Icon]) => (
                        <button
                          key={value}
                          className={theme === value ? 'active' : ''}
                          role="radio"
                          aria-checked={theme === value}
                          onClick={() => setTheme(value)}
                        >
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>
                    <label className="settings-row">
                      <span>Font size</span>
                      <select id="editor-font-size" name="editorFontSize" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}>
                        {[11, 12, 13, 14, 16, 18].map((size) => <option key={size} value={size}>{size}px</option>)}
                      </select>
                    </label>
                    <label className="settings-row">
                      <span>Word wrap</span>
                      <input id="editor-word-wrap" name="editorWordWrap" type="checkbox" checked={wordWrap} onChange={(event) => setWordWrap(event.target.checked)} />
                    </label>
                    <button
                      className="reset-layout-button"
                      onClick={() => {
                        setProblemWidth(560)
                        setOutputHeight(220)
                        setOutputCollapsed(false)
                      }}
                    >
                      <RotateCcw size={14} /> Reset layout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {editorTab === 'submissions' ? (
            <div className="submission-history">
              <div className="history-heading">
                <span>Status</span><span>Language</span><span>Visible</span><span>Hidden</span><span>Runtime</span>
              </div>
              {submissionHistory.length === 0 ? (
                <div className="history-empty">No submissions yet.</div>
              ) : submissionHistory.map((item) => (
                <button
                  key={item.id}
                  className="history-row"
                  onClick={() => {
                    setSubmissionResult(item)
                    setHasSubmitted(true)
                    setSubmitted(item.status === 'accepted')
                    setActiveTab('result')
                    setEditorTab('solution')
                  }}
                >
                  <span className={`history-status ${item.status}`}>{item.status.replace(/_/g, ' ')}</span>
                  <span>{item.language}</span>
                  <span>{item.visiblePassed}/{item.visibleTotal}</span>
                  <span>{item.hiddenPassed}/{item.hiddenTotal}</span>
                  <span>{item.runtimeMs ? `${item.runtimeMs} ms` : 'N/A'}</span>
                </button>
              ))}
            </div>
          ) : (
          <>
          <div className="code-area">
            <Editor
              height="100%"
              language={{
                Python: 'python',
                JavaScript: 'javascript',
                Java: 'java',
                'C++': 'cpp',
              }[language]}
              value={code}
              onChange={(value) => setCode(value ?? '')}
              theme={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'vs-dark' : 'light'}
              options={{
                fontSize,
                lineNumbers: 'on',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: wordWrap ? 'on' : 'off',
                padding: { top: 14 },
                fontFamily: '"JetBrains Mono", monospace',
                suggestOnTriggerCharacters: true,
                formatOnPaste: true,
                smoothScrolling: true,
              }}
            />
          </div>

          {!outputCollapsed && (
            <div
              className="horizontal-resizer"
              role="separator"
              aria-label="Resize editor and test panels"
              aria-orientation="horizontal"
              tabIndex={0}
              onPointerDown={startHorizontalResize}
              onDoubleClick={() => setOutputHeight(220)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') setOutputHeight((height) => Math.min(500, height + 20))
                if (event.key === 'ArrowDown') setOutputHeight((height) => Math.max(170, height - 20))
              }}
            />
          )}
          <div className={`output-panel ${hasSubmitted ? '' : 'submission-hidden'} ${outputCollapsed ? 'collapsed' : ''}`}>
            {!hasSubmitted ? (
              <div className="submission-placeholder">
                <span>Submit your solution to view test cases and results.</span>
              </div>
            ) : (
              <>
                <div className="output-tabs">
                  <button
                    className={activeTab === 'testcases' ? 'active' : ''}
                    onClick={() => {
                      setCustomMode(false)
                      setActiveTab('testcases')
                    }}
                  >
                    Test Cases
                  </button>
                  <button
                    className={activeTab === 'custom' ? 'active' : ''}
                    onClick={() => {
                      setCustomMode(true)
                      setActiveTab('custom')
                    }}
                  >
                    Custom Test
                  </button>
                  <button
                    className={activeTab === 'result' ? 'active' : ''}
                    onClick={() => setActiveTab('result')}
                  >
                    Test Result
                  </button>
                  <button
                    className="collapse-output-button"
                    aria-label={outputCollapsed ? 'Expand test panel' : 'Collapse test panel'}
                    onClick={() => setOutputCollapsed((collapsed) => !collapsed)}
                  >
                    {outputCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    className="maximize-output-button"
                    aria-label="Maximize test panel"
                    onClick={() => {
                      setOutputCollapsed(false)
                      setOutputHeight((height) => height >= 500 ? 220 : 500)
                    }}
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="output-content">
              {activeTab === 'custom' ? (
                  <div className="custom-layout">
                    <div>
                      <label htmlFor="custom-test-input">Custom input</label>
                      <textarea
                        id="custom-test-input"
                        name="customTestInput"
                        value={customInput}
                        onChange={(event) => setCustomInput(event.target.value)}
                        placeholder="Enter custom test input"
                      />
                      <button className="custom-run-button" onClick={runCustomTest} disabled={running || !customInput.trim()}>
                        <Play size={14} /> Run custom test
                      </button>
                    </div>
                    <div>
                      <label>Output</label>
                      <pre>{running ? 'Running...' : customOutput || 'No output yet'}</pre>
                    </div>
                  </div>
              ) : activeTab === 'testcases' ? (
                <div className="test-layout">
                  <div className="test-list">
                    {visibleTests.map((test, index) => (
                      <button
                        key={test.name}
                        className={selectedTest === index ? 'selected' : ''}
                        onClick={() => setSelectedTest(index)}
                      >
                        <CheckCircle2 size={14} />
                        Test Case {index + 1}
                      </button>
                    ))}
                    <button className="add-test"><span>+</span> Add test case</button>
                  </div>
                  <div className="test-details">
                    <label>Input</label>
                    <div className="test-value">
                      <code>{visibleTests[selectedTest]?.input ?? ''}</code>
                      <button
                        aria-label="Copy input"
                        onClick={() => navigator.clipboard.writeText(visibleTests[selectedTest]?.input ?? '')}
                      ><Copy size={14} /></button>
                    </div>
                    <label>Expected output</label>
                    <div className="expected-value">{visibleTests[selectedTest]?.expectedOutput ?? ''}</div>
                  </div>
                </div>
              ) : (
                <div className="result-view">
                  {running ? (
                    <div className="running-state"><RefreshCw size={18} className="spin" /> Running test cases...</div>
                  ) : (submitted || submissionResult?.status === 'accepted') ? (
                    <>
                      <div className="result-summary success">
                        <CheckCircle2 size={20} />
                        <div><strong>Accepted</strong><span>{submissionResult?.message}</span></div>
                      </div>
                      <div className="result-stats">
                        <div><span>Runtime</span><strong>{submissionResult?.runtimeMs ? `${submissionResult.runtimeMs} ms` : 'N/A'}</strong></div>
                        <div><span>Visible</span><strong>{submissionResult ? `${submissionResult.visiblePassed}/${submissionResult.visibleTotal}` : 'N/A'}</strong></div>
                        <div><span>Hidden</span><strong>{submissionResult ? `${submissionResult.hiddenPassed}/${submissionResult.hiddenTotal}` : 'N/A'}</strong></div>
                        <div><span>Language</span><strong>{language}</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="result-summary error">
                        <Terminal size={20} />
                        <div><strong>{submissionResult?.status === 'time_limit_exceeded' ? 'Time Limit Exceeded' : submissionResult?.status === 'runtime_error' ? 'Runtime Error' : 'Wrong Answer'}</strong><span>{submissionResult?.message ?? 'Submission failed.'}</span></div>
                      </div>
                      <div className="result-stats">
                        <div><span>Visible</span><strong>{submissionResult ? `${submissionResult.visiblePassed}/${submissionResult.visibleTotal}` : 'N/A'}</strong></div>
                        <div><span>Hidden</span><strong>{submissionResult ? `${submissionResult.hiddenPassed}/${submissionResult.hiddenTotal}` : 'N/A'}</strong></div>
                        <div><span>Language</span><strong>{language}</strong></div>
                      </div>
                    </>
                  )}
                      {!running && submissionResult?.caseResults && submissionResult.caseResults.length > 0 && (
                        <div className="case-results">
                          {submissionResult.caseResults.map((test, index) => (
                            <div className="case-result" key={`${test.id}-${index}`}>
                              <button
                                className="case-result-row"
                                onClick={() => setExpandedCase((current) => current === `${test.id}-${index}` ? null : `${test.id}-${index}`)}
                              >
                                <span className={`case-status ${test.status}`}>
                                  {test.status === 'passed' ? <CheckCircle2 size={14} /> : <Terminal size={14} />}
                                  {test.hidden ? `Hidden Test ${index + 1}` : `Test Case ${index + 1}`}
                                </span>
                                <span>{test.status.replace(/_/g, ' ')}</span>
                                <span>{test.runtimeMs} ms</span>
                              </button>
                              {expandedCase === `${test.id}-${index}` && (
                                <div className="case-result-details">
                                  {test.expectedOutput !== undefined && <div><span>Expected</span><code>{test.expectedOutput}</code></div>}
                                  {test.actualOutput !== undefined && <div><span>Actual</span><code>{test.actualOutput || '(empty output)'}</code></div>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                </div>
              )}
                </div>
              </>
            )}
          </div>

          <footer className="editor-footer">
            <button
              className="custom-test-button"
              onClick={() => {
                setCustomMode(true)
                setHasSubmitted(true)
                setOutputCollapsed(false)
                setActiveTab('custom')
              }}
            >
              <Terminal size={16} /> Custom test cases
            </button>
            <div className="submit-actions">
              <button className="run-button" onClick={runCode} disabled={running}>
                <Play size={16} fill="currentColor" /> Run
              </button>
              <button className="submit-button" onClick={submitCode} disabled={running}>
                {running ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                Submit
              </button>
            </div>
          </footer>
          </>
          )}
        </section>

      </main>
    </div>
  )
}

export default App
