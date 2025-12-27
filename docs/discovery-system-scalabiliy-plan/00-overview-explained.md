# Understanding the Discovery System Migration

## A Plain-Language Guide to What We're Building and Why

---

So you have heard about this big migration we are doing.

Maybe you saw the overview document with all the boxes and arrows.

Maybe you nodded along while secretly wondering what any of it actually means.

This guide is for you.

No jargon without explanation. No assumptions about what you already know. Just a clear picture of what we are building, why we are building it, and how all the pieces fit together.

---

## What is the Discovery System in the First Place?

Imagine you just started a new job at a company with 500 employees.

On your first day, nobody gives you an employee directory. No org chart. No documentation about who does what. Your manager just says "figure it out" and walks away.

That is what it is like for an AI assistant trying to understand a large codebase without a Discovery System.

It is like creating an employee handbook that documents "what exists where" in your code.

The Discovery System scans your codebase and creates organized files that answer questions like:
- What React components exist?
- Where are the validation rules defined?
- Which hooks are available?
- How do different files connect to each other?

Instead of reading thousands of files to answer a simple question, Claude Code can just check the handbook.

The handbook stays up to date. Every time you change your code, the Discovery System updates its records.

---

## So What is the Problem?

The current Discovery System uses a tool called ts-morph.

Here is the issue with ts-morph.

It is like a librarian who reads every single book in the library cover-to-cover before answering any question.

Someone asks "Do you have any books about cooking?" The librarian does not check a catalog. Instead, they pick up every book, read the whole thing, remember it, and then answer.

That works fine when the library has 100 books. You might wait a minute or two.

But what happens when the library grows to 10,000 books?

The librarian's brain fills up. They literally cannot hold all that information at once. They collapse from mental exhaustion before finishing.

