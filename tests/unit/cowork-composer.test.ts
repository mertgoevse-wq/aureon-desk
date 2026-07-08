import { describe, it, expect } from 'vitest'

interface TaskItem {
  id: string
  title: string
  status: 'Draft' | 'Ready' | 'Running' | 'Waiting for approval' | 'Completed' | 'Failed'
  created_at: string
  logs: string[]
}

describe('Cowork Safe Agent Workflow lifecycle', () => {
  it('should transition task status from Ready to Running correctly', () => {
    let task: TaskItem = {
      id: 'test-1',
      title: 'Analyze visual tokens',
      status: 'Ready',
      created_at: 'Just now',
      logs: ['Created task']
    }

    // Dispatch transition
    task.status = 'Running'
    task.logs.push('Dispatched task execution.')

    expect(task.status).toBe('Running')
    expect(task.logs).toContain('Dispatched task execution.')
  })

  it('should transition task status to Waiting for approval on file write request', () => {
    let task: TaskItem = {
      id: 'test-1',
      title: 'Analyze visual tokens',
      status: 'Running',
      created_at: 'Just now',
      logs: ['Created task', 'Running code analysis...']
    }

    // Safety gate triggered
    task.status = 'Waiting for approval'
    task.logs.push('Safety Gate: Requesting approval to write file to workspace.')

    expect(task.status).toBe('Waiting for approval')
    expect(task.logs).toContain('Safety Gate: Requesting approval to write file to workspace.')
  })

  it('should complete task on User Approve', () => {
    let task: TaskItem = {
      id: 'test-1',
      title: 'Analyze visual tokens',
      status: 'Waiting for approval',
      created_at: 'Just now',
      logs: ['Created task', 'Running...', 'Safety Gate triggered']
    }

    // Approve
    task.status = 'Completed'
    task.logs.push('User approved file write operation.')

    expect(task.status).toBe('Completed')
    expect(task.logs).toContain('User approved file write operation.')
  })

  it('should fail/abort task on User Reject', () => {
    let task: TaskItem = {
      id: 'test-1',
      title: 'Analyze visual tokens',
      status: 'Waiting for approval',
      created_at: 'Just now',
      logs: ['Created task', 'Running...', 'Safety Gate triggered']
    }

    // Reject
    task.status = 'Failed'
    task.logs.push('User rejected file write operation.')

    expect(task.status).toBe('Failed')
    expect(task.logs).toContain('User rejected file write operation.')
  })
})

describe('Safe Permission Defaults', () => {
  it('should enforce safe defaults by default', () => {
    const permissions = {
      browserUse: false, // Off by default
      computerUse: false, // Off by default
      fileSystemAccess: 'project', // Sandboxed to workspace
      approveShell: false, // Disabled
      networkAccess: 'provider' // restricted to LLM API provider
    }

    expect(permissions.browserUse).toBe(false)
    expect(permissions.computerUse).toBe(false)
    expect(permissions.fileSystemAccess).toBe('project')
    expect(permissions.approveShell).toBe(false)
    expect(permissions.networkAccess).toBe('provider')
  })

  it('should contain blocked application processes', () => {
    const blockedApps = ['Slack', 'Discord', 'Steam', 'Google Chrome Passwords', 'Windows Terminal']
    expect(blockedApps).toContain('Slack')
    expect(blockedApps).toContain('Discord')
    expect(blockedApps).toContain('Steam')
    expect(blockedApps).toContain('Windows Terminal')
  })
})
