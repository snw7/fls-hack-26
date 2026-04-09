# Finanz Informatik x Sparkasse Hackathon Case Context

_Last updated: 2026-04-09_

## Purpose of this document

This file is the shared working context for our team during the hackathon. It captures what we heard in the conversation with Finanz Informatik / Sparkasse representatives, how we currently interpret the challenge, and which pain points and opportunities seem most relevant.

This document is meant to be:
- a single team reference point
- easy to extend as more people gather information
- practical rather than perfectly formal
- a living context file, not a final presentation artifact

## How to use this file

- Add new facts under the relevant section
- Separate confirmed facts from our interpretation
- If something is uncertain, mark it as assumption or open question
- Update the “Open questions” and “Hypotheses” sections as we learn more
- Keep this file stable enough that everyone can return to it as the main case context

---

# 1. Challenge summary

## Official challenge framing

The challenge is about using AI to improve collaboration between business and tech teams during software development.

## Working interpretation

The provided sample GitHub repository with the loan calculator is mainly a demo environment and implementation vehicle. It should be used, but it is not the true center of the case.

The real challenge is broader: improving end-to-end communication, understanding, and coordination between stakeholders across requirements, technical implementation, and progress communication.

## Core objective in one sentence

Build a practical AI prototype that reduces friction between requirement, code, decisions, and communication across business and tech.

## Short strategic framing

This is not mainly a coding productivity case.

It is a business-tech collaboration and context orchestration case.

---

# 2. What we heard in the conversation

## Main message

The biggest pain is not only vague requirements.

The strongest pain point is the dependency structure between stakeholders and the amount of unnecessary alignment effort created by fragmented information.

They explicitly described that many simple questions currently require:
- alignment meetings
- emails
- back-and-forth clarification

They want a better channel for simple questions so that not every clarification requires synchronous communication.

## Additional important messages from the conversation

- There should be a middle ground between too much and too little interaction
- The goal is not to remove collaboration completely
- The goal is mainly to avoid unnecessary alignment for simple questions
- Different stakeholders need different types and levels of information
- A lot of relevant context is currently spread across documents, people, repositories, tickets, and email / Outlook communication
- Documentation is incomplete and important knowledge often lives in people’s heads
- This is especially relevant because some experienced employees may retire soon

---

# 3. Stakeholders and roles

## 3.1 Sparkassen representatives

These act as key business-side stakeholders representing the Sparkassen perspective.

### What they do
- collect customer input and requests
- summarize needs from the Sparkassen side
- pass requirements into the internal process

### What they need
- understand whether a requested feature is already available
- know whether a requirement is feasible
- get updates on when something is implemented and can be tested
- receive communication in non-technical language

## 3.2 Business analysts

These act as the main translation layer between business input and technical implementation.

### What they do
- receive requirements from Sparkassen representatives
- formalize them in a structured Word-based use case document
- communicate requirements to the technical side

### What they need
- clarity on whether requirements are complete, ambiguous, or already covered
- faster feasibility feedback from tech
- more granular progress updates than the Sparkassen representatives
- support in translating technical progress back into business language

## 3.3 Developers / technical teams

These receive the formal requirements and must translate them into implementation.

### What they do
- read long use case descriptions
- identify the technical impact
- decide which framework, interface, and component are relevant
- implement the requested change

### What they need
- faster understanding of long business documents
- guidance on which internal framework or interface is relevant
- better visibility into existing functionality and prior solutions
- help building an implementation plan in a complex technical landscape

## 3.4 Internal experts / senior employees

These hold a lot of implicit company and system knowledge.

### Relevance
- much of the important context is not well documented
- knowledge is often person-dependent
- this creates risk as experienced employees retire

---

# 4. Current process as we understand it

## 4.1 High-level flow

1. Customer input or requests arise on the Sparkassen side
2. Sparkassen representatives collect and summarize this input
3. Requirements are passed to business analysts
4. Business analysts create a long Word-based use case description using a defined template
5. Developers read the use case description and try to understand what needs to be built
6. Developers determine technical impact, including framework, interface, component, and implementation approach
7. Business and tech often need meetings or direct clarification to resolve open questions
8. Work is tracked operationally in tickets
9. Status and feasibility information flows back to business stakeholders
10. Sparkassen representatives are informed when something is implemented and testable

