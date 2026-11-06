---
layout: post
title: "Building Lorca"
date: 2026-11-06 00:00:00 -0500
author: Lalith Uriti
permalink: /blog/lorca/
---

Lorca is a local AI agent. I ran into three problems on longer tasks. Chats filled the model's context window, large inputs crowded out useful history, and long replies could get cut off.

## Intelligent context management

Lorca saves the original conversation in a searchable archive. As the window fills, it makes a smaller checkpoint with the current goal, working notes, and complete tool exchanges. The model can look up older details when it needs them. Large inputs can be read in chunks, and cut-off replies can continue.

## Why I made it model-agnostic

I wanted to try different local models without rebuilding the agent around each one. Ollama and llama.cpp connect to the same Rust harness through adapters. The model decides what to do. The harness handles context, permissions, and tool execution.

![Lorca's existing diagram of the shared Rust harness and local model backends]({{ '/assets/images/lorca/architecture.svg' | relative_url }})

## How the harness runs a request

[![Mermaid flowchart of Lorca's model decisions, permission checks, and context checkpoints]({{ '/assets/images/lorca/lorca-agent-loop.svg' | relative_url }})]({{ '/assets/images/lorca/lorca-agent-loop.svg' | relative_url }})

The model can call a tool, look up an old record, ask me a question, or finish. Rust checks permissions before running tools and saves the results. Tool results and recalled records feed back into the working context. If that context is getting full, the harness makes a checkpoint before the next model call.
