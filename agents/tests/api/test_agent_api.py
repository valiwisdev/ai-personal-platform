import httpx
from ag_ui.core import RunAgentInput

from tests.helpers.agent_api import (
    assert_agent_reply,
    assert_persisted_conversation,
    assert_persisted_history,
    assert_successful_run,
    stream_agent_events,
)


def test_real_agent_api_streams_a_complete_response(
    agent_api_client: httpx.Client,
    backend_api_client: httpx.Client,
    run_input: RunAgentInput,
) -> None:
    events = stream_agent_events(agent_api_client, run_input)
    assert_successful_run(events, run_input)
    reply = assert_agent_reply(events)
    assert_persisted_history(backend_api_client, run_input)
    assert_persisted_conversation(backend_api_client, run_input)
    print(f"Agent reply: {reply.model_dump_json()}")
