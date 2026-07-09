// Shared constants

import type { ProviderAdapterInfo } from './types/provider'

export const PROVIDER_ADAPTERS: ProviderAdapterInfo[] = [
  {
    slug: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models via Anthropic API',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', contextWindow: 200000 },
      { name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', contextWindow: 200000 },
      { name: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', contextWindow: 200000 },
      { name: 'claude-opus-4-20250514', displayName: 'Claude Opus 4', contextWindow: 200000 }
    ]
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    description: 'GPT models via OpenAI API',
    defaultBaseUrl: 'https://api.openai.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming', 'json_mode', 'embeddings'],
    defaultModels: [
      { name: 'gpt-4o', displayName: 'GPT-4o', contextWindow: 128000 },
      { name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', contextWindow: 128000 },
      { name: 'o1-mini', displayName: 'o1-mini', contextWindow: 128000 },
      { name: 'o3-mini', displayName: 'o3-mini', contextWindow: 200000 }
    ]
  },
  {
    slug: 'google',
    name: 'Google Gemini',
    description: 'Gemini models via Google AI',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', contextWindow: 1048576 },
      { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', contextWindow: 1048576 }
    ]
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral models via Mistral API',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming', 'json_mode'],
    defaultModels: [
      { name: 'mistral-large-latest', displayName: 'Mistral Large', contextWindow: 128000 },
      { name: 'mistral-small-latest', displayName: 'Mistral Small', contextWindow: 32000 },
      { name: 'codestral-latest', displayName: 'Codestral (Coding)', contextWindow: 32000 }
    ]
  },
  {
    slug: 'groq',
    name: 'Groq',
    description: 'Fast inference via Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B', contextWindow: 131072 },
      { name: 'llama-4-scout-17b-16e-instruct', displayName: 'Llama 4 Scout', contextWindow: 131072 }
    ]
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek models via DeepSeek API',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'deepseek-chat', displayName: 'DeepSeek Chat (V3)', contextWindow: 131072 },
      { name: 'deepseek-coder', displayName: 'DeepSeek Coder', contextWindow: 131072 }
    ]
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    description: 'Multi-provider routing via OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'openrouter/auto', displayName: 'Auto (best model)', contextWindow: 200000 },
      { name: 'deepseek/deepseek-chat', displayName: 'DeepSeek V3', contextWindow: 131072 },
      { name: 'anthropic/claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', contextWindow: 200000 },
      { name: 'openrouter/free', displayName: 'Free (smoke test)', contextWindow: 8000 }
    ]
  },
  {
    slug: 'ollama',
    name: 'Ollama',
    description: 'Local models via Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    authType: 'none',
    capabilities: ['text', 'streaming', 'local'],
    defaultModels: []
  },
  {
    slug: 'lmstudio',
    name: 'LM Studio',
    description: 'Local models via LM Studio',
    defaultBaseUrl: 'http://localhost:1234/v1',
    authType: 'none',
    capabilities: ['text', 'streaming', 'local'],
    defaultModels: []
  },
  {
    slug: 'nvidia',
    name: 'NVIDIA NIM',
    description: 'NVIDIA Inference Microservices — free tier available via build.nvidia.com',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'nvidia/llama-3.1-nemotron-70b-instruct', displayName: 'Llama 3.1 Nemotron 70B', contextWindow: 131072 },
      { name: 'nvidia/nemotron-4-340b-instruct', displayName: 'Nemotron 4 340B', contextWindow: 128000 },
      { name: 'nvidia/llama-3.1-nemotron-51b-instruct', displayName: 'Llama 3.1 Nemotron 51B', contextWindow: 131072 },
    ]
  },
  {
    slug: 'custom',
    name: 'Custom OpenAI-Compatible',
    description: 'Any OpenAI-compatible API endpoint',
    defaultBaseUrl: 'http://localhost:8000/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming', 'json_mode'],
    defaultModels: []
  }
]
