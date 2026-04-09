# Design: Finanz Informatik GmbH & Co. KG

## Scope and sourcing

This document summarizes three related things, sourced from FI's and Sparkasse's own public websites:

- the **core public platform and operating design** of FI as the central IT provider of the Sparkassen-Finanzgruppe
- the **public-facing website design language** visible on `f-i.de`, including colors, shapes, typography characteristics, layout patterns, and interaction style
- the **broader Sparkasse visual and product interaction language**, especially as expressed on `sparkasse.de` and in the public App Sparkasse materials

It is not an internal architecture or brand manual. Where FI's website describes strategy, product positioning, or visual patterns without exposing implementation details, the conclusions below are **explicit inferences from the public site**.

The website observations in the "Graphic design" sections are based on FI's public pages as accessed on **2026-04-09**.

## Executive summary

FI presents itself as a centrally operated, security-first, multichannel banking technology platform for the Sparkassen-Finanzgruppe, built around **OSPlus** and supported by FI-operated infrastructure, network, support, and controlled integration surfaces.

Its public website expresses the same posture visually: structured, corporate, and confidence-oriented. To strengthen that further, the design should be read and adapted through the **actual Sparkasse brand and app language**: a red-white-neutral base palette, clean sans-serif typography, overview-first financial dashboards, card-based modules, strong security affordances, and simple mobile interaction patterns optimized for trust and speed.[9][10][11][12]

## Core platform design

### Shared banking platform

The structural center of FI's public solution model is **OSPlus**, which FI describes as a unified and future-ready overall banking solution for the Sparkassen-Finanzgruppe.[1][2]

Design implication:

- FI is organized around a **shared platform** rather than institution-by-institution custom stacks.
- Core banking capabilities, channel experiences, and surrounding services appear to be anchored to one common platform model.

### End-to-end operating model

FI states that it contributes across the full IT service creation process: business concept, end-customer-oriented implementation, rollout, operations, and support.[1]

Design implication:

- FI behaves publicly like a **vertically integrated platform operator**, not just a software supplier.
- Product, delivery, production, and support are intentionally coupled.

### Multichannel process design

FI describes its solutions as multichannel and positions them across app, laptop, branch, service center, and self-service contexts.[1][2][3]

Design implication:

- Customer journeys are designed as **shared processes across channels**.
- Channel-specific surfaces appear to sit on top of common business flows and common platform services.

### Security, availability, and efficiency as design gates

FI states in its 2024 annual report that innovation follows only when **security, availability, and economic efficiency** are ensured.[4]

Design implication:

- FI's public design prioritizes controlled evolution over rapid but weakly governed change.
- Reliability and compliance appear to be first-order architecture constraints, not downstream concerns.

### Sovereign runtime and controlled integration

FI states that OSPlus is operated **on premise** and that FI runs Sparkassen IT solutions in its **own data centers**.[5][6] FI also presents DynS as a controlled interface through which customers and external partners can read and write OSPlus data in a standardized way under strong connectivity constraints.[7]

Design implication:

- FI favors **operational sovereignty** and direct control over core runtime infrastructure.
- Extensibility exists, but through governed, standardized interfaces rather than open internet-first exposure.

### Ongoing modernization inside a regulated framework

FI's 2025 OSPlus strategy update says that the platform is being advanced together with modernization of the application, development, and system architecture, under themes such as digital sovereignty, cyber defense, AI, and regulation including DORA and AI Act.[3]

Design implication:

- FI's public design is not static legacy preservation.
- The target state appears to be **incremental architectural modernization around a stable shared platform**.

## Graphic design and website design language

### Overall visual character

The public FI website presents a **serious, corporate, infrastructure-grade design language**. It is not playful, consumer-fintech-like, or visually experimental. The site communicates trust, stability, and scale first.

Key characteristics inferred from the public pages:

- large hero images and campaign images at the top of major pages
- strong information hierarchy with clear section titles and short explanatory blocks
- modular teaser layout built from reusable cards, tiles, and linked content blocks
- a restrained visual rhythm that prioritizes legibility and navigation over novelty

This fits FI's own messaging around being the central and secure IT partner of the Sparkassen-Finanzgruppe.[1][4]

### Design baseline should be Sparkasse, not just FI

For any future FI-facing or FI-produced digital surface that is meant to be legible inside the Sparkassen ecosystem, the stronger baseline should be the **Sparkasse design language itself**, not FI's website in isolation.

Why:

- Sparkasse's public web and app properties already define the customer-facing expectations for banking inside the group.[9][10][11]
- The App Sparkasse presents the clearest interaction standard for mobile financial use: overview first, fast actions, simple configuration, and visible security.[10][11]
- FI's own public language is already closely aligned with those values, so adapting further toward Sparkasse improves continuity rather than creating tension.[1][8]

