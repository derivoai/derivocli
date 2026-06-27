export const mockUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: 'https://i.pravatar.cc/150?u=jane',
  plan: 'Pro Trial',
  trialDaysLeft: 5,
};

export const mockProjects = [
  { id: 'proj_1', name: 'derivo-web', framework: 'Next.js', status: 'synced', env: 'Production', lastSync: '2m ago' },
  { id: 'proj_2', name: 'api-service', framework: 'NestJS', status: 'synced', env: 'Staging', lastSync: '1h ago' },
  { id: 'proj_3', name: 'internal-tool', framework: 'React', status: 'error', env: 'Development', lastSync: '1d ago' },
  { id: 'proj_4', name: 'billing-worker', framework: 'Go', status: 'pending', env: 'Production', lastSync: '-' },
];

export const mockDevices = [
  { id: 'dev_1', name: 'MacBook Pro 16"', type: 'mac', os: 'macOS Sonoma', browser: 'Chrome', cliVersion: 'v1.4.2', lastActive: 'Just now', isTrusted: true, location: 'San Francisco, US' },
  { id: 'dev_2', name: 'Windows Desktop', type: 'windows', os: 'Windows 11', browser: 'Edge', cliVersion: 'v1.4.0', lastActive: '2 days ago', isTrusted: true, location: 'San Francisco, US' },
  { id: 'dev_3', name: 'Ubuntu CI Server', type: 'linux', os: 'Ubuntu 22.04', browser: 'Unknown', cliVersion: 'v1.4.2', lastActive: '5 mins ago', isTrusted: true, location: 'AWS us-east-1' },
];

export const mockApiKeys = [
  { id: 'key_1', name: 'CI/CD Pipeline', preview: 'drv_prod_...8f92', created: 'Oct 12, 2023', lastUsed: '10 mins ago', expires: 'Never' },
  { id: 'key_2', name: 'Local Development', preview: 'drv_dev_...3a1c', created: 'Nov 05, 2023', lastUsed: '2 days ago', expires: 'Dec 05, 2024' },
];

export const mockActivity = [
  { id: 'act_1', event: 'Project Synced', description: 'derivo-web successfully synced configuration.', timestamp: '2 mins ago', icon: 'check', type: 'success' },
  { id: 'act_2', event: 'Device Added', description: 'Ubuntu CI Server authenticated via CLI.', timestamp: '5 mins ago', icon: 'terminal', type: 'info' },
  { id: 'act_3', event: 'API Key Created', description: 'Generated new key "Local Development".', timestamp: '2 days ago', icon: 'key', type: 'info' },
  { id: 'act_4', event: 'Login', description: 'New session started from San Francisco, US.', timestamp: '3 days ago', icon: 'user', type: 'info' },
  { id: 'act_5', event: 'Trial Started', description: 'Pro 7-day trial activated.', timestamp: '3 days ago', icon: 'zap', type: 'success' },
];
