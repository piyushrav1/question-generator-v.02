import { useState } from 'react'
import {
  Bell, ChevronDown, ChevronUp, Code2, Copy, Play, RefreshCw,
  Sparkles, Send, Settings, Terminal, ThumbsUp, CheckCircle2,
} from 'lucide-react'
import { apiClient } from './services'
import type { ProgrammingLanguage, QuestionDto, SubmissionResultDto } from '../../../packages/shared/src/types'

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
  const [aiOpen, setAiOpen] = useState(true)
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResultDto[]>([])
  const [customInput, setCustomInput] = useState('')
  const [customOutput, setCustomOutput] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const visibleTests = question.testCases.filter((test) => !test.hidden)

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
        setSubmissionHistory((history) => [result, ...history].slice(0, 20))
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
    setActiveTab('result')
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
        setSubmissionHistory((history) => [result, ...history].slice(0, 20))
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
        setCustomOutput('')
      })
      .finally(() => setRunning(false))
  }

  const generateQuestion = () => {
    setGenerating(true)
    apiClient.generateQuestion({ topic: 'arrays', difficulty: 'medium' })
      .then((question) => {
        setQuestion(question)
        setCode(question.starterCode?.[language] ?? starterCode[language])
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

      <main className="workspace">
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

        <section className={`editor-pane ${outputCollapsed ? 'output-collapsed' : ''}`}>
          <div className="editor-toolbar">
            <div className="tabs">
              <button className={`tab ${editorTab === 'solution' ? 'active' : ''}`} onClick={() => setEditorTab('solution')}>Solution</button>
              <button className={`tab ${editorTab === 'submissions' ? 'active' : ''}`} onClick={() => setEditorTab('submissions')}>Submissions</button>
            </div>
            <div className="editor-actions">
              <button className="language-button">
                {language} <ChevronDown size={14} />
                <select value={language} onChange={(event) => changeLanguage(event.target.value as ProgrammingLanguage)} aria-label="Select language">
                  <option>Python</option>
                  <option>JavaScript</option>
                  <option>Java</option>
                  <option>C++</option>
                </select>
              </button>
              <button className="icon-button" aria-label="Editor settings"><Settings size={17} /></button>
            </div>
          </div>

          {editorTab === 'submissions' ? (
            <div className="submission-history">
              <div className="history-heading">
                <span>Status</span><span>Language</span><span>Cases</span><span>Runtime</span>
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
                  <span>{item.runtimeMs ? `${item.runtimeMs} ms` : 'N/A'}</span>
                </button>
              ))}
            </div>
          ) : (
          <>
          <div className="code-area">
            <div className="line-numbers" aria-hidden="true">
              {code.split('\n').map((_, index) => <div key={index}>{index + 1}</div>)}
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              aria-label="Code editor"
            />
          </div>

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
                </div>
                <div className="output-content">
              {activeTab === 'testcases' ? (
                customMode ? (
                  <div className="custom-layout">
                    <div>
                      <label>Custom input</label>
                      <textarea
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
                ) : (
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
                      <button aria-label="Copy input"><Copy size={14} /></button>
                    </div>
                    <label>Expected output</label>
                    <div className="expected-value">{visibleTests[selectedTest]?.expectedOutput ?? ''}</div>
                  </div>
                </div>
                )
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
                            <div className="case-result-row" key={`${test.id}-${index}`}>
                              <span className={`case-status ${test.status}`}>
                                {test.status === 'passed' ? <CheckCircle2 size={14} /> : <Terminal size={14} />}
                                {test.name}
                              </span>
                              {test.actualOutput !== undefined && <code>{test.actualOutput || '(empty output)'}</code>}
                              <span>{test.runtimeMs} ms</span>
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

        {aiOpen && (
          <aside className="ai-panel">
            <div className="ai-heading">
              <div><Sparkles size={17} /><strong>AI Tutor</strong></div>
              <button onClick={() => setAiOpen(false)} aria-label="Close AI tutor">×</button>
            </div>
            <div className="ai-message">
              <p>I generated this problem for your <strong>arrays</strong> practice session.</p>
              <p>Would you like a hint, or should I review your approach once you have tried it?</p>
            </div>
            <div className="ai-actions">
              <button>Give me a hint</button>
              <button>Explain concepts</button>
            </div>
            <div className="ai-input">
              <input placeholder="Ask about this problem..." />
              <button aria-label="Send message"><Send size={15} /></button>
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
