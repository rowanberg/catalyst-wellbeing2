import { useState, createContext, useContext, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import {
  MessageCircle, BookOpen, Brain, Target, FileQuestion,
  Home, Menu, X, LogOut, User, Sparkles
} from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useDailyTopics } from './hooks/useDailyTopics'
import './index.css'

// Auth Context
const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null)

function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext must be used within AuthProvider')
  return context
}

// Login Page
function LoginPage() {
  const { signIn, isLoading, error } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Please enter email and password')
      return
    }

    const result = await signIn(email, password)
    if (!result.success) {
      setLocalError(result.error || 'Login failed')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🎓</div>
          <h1 className="login-title">AstraTutor</h1>
          <p className="login-subtitle">Your AI Learning Companion</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="your.email@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {(localError || error) && (
            <p className="form-error">{localError || error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Use your Catalyst Wells student account
        </p>
      </div>
    </div>
  )
}

// Layout Component
function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuthContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/chat', icon: MessageCircle, label: 'AI Tutor' },
    { path: '/flashcards', icon: Brain, label: 'Flashcards' },
    { path: '/quiz', icon: Target, label: 'Quiz' },
    { path: '/homework', icon: FileQuestion, label: 'Homework Help' },
  ]

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <div>
            <div className="sidebar-title">AstraTutor</div>
            <div className="sidebar-subtitle">AI Learning Companion</div>
          </div>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto', display: sidebarOpen ? 'flex' : 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Learn</div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="nav-icon" size={20} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Account</div>
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              <User className="nav-icon" size={20} />
              Profile
            </Link>
            <button className="nav-item" onClick={signOut}>
              <LogOut className="nav-icon" size={20} />
              Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="menu-button" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="page-title">
              {navItems.find(item => item.path === location.pathname)?.label || 'AstraTutor'}
            </h1>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </div>
              <div className="user-info">
                <div className="user-name">{profile?.first_name} {profile?.last_name}</div>
                <div className="user-class">{profile?.class_name || profile?.grade_level || 'Student'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  )
}

// Dashboard Page
function DashboardPage() {
  const { profile } = useAuthContext()
  const { topics, isLoading } = useDailyTopics(profile?.class_id)

  return (
    <div>
      <div className="welcome-section">
        <div className="welcome-icon">
          <Sparkles size={40} />
        </div>
        <h2 className="welcome-title">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {profile?.first_name}! 👋
        </h2>
        <p className="welcome-subtitle">
          Ready to learn? I'm here to help you understand today's topics, practice with flashcards, and ace your quizzes!
        </p>

        <div className="quick-actions">
          <Link to="/chat" className="quick-action">
            <div className="quick-action-icon purple">
              <MessageCircle size={20} />
            </div>
            <span className="quick-action-text">Ask AI Tutor</span>
          </Link>
          <Link to="/flashcards" className="quick-action">
            <div className="quick-action-icon blue">
              <Brain size={20} />
            </div>
            <span className="quick-action-text">Study Flashcards</span>
          </Link>
          <Link to="/quiz" className="quick-action">
            <div className="quick-action-icon green">
              <Target size={20} />
            </div>
            <span className="quick-action-text">Take a Quiz</span>
          </Link>
          <Link to="/homework" className="quick-action">
            <div className="quick-action-icon pink">
              <FileQuestion size={20} />
            </div>
            <span className="quick-action-text">Homework Help</span>
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          📚 Today's Topics
        </h3>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="loading-spinner" />
          </div>
        ) : topics.length > 0 ? (
          <div className="topics-grid">
            {topics.map((topic) => (
              <div key={topic.id} className="topic-card">
                <div className="topic-subject">{topic.subject || 'General'}</div>
                <h4 className="topic-title">{topic.topic}</h4>
                <div className="topic-meta">
                  <User size={14} />
                  <span>{topic.teacher_name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="card-content" style={{ textAlign: 'center', padding: '2rem' }}>
              <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>
                No topics assigned for today yet. Check back later or explore previous topics!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Chat Page (Placeholder)
function ChatPage() {
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', content: string }>>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { type: 'user', content: userMessage }])
    setIsTyping(true)

    // Simulate AI response (in production, this would call Gemini API)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `I understand you're asking about "${userMessage}". This is a demo response. In the full version, I'll connect to the Gemini API to provide intelligent tutoring assistance based on your curriculum and today's topics. 📚\n\nWould you like me to:\n• Explain this concept step by step?\n• Create flashcards for revision?\n• Give you a practice quiz?`
      }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-section" style={{ padding: '1rem' }}>
            <div className="welcome-icon" style={{ width: '60px', height: '60px' }}>
              <MessageCircle size={28} />
            </div>
            <h3 className="welcome-title" style={{ fontSize: '1.25rem' }}>
              Hi! I'm AstraTutor 🌟
            </h3>
            <p className="welcome-subtitle" style={{ fontSize: '0.9rem' }}>
              Ask me anything about your subjects. I'll explain concepts clearly and help you practice!
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.type}`}>
            {msg.content.split('\n').map((line, i) => (
              <p key={i} style={{ margin: i > 0 ? '0.5rem 0 0' : 0 }}>{line}</p>
            ))}
          </div>
        ))}

        {isTyping && (
          <div className="message message-ai">
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Ask me anything about your subjects..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={1}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Placeholder pages
function FlashcardsPage() {
  return (
    <div className="welcome-section">
      <div className="welcome-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
        <Brain size={40} />
      </div>
      <h2 className="welcome-title">Flashcards</h2>
      <p className="welcome-subtitle">
        Generate AI-powered flashcards from today's topics for active recall practice.
      </p>
      <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        Generate Flashcards
      </button>
    </div>
  )
}

function QuizPage() {
  return (
    <div className="welcome-section">
      <div className="welcome-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)' }}>
        <Target size={40} />
      </div>
      <h2 className="welcome-title">Quiz Practice</h2>
      <p className="welcome-subtitle">
        Test your knowledge with adaptive quizzes that match your learning level.
      </p>
      <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        Start Quiz
      </button>
    </div>
  )
}

function HomeworkPage() {
  return (
    <div className="welcome-section">
      <div className="welcome-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
        <FileQuestion size={40} />
      </div>
      <h2 className="welcome-title">Homework Help</h2>
      <p className="welcome-subtitle">
        Get guided assistance with your homework. I'll help you understand without giving away the answers!
      </p>
      <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        Get Help
      </button>
    </div>
  )
}

function ProfilePage() {
  const { profile } = useAuthContext()

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="card-header">
        <h3 className="card-title">My Profile</h3>
      </div>
      <div className="card-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--gradient-primary)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              {profile?.first_name} {profile?.last_name}
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>Student</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Class</div>
            <div style={{ fontWeight: 500 }}>{profile?.class_name || 'Not assigned'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Grade Level</div>
            <div style={{ fontWeight: 500 }}>{profile?.grade_level || 'Not specified'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>XP Points</div>
            <div style={{ fontWeight: 500 }}>{profile?.xp || 0} XP</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Level</div>
            <div style={{ fontWeight: 500 }}>Level {profile?.level || 1}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Protected Route
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

// Main App
function App() {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            auth.isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/homework" element={<ProtectedRoute><HomeworkPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