## 4.2 Important nuance about the Word document

We should assume that the Word-based use case document is required for compliance or internal governance reasons.

At the same time, it does **not** need to remain the main day-to-day communication channel.

A likely realistic interpretation is:
- the formal use case document still gets created and approved
- operational work and communication can mostly happen through tickets and supporting systems
- the document remains an official artifact, but not necessarily the main working interface

This is important because it means a good solution does not need to replace the compliance artifact. It can instead reduce friction around it.

---

# 5. Systems, artifacts, and knowledge sources in the current environment

## 5.1 Use case documents

### What we know
- requirements are documented in long Word documents
- these are use case descriptions based on a template
- the documents are often lengthy and hard for developers to process efficiently
- they are likely required for compliance / governance

### Implication
These documents are important formal inputs, but they are not ideal as the only working medium for collaboration.

## 5.2 Jira ticket system

### What we know
- they use a Jira-based ticketing system
- tickets are part of the actual operational work process

### Implication
Tickets are likely the more natural channel for day-to-day collaboration, implementation progress, and structured follow-up work.

## 5.3 Repositories

### What we know
- there are several repositories
- not everyone has access to all repositories
- access depends on role

### Implication
Any AI-supported solution must respect role-based access and should not assume all users can see all technical assets.

## 5.4 Outlook / decision tracking

### What we know
- decisions are currently monitored or tracked in Outlook rather than centrally

### Implication
Important decision context is fragmented and harder to search, trace, and reuse. This likely contributes to repeated clarification and loss of institutional memory.

## 5.5 Internal frameworks, APIs, and legacy systems

### What we know
- developers work with several custom internal frameworks and APIs
- there is high technical complexity
- legacy technology such as COBOL may still be relevant in some areas

### Implication
The challenge for developers is not only understanding the requirement, but also mapping it to the correct technical implementation path in a complex system landscape.

## 5.6 Implicit knowledge in people

### What we know
- documentation is limited
- important knowledge is held by experienced employees
- this creates dependency and risk

### Implication
An AI solution that only looks at the repository would likely miss a large part of the actually relevant context.

---

# 6. Main pain points

## 6.1 Too many alignment meetings for simple questions

This was one of the clearest pains from the conversation.

### Problem
Many questions are relatively small, but currently still require:
- meetings
- emails
- clarification loops across roles

### Why it matters
This slows down work, creates stakeholder dependency, and adds communication overhead that should often be avoidable.

## 6.2 Translation loss across stakeholder handoffs

### Problem
Requirements move through multiple layers:
- customer input
- Sparkassen representatives
- business analysts
- formal use case document
- developers
- implementation feedback back to business

### Why it matters
Important intent, detail, and nuance can be lost, oversimplified, or distorted on the way.

## 6.3 Long use case documents are hard to work with

### Problem
Developers need to read long Word documents to understand what to build.

### Why it matters
This is slow, cognitively heavy, and often still insufficient without further clarification.

## 6.4 Technical mapping is difficult

### Problem
When developers receive a requirement, they still need to figure out:
- which framework is relevant
- which interface is needed
- which component must be changed
- what the implementation plan should be

### Why it matters
The internal technical landscape is complex enough that understanding the requirement is only one part of the problem.

## 6.5 Incomplete documentation and hidden knowledge

### Problem
A lot of relevant context is not centrally documented.

### Why it matters
People depend on senior experts for answers. This increases coordination effort and creates knowledge loss risk.

## 6.6 Decision context is fragmented

### Problem
Decisions are currently monitored in Outlook instead of in a central structured location.

### Why it matters
Decision history becomes hard to retrieve, hard to reuse, and easy to lose.

## 6.7 Progress visibility is not equally good for all stakeholders

### Problem
Different stakeholder groups need different levels of detail, but the current process does not make this easy.

### Specific needs
- Sparkassen representatives mainly need milestone-style updates and test readiness information
- business analysts need more granular feasibility and implementation progress updates

### Why it matters
Without the right progress visibility, business-side planning becomes harder and internal deadlines are harder to manage.

## 6.8 Duplicate or already-covered requests are hard to detect

### Problem
Some requested features may already exist or may already have been requested or implemented elsewhere.

### Why it matters
Without good discoverability, teams may waste time asking for or analyzing things that are already available.

