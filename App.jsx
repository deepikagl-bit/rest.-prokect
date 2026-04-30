import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TASK_STATUS = ['todo', 'in_progress', 'done', 'blocked']

function App() {
  const [token, setToken] = useState(localStorage.getItem('ttm_token') || '')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [projectTasks, setProjectTasks] = useState([])
  const [dashboard, setDashboard] = useState({ total_projects: 0, assigned_tasks: 0, overdue_tasks: 0, status_breakdown: {} })
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [newMember, setNewMember] = useState({ email: '', role: 'Member' })
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee_email: '', due_date: '', status: 'todo' })
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [taskUpdate, setTaskUpdate] = useState({ status: '', assignee_email: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      localStorage.setItem('ttm_token', token)
      loadSession()
    } else {
      localStorage.removeItem('ttm_token')
    }
  }, [token])

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectTasks(selectedProjectId)
    }
  }, [selectedProjectId])

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw data || { detail: response.statusText }
    }
    return data
  }

  const loadSession = async () => {
    try {
      const currentUser = await apiFetch('/users/me')
      setUser(currentUser)
      await Promise.all([loadProjects(), loadDashboard()])
      setMessage('')
    } catch (error) {
      setMessage(error.detail || 'Please log in to continue.')
      logout()
    }
  }

  const loadProjects = async () => {
    const projectData = await apiFetch('/projects')
    setProjects(projectData)
    if (!selectedProjectId && projectData.length > 0) {
      setSelectedProjectId(projectData[0].id)
    }
  }

  const loadProjectTasks = async (projectId) => {
    const tasks = await apiFetch(`/projects/${projectId}/tasks`)
    setProjectTasks(tasks)
    if (tasks.length > 0) {
      setSelectedTaskId(tasks[0].id)
      setTaskUpdate({ status: tasks[0].status, assignee_email: tasks[0].assignee || '' })
    }
  }

  const loadDashboard = async () => {
    const stats = await apiFetch('/dashboard')
    setDashboard(stats)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    try {
      if (authMode === 'login') {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: authForm.email, password: authForm.password }),
        })
        setToken(data.access_token)
      } else {
        await apiFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify(authForm),
        })
        setAuthMode('login')
        setMessage('Signup successful. Please log in.')
      }
      setAuthForm({ name: '', email: '', password: '' })
    } catch (error) {
      setMessage(error.detail || 'Authentication failed')
    }
  }

  const createProject = async (event) => {
    event.preventDefault()
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      })
      setNewProject({ name: '', description: '' })
      await loadProjects()
      await loadDashboard()
      setMessage('Project created successfully.')
    } catch (error) {
      setMessage(error.detail || 'Unable to create project.')
    }
  }

  const addMember = async (event) => {
    event.preventDefault()
    try {
      await apiFetch(`/projects/${selectedProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify(newMember),
      })
      setNewMember({ email: '', role: 'Member' })
      await loadProjects()
      setMessage('Member added successfully.')
    } catch (error) {
      setMessage(error.detail || 'Unable to add member.')
    }
  }

  const createTask = async (event) => {
    event.preventDefault()
    try {
      await apiFetch(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(newTask),
      })
      setNewTask({ title: '', description: '', assignee_email: '', due_date: '', status: 'todo' })
      await loadProjectTasks(selectedProjectId)
      await loadDashboard()
      setMessage('Task created successfully.')
    } catch (error) {
      setMessage(error.detail || 'Unable to create task.')
    }
  }

  const updateTask = async (event) => {
    event.preventDefault()
    if (!selectedTaskId) return
    try {
      await apiFetch(`/tasks/${selectedTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify(taskUpdate),
      })
      await loadProjectTasks(selectedProjectId)
      await loadDashboard()
      setMessage('Task updated successfully.')
    } catch (error) {
      setMessage(error.detail || 'Unable to update task.')
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setProjects([])
    setProjectTasks([])
    setSelectedProjectId(null)
    setMessage('Logged out.')
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const selectedTask = projectTasks.find((task) => task.id === selectedTaskId)

  if (!token) {
    return (
      <div className="page center-page">
        <section className="panel auth-panel">
          <h1>Team Task Manager</h1>
          <p>Signup or login to manage projects, tasks, and team members.</p>

          <div className="auth-switch">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
              Login
            </button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
              Signup
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="stack-form">
            {authMode === 'signup' && (
              <label>
                Name
                <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            </label>
            <button type="submit">{authMode === 'login' ? 'Login' : 'Create account'}</button>
          </form>

          {message && <div className="status">{message}</div>}
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="header-bar">
        <div>
          <span className="eyebrow">Team Task Manager</span>
          <h1>Projects, tasks, and role-based team management</h1>
          <p>Build projects, assign tasks, track status, and collaborate with Admin / Member access.</p>
        </div>
        <div className="header-actions">
          <span>{user?.name} ({user?.email})</span>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="overview-grid">
        <article className="metric-card primary">
          <strong>{dashboard.total_projects}</strong>
          <span>Projects</span>
        </article>
        <article className="metric-card">
          <strong>{dashboard.assigned_tasks}</strong>
          <span>Your tasks</span>
        </article>
        <article className="metric-card">
          <strong>{dashboard.overdue_tasks}</strong>
          <span>Overdue</span>
        </article>
        <article className="metric-card">
          <strong>{dashboard.status_breakdown.todo || 0}</strong>
          <span>Todo</span>
        </article>
      </div>

      <main className="main-grid">
        <section className="panel project-panel">
          <div className="panel-header">
            <div>
              <h2>Projects</h2>
              <p className="panel-subtitle">Your team projects and member assignments.</p>
            </div>
            <span className="badge">{projects.length}</span>
          </div>

          <ul className="task-list-items">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  className={project.id === selectedProjectId ? 'active' : ''}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.description || 'No description yet'}</p>
                  </div>
                  <span className="task-chip">{project.members.length} members</span>
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={createProject} className="stack-form small-form">
            <h3>Create project</h3>
            <label>
              Name
              <input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} required />
            </label>
            <label>
              Description
              <input value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
            </label>
            <button type="submit">Create project</button>
          </form>
        </section>

        <section className="panel detail-panel">
          {selectedProject ? (
            <>
              <div className="panel-header space-between">
                <div>
                  <h2>{selectedProject.name}</h2>
                  <p>{selectedProject.description}</p>
                </div>
                <span className="badge secondary">Members {selectedProject.members.length}</span>
              </div>

              <div className="project-members">
                <h3>Team members</h3>
                <ul>
                  {selectedProject.members.map((member) => (
                    <li key={member.id}>{member.name} • {member.email} • {member.role}</li>
                  ))}
                </ul>
              </div>

              <form onSubmit={addMember} className="stack-form small-form">
                <h3>Add member</h3>
                <label>
                  Email
                  <input value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} required />
                </label>
                <label>
                  Role
                  <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}>
                    <option>Member</option>
                    <option>Admin</option>
                  </select>
                </label>
                <button type="submit">Invite</button>
              </form>

              <div className="task-section">
                <h3>Tasks</h3>
                <ul className="history-list">
                  {projectTasks.length === 0 ? (
                    <p>No tasks yet for this project.</p>
                  ) : (
                    projectTasks.map((task) => (
                      <li key={task.id} className={task.status === 'done' ? 'done-task' : ''}>
                        <div className="history-row">
                          <strong>{task.title}</strong>
                          <span>{task.status.replace('_', ' ')}</span>
                        </div>
                        <p>{task.description}</p>
                        <p className="history-meta">Due {task.due_date || 'Unscheduled'} • Assigned to {task.assignee || 'Unassigned'}</p>
                        <button className={selectedTaskId === task.id ? 'active task-action' : 'task-action'} onClick={() => {
                          setSelectedTaskId(task.id)
                          setTaskUpdate({ status: task.status, assignee_email: task.assignee || '' })
                        }}>
                          Edit
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <form onSubmit={createTask} className="stack-form small-form">
                  <h3>Create task</h3>
                  <label>
                    Title
                    <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
                  </label>
                  <label>
                    Description
                    <input value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                  </label>
                  <label>
                    Assignee email
                    <input value={newTask.assignee_email} onChange={(e) => setNewTask({ ...newTask, assignee_email: e.target.value })} />
                  </label>
                  <label>
                    Due date
                    <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                  </label>
                  <label>
                    Status
                    <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
                      {TASK_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <button type="submit">Create task</button>
                </form>

                {selectedTask && (
                  <form onSubmit={updateTask} className="stack-form small-form">
                    <h3>Edit task</h3>
                    <label>
                      Status
                      <select value={taskUpdate.status} onChange={(e) => setTaskUpdate({ ...taskUpdate, status: e.target.value })}>
                        {TASK_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </label>
                    <label>
                      Assignee email
                      <input value={taskUpdate.assignee_email} onChange={(e) => setTaskUpdate({ ...taskUpdate, assignee_email: e.target.value })} />
                    </label>
                    <button type="submit">Save task</button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <p>Select a project to manage tasks and team members.</p>
          )}

          {message && <div className="status">{message}</div>}
        </section>
      </main>
    </div>
  )
}

export default App
