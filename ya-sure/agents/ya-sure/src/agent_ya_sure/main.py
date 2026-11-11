"""Hello-world Atlas Agent Engine ADK template."""

from __future__ import annotations

import logging

from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from agent_engine_sdk_adk import App

from agent_ya_sure.llm import build_llm
from agent_ya_sure.system_message import SYSTEM_PROMPT
from agent_ya_sure.tools import register

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(message)s")
logger = logging.getLogger(__name__)
load_dotenv()

app = App(app_name="ya sure", app_version="1.0.0")

register(app)


@app.entrypoint
def build_agent() -> LlmAgent:
    """Build the ADK agent."""
    logger.info("Building ya sure agent")
    return LlmAgent(
        name="daily",
        description="Daily inspiration assistant with date lookup and optional memory.",
        instruction=SYSTEM_PROMPT.strip(),
        model=app.llm(build_llm()),
        tools=app.tools(),
    )


def main() -> None:
    """Run the hello-world agent."""
    app.run()


if __name__ == "__main__":
    main()