### Color system

The visible brand language should rely on a **Sparkasse-first red-white-neutral** palette. Based on the public FI and Sparkasse pages, the dominant scheme is:

- red as the primary brand accent for emphasis, calls to action, and recognition
- white or very light backgrounds for most content areas
- dark text for readability and institutional tone
- occasional gray separation for structure and content grouping

Important limitation:

- FI's accessible public pages do not expose an authoritative color specification in the source text I reviewed, so this document does **not** claim exact brand hex values.

Design interpretation:

- The palette is used to convey **trust, urgency, and institutional continuity**, not lifestyle branding.
- Red functions more as a controlled identity marker than as a saturation-heavy decorative layer.
- FI surfaces that want to feel native to Sparkasse should use **Sparkasse red as the primary anchor**, with FI-specific differentiation only as a secondary layer.

### Shapes and composition

The website appears to favor **rectilinear, modular shapes**:

- wide horizontal hero areas
- rectangular teaser cards
- image blocks paired with text and "Mehr dazu" style links
- icon-supported lists and benefit grids

The overall geometry is structured and grid-led rather than organic. Rounded, playful, or highly expressive shapes do not appear to define the visual system. This matches the brand posture of process reliability and operational control.

This also aligns with the Sparkasse app ecosystem, where public app materials consistently show **screen-like cards, stacked information panels, and dashboard-style overview modules** rather than ornamental shapes.[10][11][12]

### Typography

The public site reads as a **modern sans-serif system** with a clear hierarchy:

- large bold page titles for section entry points
- medium-weight subheads for scannability
- short, plain-language body copy with good line spacing
- recurring campaign labels and hashtags such as `#mehralsTech`

Important limitation:

- I did not find a public FI page in the reviewed material that explicitly names the website font family, so the exact font cannot be stated with confidence from the accessible source text alone.

Design interpretation:

- The typographic voice is clean and professional rather than editorial or luxury-branded.
- Readability and navigational clarity seem to matter more than typographic distinctiveness.
- FI should stay within the same typographic tone as Sparkasse's digital properties: neutral, modern, highly legible, and built for dense financial information rather than expressive branding.[9][10]

### Imagery and iconography

The site relies heavily on **section header images**, campaign visuals, and branded illustrations or graphics attached to pages such as "Das sind wir", "Karriere", and News Hub entries.[1][8]

FI also explicitly states that its icon system was awarded a **Red Dot Award** in the category "Pictogram System", and that these FI icons create orientation, support consistent communication across digital and analog contexts, and make the corporate design especially tangible.[8]

Design implication:

- Iconography is a real part of the FI design system, not incidental decoration.
- Visual assets appear to be used to improve orientation and consistency inside a large information architecture.
- Where FI products overlap with Sparkasse customer-facing banking journeys, iconography should feel compatible with the simpler functional language seen across Sparkasse app promotion pages: finance overview, payments, alerts, portfolios, and security actions.[9][10][11][12]

### Design values stated by FI itself

One of the strongest direct sources for FI's design language is FI's own announcement of two Red Dot Awards in 2025. In that article, FI says the design concept for `S-KIPilot` stands for **clarity, simplicity, and efficiency**, and that the FI icon system follows the same approach.[8]

This is the clearest concise statement of FI's public design philosophy.

Design implication:

- The website and related digital touchpoints should be read through those three values:
  `clarity -> simplified information hierarchy`
  `simplicity -> reduced visual noise and straightforward navigation`
  `efficiency -> content blocks and interaction patterns optimized for orientation and action`

### Interaction design

The website's interaction model appears to be **conservative and utility-focused**. From the public pages and search snippets, the recurring patterns are:

- large top-level navigation with broad content areas such as company, solutions, career, and customer portal
- repeated `Mehr dazu` / `Zum ...` links as primary interaction affordances
- card-based internal linking to related content, reports, benefits, and detail pages
- language switching between German and English
- customer-entry utilities such as contact, portal access, remote access, and DynS registration

Design implication:

- The site is optimized for **structured discovery and guided navigation**, not exploratory micro-interactions.
- Interactions appear intentionally predictable and low-risk, consistent with FI's broader trust and compliance posture.

### Sparkasse app interaction patterns to adopt

Sparkasse's public app materials add a more concrete interaction target for FI: the App Sparkasse is described as overview-driven, quick to set up, easy to use, and rich in shortcuts; it supports multibanking, personal profile organization, dark and light mode, and customizable financial overview screens.[9][10][11]

Design patterns FI should adopt from Sparkasse apps:

- **overview first**: start with accounts, cards, balances, alerts, and recent activity
- **dashboard cards**: information grouped into compact, readable modules
- **simple bottom-driven mobile navigation**: public setup instructions reference actions from the bottom of the app such as editing the start page.[11]
- **fast actions and shortcuts**: payments, approvals, account management, and status checks should be one or two steps away.[10][13]
- **security as visible UX**: biometrics, push approval, encrypted exchange, and device-specific protection are described as front-stage benefits, not hidden implementation detail.[11][13][14]
- **personalized overview controls**: sorting, hiding, and customizing account views are part of the standard Sparkasse app experience.[10]
- **light and dark adaptability**: Sparkasse explicitly supports both, following device settings.[10]

Design implication:

- FI should move from a generic enterprise website interaction model toward a **Sparkasse-native product interaction model** whenever the surface is product-like or transactional.
- The correct feel is not "marketing microsite"; it is "banking workspace with immediate clarity."

### Information architecture

The public site groups content into a few durable pillars:

- company and reporting
- solutions and strategy
- career and employer branding
- customer services under "Meine FI"
- news, magazines, podcasts, videos, and events

This produces a broad but orderly information architecture. The design does not appear minimalist in content volume; instead it uses repeated layout modules and navigation conventions to keep a large content estate manageable.

## Condensed design model

FI's public design can be summarized as:

`shared banking platform + FI-operated infrastructure + strong governance + multichannel delivery + Sparkasse-native visual and app patterns`

The technical and visual designs reinforce the same message:

- centralized control
- regulated reliability
- scale through standardization
- clear orientation for many user groups across one ecosystem

## Source-backed observations worth preserving

- FI positions itself as the central IT service provider and digitalization partner of the Sparkassen-Finanzgruppe.[1]
- OSPlus is the shared platform anchor.[1][2]
- FI stresses multichannel solutions across customer touchpoints.[1][2][3]
- FI publicly prioritizes security, availability, and efficiency.[4]
- FI emphasizes own data-center operation and digital sovereignty.[3][5][6]
- FI's public design language explicitly includes clarity, simplicity, and efficiency.[8]
- FI treats iconography as a systematic communication asset, not just decoration.[8]
- Sparkasse's app ecosystem emphasizes overview, simplicity, security, and cross-account aggregation.[9][10][11]
- The App Sparkasse publicly supports customizable overview screens and device-level dark/light mode behavior.[10][11]

## Sources

[1] Finanz Informatik, "Das sind wir"  
https://www.f-i.de/de/unternehmen/das-sind-wir

[2] Finanz Informatik, "Das machen wir"  
https://www.f-i.de/de/loesungen/das-machen-wir

[3] Finanz Informatik, "IT-Strategie OSPlus 2025 online erschienen"  
https://www.f-i.de/de/news-hub/fi-magazin/strategie/ausgabe-3-2025-strategie/it-strategie-osplus-2025-online-erschienen

[4] Finanz Informatik, "Jahresbericht 2024"  
https://www.f-i.de/news-hub/informieren-berichte/jahresberichte/jahresbericht-2024

[5] Finanz Informatik, "Weiter auf Erfolgskurs: Finanz Informatik baut Position der Sparkassen im digitalen Banking aus"  
https://www.f-i.de/de/news-hub/news-presse/pressemitteilungen-veroeffentlichungen/weiter-auf-erfolgskurs-fi-baut-digitales-banking-aus

[6] Finanz Informatik, "Jahresabschluss 2024: Blick zurück nach vorne"  
https://www.f-i.de/news-hub/fi-magazin/spektrum/ausgabe-1-2025-spektrum/jahresabschluss-2024

[7] Finanz Informatik, "Dynamische Schnittstelle"  
https://www.f-i.de/meine-fi/dynamische-schnittstelle

[8] Finanz Informatik, "Zwei Red Dot Awards für die FI"  
https://www.f-i.de/news-hub/news-presse/news/zwei-red-dot-awards-fuer-die-fi

[9] Sparkasse.de, "Die Apps der Sparkassen"  
https://www.sparkasse.de/pk/produkte/konten-und-karten/finanzen-apps.html

[10] Sparkasse.de, "App Sparkasse"  
https://www.sparkasse.de/pk/produkte/konten-und-karten/finanzen-apps/s-app.html

[11] Sparkasse.de, "Multibanking"  
https://www.sparkasse.de/pk/produkte/konten-und-karten/banking/multibanking.html

[12] Sparkasse.de, "S-Invest App"  
https://www.sparkasse.de/pk/produkte/konten-und-karten/finanzen-apps/s-invest.html

[13] Sparkasse.de, "S-Finanzcockpit"  
https://www.sparkasse.de/fk/produkte/apps-und-software/s-finanzcockpit.html

[14] Sparkasse.de, "S-pushTAN-App"  
https://www.sparkasse.de/pk/produkte/konten-und-karten/finanzen-apps/s-pushtan.html