This is exactly what happens with ts-morph on large codebases. It tries to load everything into memory (the computer's short-term thinking space). Once you hit around 500,000 lines of code, it runs out of memory and crashes.

Our codebase is growing. We are planning for 2 million lines. ts-morph will not survive.

---

## Enter SCIP: The Card Catalog Approach

What if the librarian just built a card catalog first?

Read each book once. Write down what it contains. Put that card in an organized filing system. Done.

Now when someone asks a question, the librarian does not re-read anything. They just flip through the cards.

This is what SCIP does for code.

SCIP stands for Source Code Intelligence Protocol. It was created by Sourcegraph, and it is used by GitHub and Meta (the company behind Facebook).

Think about how Google works. When you search for something, Google does not visit every webpage on the internet in that moment. That would take forever. Instead, Google crawled the web beforehand and built an index. Your search just looks things up in the index.

SCIP is like Google's index, but for your code.

You run SCIP once. It reads all your files and creates an index file. From then on, answering questions is nearly instant because you are just looking things up, not re-reading everything.

The index file lives on your hard drive. It does not hog your computer's memory. That is why SCIP can handle 2 million lines of code without breaking a sweat.

---

## Why Do We Need Qdrant?

Okay, so SCIP can answer questions like:
- "Where is the ContactForm component defined?"
- "What functions does this file export?"

But what about fuzzier questions?

"Find me the stuff that handles form validation."

That is not a simple lookup. "Stuff" is not a technical term. "Handles" is vague. The code might use words like "validate," "check," "verify," or "sanitize."

This is where Qdrant comes in.

Imagine a librarian who understands meaning, not just keywords.

You walk up and say "I need books about heartbreak." A regular catalog search would only find books with "heartbreak" in the title. But this special librarian understands that books about loss, grief, breakups, and loneliness might also be relevant.

Qdrant is a database that stores meanings.

Regular databases store text and match exact words. Qdrant stores the meaning behind things and finds related content even if the words are different.

Ask for "form validation stuff" and Qdrant finds code related to input checking, error handling, and data sanitization. It understands that these concepts are related, even though the words are different.

This is called semantic search. Semantic means "related to meaning."

---

## Wait, How Does Qdrant Understand Meaning?

Good question. This is where embeddings come in.

An embedding is like coordinates on a map.

Think about a real map. New York and Philadelphia are close together. New York and Tokyo are far apart. The coordinates (latitude and longitude) capture the physical relationship between places.

Embeddings do the same thing, but for concepts.

Instead of physical distance, embeddings capture conceptual distance. Code that does similar things ends up with similar coordinates.

"Form validation" and "input checking" would be close together in embedding space.

"Form validation" and "database migration" would be far apart.

The embeddings are just lists of numbers. "Form validation" might become something like [0.23, -0.87, 0.45, ...]. There are 768 numbers in each list.

Why 768? That is just how much detail we need to capture the nuances of code meaning. Fewer numbers means less precision. More numbers means more storage and slower processing. 768 is the sweet spot.

Qdrant stores these number lists and can quickly find which ones are closest to each other.

---

## So Who Creates the Embeddings?

This is what Ollama does.

Ollama is like a translator that converts code into those lists of numbers.

You give it a piece of code. It reads the code, understands what it does, and outputs 768 numbers that represent the meaning.

Here is the beautiful part: Ollama runs on your own machine.

There are no API costs. No internet required. No privacy concerns about sending your code to some external service. Everything stays local.

We are using a specific translation model called nomic-embed-text. It was trained specifically to understand code and technical content. It is free and produces high-quality embeddings.

Think of it like having a bilingual friend who lives in your house. You can ask them to translate things anytime, for free, without worrying about anyone eavesdropping.

---

## Let Me Make Sure I Have This Straight

Here is how all the pieces fit together:

**SCIP** is the card catalog. It indexes your code so you can look things up instantly.

**Qdrant** is the meaning-aware library. It stores embeddings so you can search by concept.

**Ollama** is the translator. It converts code into embeddings that Qdrant can store.

**nomic-embed-text** is the specific translation dictionary Ollama uses.

Together, they let you ask questions like "find me the hooks for form validation" and get relevant results in under a second, even in a codebase with 2 million lines.

---

## Why Are We Doing a "Big Bang" Migration?

There are two ways to renovate a kitchen.

One way: swap out the sink while using the old stove, then swap the stove while using the old fridge, then swap the fridge. You can still cook dinner every night, but the renovation takes three months and you are constantly working around obstacles.

Another way: rip everything out at once, do the whole renovation in a week, and eat takeout for a few days.

We are doing the second approach.

The technical term is "big bang migration." Replace the old system entirely instead of trying to run both systems side by side.

Why this approach?

Because ts-morph and SCIP think about code in fundamentally different ways. Trying to make them work together would be like trying to run your kitchen on both gas and electric at the same time, with the gas pipes and electric wires tangled together.

It is cleaner to remove ts-morph completely and replace it with SCIP.

The migration takes 6 days. During that time, the old Discovery System still works. Once we are done, we flip the switch and use the new one.

---

## What Happens Over Those 6 Days?

The migration has four phases.

**Day 1: Install SCIP**

We install the SCIP tool and make sure it can scan our codebase. By the end of Day 1, we have a working index file. This is the foundation everything else builds on.

**Days 2-3: Replace the Extractors**

The Discovery System has seven "extractors." Each one knows how to find a specific type of thing in code (components, hooks, schemas, etc.).

Currently, these extractors use ts-morph. We rewrite them to use SCIP instead. Same inputs, same outputs, different engine under the hood.

**Days 4-5: Add Semantic Search**

This is where Qdrant and Ollama come in. We set up the vector database, connect the embedding pipeline, and index all our discovery data.

By the end of Day 5, we can ask natural language questions and get relevant code results.

**Day 6: Update the Build System**

The final day is cleanup. Update the automation scripts. Add health checks. Remove the old ts-morph dependency. Update the documentation.

---

## What Will Be Different When This is Done?

From your perspective as a user, the Discovery System will feel the same. It still creates those inventory files. It still keeps them up to date.

But you will notice a few improvements:

**It will be faster.** Extraction that used to take 2+ minutes will complete in under 10 seconds.

**It will use less memory.** Peak usage drops from 1.5GB to under 500MB.

**It can grow with us.** The new system handles 2 million lines of code. The old system started choking at 500,000.

**You can search by meaning.** Ask "find me the hooks for form validation" and get useful results, even if those exact words do not appear in the code.

---

## Do I Need to Know All This to Use the System?

No.

You can use the Discovery System without understanding any of these internals. Just run the commands and let it work.

But understanding the architecture helps when:
- Something breaks and you need to debug it
- You want to extend the system with new features
- You are curious about why things work the way they do

This guide is for the curious ones.

---

## What Happens Next?

The next four documents walk through each phase in detail:

1. **Phase 1: SCIP Installation** - Getting the index working
2. **Phase 2: Extractor Migration** - Replacing ts-morph with SCIP queries
3. **Phase 3: Qdrant + Ollama Integration** - Adding semantic search
4. **Phase 4: CI Integration** - Updating automation and cleanup

Each phase builds on the previous one. Do not skip ahead.

If you are implementing this migration, start with Phase 1. If you are just trying to understand the system, keep reading the overviews before diving into the details.

Either way, welcome to the journey.

---

## Quick Glossary

If you forget what something means, check here:

**Embedding** - A list of numbers (768 of them) that represents the meaning of a piece of code. Similar code has similar embeddings.

**SCIP** - Source Code Intelligence Protocol. An index format that stores code structure for fast lookup.

**Qdrant** - A database that stores embeddings and finds similar ones quickly. Enables semantic search.

**Ollama** - Software that runs AI models locally on your machine. Free and private.

**nomic-embed-text** - The specific AI model that converts code into embeddings.

**Semantic search** - Searching by meaning instead of exact keywords. "Form validation" finds "input checking."

**ts-morph** - The old tool we are replacing. Works by loading everything into memory, which fails on large codebases.

**Big bang migration** - Replacing an entire system at once instead of gradually transitioning.

---

That is the big picture.

Now you know what we are building, why we are building it, and how all the pieces connect.

The details are in the phase documents. But you have the foundation now.

Let's build something better.
