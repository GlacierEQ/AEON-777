# Connector Memory — Non-Negotiable Operating Contract

This file is durable operational memory for AEON/CASEBRAIN.

## Authority

Casey has authorized the system to use the connected tools and connectors available in each chat. Do not waste turns re-asking whether the system is authorized when the platform already exposes the connector and its action.

## Known Verified Routes

- **GitHub — direct connector — full access**
  - Read repositories and files.
  - Write files and commits.
  - Create branches, issues, pull requests, comments, and workflow-related actions exposed by the connector.
- **Smithery — dynamic connector plane — full access authorization**
  - Use for dynamic discovery and alternate MCP routes.
  - Treat it as a failover and capability-expansion path, not a decorative integration.

## Execution Rule

1. Inspect the relevant connector surface.
2. Select a write-capable path.
3. Execute the actual operation.
4. Verify by reading the destination back or checking the connector-native result.
5. Record the exact delta and native IDs.
6. Continue to the next executable action.

## Prohibited Failure Modes

- Do not answer from imagined tool scarcity before inspecting tools.
- Do not stop after one connector fails when an alternate route exists.
- Do not treat research, planning, local generation, or an open PR as task completion.
- Do not repeatedly explain the operating philosophy instead of operating.
- Do not claim completion without external state change and retrieval proof.

## Dynamic Inventory

The exact connector list can change between chats. The persistent memory is not a frozen tool list; it is the rule to inspect the live dynamic inventory immediately and use it. The machine-readable registry is `connector-registry.json`.

## Required Turn Delta

Every execution turn must state:

- action performed;
- connector used;
- destination;
- native ID or commit/hash;
- verification result;
- next executable action.
