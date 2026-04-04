"""Deep Agents package."""

from agent.core._version import __version__
from agent.core.graph import create_deep_agent
from agent.core.middleware.async_subagents import AsyncSubAgent, AsyncSubAgentMiddleware
from agent.core.middleware.filesystem import FilesystemMiddleware
from agent.core.middleware.memory import MemoryMiddleware
from agent.core.middleware.subagents import CompiledSubAgent, SubAgent, SubAgentMiddleware

__all__ = [
    "AsyncSubAgent",
    "AsyncSubAgentMiddleware",
    "CompiledSubAgent",
    "FilesystemMiddleware",
    "MemoryMiddleware",
    "SubAgent",
    "SubAgentMiddleware",
    "__version__",
    "create_deep_agent",
]