## 6.9 Role-based access limits visibility

### Problem
Not everyone can see every repository or technical artifact.

### Why it matters
A collaboration solution must take access constraints seriously and cannot assume one shared unrestricted knowledge base for all users.

---

# 7. Root problem behind the symptoms

The root issue appears to be that relevant context is fragmented across many places and roles.

That context is currently spread across:
- people
- Word use case documents
- Jira tickets
- Outlook communication and decision trails
- repositories
- internal frameworks and APIs
- undocumented expert knowledge

Because no shared intelligent layer connects these sources, people compensate through meetings, email, manual reading, and person-dependent clarification.

This creates a business-tech translation problem and an information-access problem at the same time.

---

# 8. What a good future process should look like

The target is not zero human interaction.

The target is a better balance between necessary and unnecessary interaction.

## Desired properties of a better process
- simple questions can be answered asynchronously
- requirements are easier to understand and translate
- developers get help mapping business requests to the technical landscape
- decision context becomes easier to retrieve
- institutional knowledge becomes easier to access
- progress becomes visible in the right language and level of detail for each stakeholder
- duplicate or already-covered requests can be detected earlier
- meetings are reserved for actual tradeoffs, ambiguity, and decision-making

---

# 9. Implications for the hackathon solution

## 9.1 What the solution should probably not try to do

A strong solution likely should **not** try to:
- solve the full software lifecycle end to end
- replace all human communication
- replace the compliance use case document
- depend only on the demo repository
- assume all relevant knowledge is already documented
- assume all users have the same access rights

## 9.2 What the solution should probably focus on

A strong solution likely **should** focus on one or more of these:
- answering simple business-tech questions without a meeting
- translating long use case content into actionable technical understanding
- helping developers identify relevant frameworks, interfaces, and components
- surfacing related tickets, prior implementations, or already-existing functionality
- translating implementation progress or code changes back into business language
- connecting fragmented knowledge sources into a usable context layer

## 9.3 Strongest overall framing

The strongest framing for the prototype is likely:

**An AI-powered shared context layer between business and tech that reduces unnecessary alignment by connecting requirements, technical context, decisions, and progress information.**

---

# 10. Constraints and assumptions

## Confirmed or strongly suggested
- the use case document is likely required for compliance or governance reasons
- operational work is not only done through the use case document
- tickets are an important working channel
- repositories are role-restricted
- internal technical complexity is high
- documentation is incomplete
- many simple questions still trigger unnecessary alignment effort

## Assumptions we are making for now
- the Word document remains as an official artifact, but need not stay the main collaboration interface
- a practical solution can work alongside existing systems rather than replacing them
- a prototype that uses the demo repo as an example while framing the broader process problem should be acceptable
- a high-value prototype should focus on reducing friction in one or two critical collaboration steps instead of attempting full end-to-end automation


---

# 11. Team hypotheses

These are our current hypotheses based on the conversation.

## Hypothesis 1
The highest-value problem to solve is not code generation, but reducing unnecessary alignment effort for simple questions.

## Hypothesis 2
A good solution should treat the use case document as a compliance artifact, not as the main working interface.

## Hypothesis 3
The best prototype will connect multiple context sources rather than focusing only on the sample repository.

## Hypothesis 4
The most persuasive demo will show how AI reduces translation effort in both directions:
- business to tech
- tech back to business

## Hypothesis 5
Developers need help not just understanding requirements, but mapping them into the internal technical landscape.

---

# 12. Short team-ready case summary

## What the case is really about

The case is about reducing unnecessary business-tech alignment effort in a complex enterprise software environment.

## Why that friction exists

Because relevant context is fragmented across:
- long Word use case documents
- Jira tickets
- multiple repositories
- Outlook-based decision tracking
- custom frameworks and APIs
- undocumented expert knowledge

## What they seemed to care about most

- too many meetings for simple questions
- stakeholder dependency
- difficulty translating requirements into implementation
- lack of documentation and knowledge centralization
- difficulty understanding which framework / interface / component is relevant
- weak visibility into feasibility and progress
- avoiding duplicate requests or rediscovering existing functionality

## Best strategic framing for our team

Build an AI-powered shared context layer that makes requirement understanding, technical mapping, decision retrieval, and progress communication easier across business and tech.

---
