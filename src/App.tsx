import { useState } from 'react'
import {
  Bell, BookOpen, ChevronDown, Clock3, Code2, Copy, Play, RefreshCw,
  Sparkles, Send, Settings, Terminal, ThumbsUp, User, CheckCircle2,
} from 'lucide-react'

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
  const [language, setLanguage] = useState('Python')
  const [code, setCode] = useState(starterCode.Python)
  const [activeTab, setActiveTab] = useState<'testcases' | 'result'>('testcases')
  const [selectedTest, setSelectedTest] = useState(0)
  const [running, setRunning] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiOpen, setAiOpen] = useState(true)

  const changeLanguage = (value: string) => {
    setLanguage(value)
    setCode(starterCode[value])
  }

  const runCode = () => {
    setRunning(true)
    setActiveTab('result')
    window.setTimeout(() => {
      setRunning(false)
      setSubmitted(false)
    }, 900)
  }

  const submitCode = () => {
    setRunning(true)
    setActiveTab('result')
    window.setTimeout(() => {
      setRunning(false)
      setSubmitted(true)
    }, 1100)
  }

  const generateQuestion = () => {
    setGenerating(true)
    window.setTimeout(() => setGenerating(false), 1400)
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

          <div className="problem-scroll">
            <div className="problem-heading">
              <div>
                <div className="title-row">
                  <h1>Find the Smallest Missing Positive</h1>
                  {submitted && <span className="solved-chip"><CheckCircle2 size={14} /> Solved</span>}
                </div>
                <div className="meta-row">
                  <span className="difficulty medium">Medium</span>
                  <span className="meta-item"><Sparkles size={14} /> AI Generated</span>
                  <span className="meta-item"><ThumbsUp size={14} /> 94% match</span>
                </div>
              </div>
            </div>

            <article className="problem-content">
              <p>Given an unsorted integer array <code>nums</code>, return the smallest positive integer that is missing.</p>
              <p>You must write an algorithm that runs in <strong>O(n)</strong> time and uses <strong>O(1)</strong> auxiliary space.</p>

              <h2>Example 1</h2>
              <div className="example-box">
                <div><span>Input:</span> nums = [1, 3, 6, 4, 1, 2]</div>
                <div><span>Output:</span> 5</div>
                <p>Explanation: The smallest missing positive integer is <code>5</code>.</p>
              </div>

              <h2>Example 2</h2>
              <div className="example-box">
                <div><span>Input:</span> nums = [1, 2, 0]</div>
                <div><span>Output:</span> 3</div>
              </div>

              <h2>Constraints</h2>
              <ul>
                <li><code>{'1 <= nums.length <= 10'}<sup>5</sup></code></li>
                <li><code>{'-2'}<sup>31</sup>{' <= nums[i] <= 2'}<sup>31</sup>{' - 1'}</code></li>
              </ul>
            </article>
          </div>
        </section>

        <section className="editor-pane">
          <div className="editor-toolbar">
            <div className="tabs">
              <button className="tab active">Solution</button>
              <button className="tab">Submissions</button>
            </div>
            <div className="editor-actions">
              <button className="language-button">
                {language} <ChevronDown size={14} />
                <select value={language} onChange={(event) => changeLanguage(event.target.value)} aria-label="Select language">
                  <option>Python</option>
                  <option>JavaScript</option>
                  <option>Java</option>
                  <option>C++</option>
                </select>
              </button>
              <button className="icon-button" aria-label="Editor settings"><Settings size={17} /></button>
            </div>
          </div>

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

          <div className="output-panel">
            <div className="output-tabs">
              <button
                className={activeTab === 'testcases' ? 'active' : ''}
                onClick={() => setActiveTab('testcases')}
              >
                Test Cases
              </button>
              <button
                className={activeTab === 'result' ? 'active' : ''}
                onClick={() => setActiveTab('result')}
              >
                Test Result
              </button>
            </div>

            <div className="output-content">
              {activeTab === 'testcases' ? (
                <div className="test-layout">
                  <div className="test-list">
                    {sampleTests.map((test, index) => (
                      <button
                        key={test.name}
                        className={selectedTest === index ? 'selected' : ''}
                        onClick={() => setSelectedTest(index)}
                      >
                        <CheckCircle2 size={14} />
                        {test.name}
                      </button>
                    ))}
                    <button className="add-test"><span>+</span> Add test case</button>
                  </div>
                  <div className="test-details">
                    <label>Input</label>
                    <div className="test-value">
                      <code>nums = {sampleTests[selectedTest].input}</code>
                      <button aria-label="Copy input"><Copy size={14} /></button>
                    </div>
                    <label>Expected output</label>
                    <div className="expected-value">{sampleTests[selectedTest].output}</div>
                  </div>
                </div>
              ) : (
                <div className="result-view">
                  {running ? (
                    <div className="running-state"><RefreshCw size={18} className="spin" /> Running test cases...</div>
                  ) : submitted ? (
                    <>
                      <div className="result-summary success">
                        <CheckCircle2 size={20} />
                        <div><strong>Accepted</strong><span>All 12 test cases passed</span></div>
                      </div>
                      <div className="result-stats">
                        <div><span>Runtime</span><strong>42 ms</strong></div>
                        <div><span>Memory</span><strong>18.4 MB</strong></div>
                        <div><span>Language</span><strong>{language}</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="result-summary success">
                        <CheckCircle2 size={20} />
                        <div><strong>Sample tests passed</strong><span>3 of 3 test cases</span></div>
                      </div>
                      <div className="result-stats">
                        <div><span>Runtime</span><strong>38 ms</strong></div>
                        <div><span>Memory</span><strong>18.1 MB</strong></div>
                        <div><span>Status</span><strong>Ready</strong></div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <footer className="editor-footer">
            <button className="custom-test-button"><Terminal size={16} /> Custom test cases</button>
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
