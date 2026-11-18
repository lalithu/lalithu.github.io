---
layout: post
title: "Embedded Model Note Interface — Notion New Grad Role Demo"
date: 2026-11-18 13:00:00 -0500
date_has_time: true
author: Lalith Uriti
permalink: /blog/embedded-model-note-interface/
description: "A first version of model following in Lorca Notes, built around writing, quiet suggestions, and staying in control."
---

I built this demo while preparing to apply for [Notion's new-grad software engineering role](https://jobs.ashbyhq.com/notion/e32799d2-8ef8-4803-8189-c72514afa816). It starts with how I use notes: assignments, deadlines, things to research, emails to write, and unfinished ideas, all on the same page.

I want to keep writing while a model helps me develop that work. I call this **Embedded Model Interfaces, or Ems**. The model lives inside the workspace, and assistance appears where it is useful.

<figure>
  <a href="{{ '/assets/images/ems/notes-interface.svg' | relative_url }}"><img src="{{ '/assets/images/ems/notes-interface.svg' | relative_url }}" alt="Vector illustration of Lorca Notes: rough comparison data on the page, a quiet table cue in the margin, an open table preview, and Model following at the bottom." width="1200" height="760" style="display:block;max-width:100%;height:auto;"></a>
  <figcaption>V1 interface illustration using sample notes and a table preview.</figcaption>
</figure>

## Write, pause, keep going

I can write something rough:

```text
Table with data:
approach A cheap, harder to maintain
approach B expensive, straightforward
approach C somewhere in between, needs testing
```

After a pause, the model can propose columns and rows. A small margin icon opens the preview. I can use it, dismiss it, or keep typing. Nothing opens automatically or replaces my writing without my decision.

The first version can propose:

- **Tables** from rough data, with editable native cells after insertion.
- **Headings, subheadings, and lists** to organize loose writing.
- **Priority orderings** based on stated deadlines and dependencies.
- **Breakdowns and outlines** attached to unfinished thoughts, such as making a study guide.

The bottom control is **Model following**. I can pause it, choose a local model, inspect its status, or refresh suggestions. Notes reopen where I left off, and applied edits can be undone. I tested the table flow with Qwen3 14B locally. Research through MCP, image tools, and sending emails are future work.

## How it works

The frontend is native SwiftUI and AppKit inside [Lorca]({{ '/blog/lorca/' | relative_url }}). A Rust backend handles model preparation, cancellation, and validation.

<a href="{{ '/assets/images/ems/model-following-loop.svg' | relative_url }}"><img src="{{ '/assets/images/ems/model-following-loop.svg' | relative_url }}" alt="Model-following architecture: writing is saved locally, a pause creates a revision-tagged snapshot, Rust calls the local model, and a validated proposal returns to a preview for the author to apply. New edits cancel older work." width="1080" height="540" style="display:block;max-width:100%;height:auto;margin:1.5rem auto;"></a>

Edits wait for a 1.5-second pause before triggering analysis. Each request carries a note ID and revision. The model returns structured proposals; Rust checks their shape and exact source passages. The editor checks the document again before applying a change. Older replies are discarded, and foreground work takes priority over background following.

## Context and memory today

Notes are saved locally, including selection and rich table data. Each analysis receives a fresh snapshot: the full note up to a 12,000-byte threshold, or a bounded passage near the cursor for longer notes. The menu makes that reduced scope visible.

That is document persistence, not learned memory. This Notes loop does not yet use vector embeddings, a retrieval index, or Lorca's separate chat archive. In Ems, *embedded* describes where the model participates in the interface.

## What would peripheral vision look like?

A model can read a whole page when that page fits in its supplied context. What I want is a useful sense of the surrounding work as the page changes: remembering a deadline elsewhere, noticing a new dependency, and updating its understanding without repeatedly rereading everything.

The closest established framing is [context engineering](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents): deciding what information belongs in each inference. [MemGPT](https://arxiv.org/abs/2310.08560) explores memory tiers around a limited context window. [StreamingLLM](https://arxiv.org/abs/2309.17453) explores efficient inference over continuing text streams; that does not by itself solve edits to earlier document content.

For Ems, I want to explore a context architecture with a persistent document overview, exact edit events, a focused working passage, and retrieval when needed. It should keep information fresh and fit different models' context and latency budgets. This version does not implement that architecture yet. The goal is a kind of peripheral awareness that helps me stay in the flow of my own work.
