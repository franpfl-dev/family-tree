# 🌳 Family Tree App — Master Prompt (CLAUDE.md)

> This file is your complete guide to building the Family Tree application.
> It is broken into **5 phases**. Feed each phase to Claude separately.
> Always share this file at the start of every new conversation so Claude has full context.

---

## 📐 Project Overview

A multi-tree family visualization app where one large family is split into
manageable **sub-trees of height 3** (Root → Children → Grandchildren).
Sub-trees are cross-linked to each other to represent real-world relationships
(in-laws, cousins, etc.). The app is built as a **single React application**
with persistent state stored in `localStorage`.

### Tech Stack
- **Framework**: React (functional components + hooks)
- **Styling**: Tailwind CSS
- **Charts/Tree rendering**: Custom SVG or `react-d3-tree` or manual canvas
- **State**: React Context + useReducer + localStorage persistence
- **Routing**: React Router v6 (for tree navigation)
- **Icons**: lucide-react

---

## 🗂️ Data Models

Always keep these in mind across all phases.

```ts
// A single Person
Person {
  id: string                  // uuid
  name: string
  gender: "male" | "female" | "other"
  dob: string                 // "YYYY-MM-DD"
  dod?: string                // date of death, optional
  profilePhoto?: string       // base64 or URL
  spouseId?: string           // id of spouse (Person)
  anniversaryDate?: string    // "YYYY-MM-DD"
  treeId: string              // which sub-tree this person belongs to
  parentId?: string           // id of parent node (Person) in that tree
  children: string[]          // list of child Person ids
  level: number               // 0 = root, 1 = child, 2 = grandchild
  crossLinks: CrossLink[]     // external relationships
}

// A cross-tree relationship
CrossLink {
  targetPersonId: string      // id of the person in another tree
  relationshipLabel: string   // e.g. "Wife's Brother", "Maternal Uncle"
}

// A sub-tree
FamilyTree {
  id: string
  name: string                // e.g. "Sharma Family"
  rootPersonId: string        // the root Person id
  maxHeight: number           // default 3, can be increased per tree
  createdAt: string
}
```

---

## 📦 App State Shape

```ts
AppState {
  trees: FamilyTree[]
  persons: Person[]           // flat list of all persons across all trees
  activeTreeId: string | null
  navigationHistory: string[] // stack of treeIds for breadcrumb back navigation
}
```

---

## 🔁 Phase Breakdown

---

## ✅ PHASE 1 — Project Scaffold + Data Layer

### Goal
Set up the React app, define the full data model, implement state management
with localStorage persistence, and create all CRUD operations for persons and trees.

### Tasks

1. **Initialize React app** (assume Vite + React + Tailwind already set up)

2. **Create `AppContext.jsx`**
   - Use `React.createContext` + `useReducer`
   - Load initial state from `localStorage` on mount
   - Save to `localStorage` on every state change (useEffect)

3. **Implement Reducer Actions**
   ```
   CREATE_TREE         — adds a new FamilyTree
   DELETE_TREE         — removes a tree and all its persons
   ADD_PERSON          — adds a Person to flat persons list
   UPDATE_PERSON       — edits a Person's details
   DELETE_PERSON       — removes person (also removes from parent's children[])
   LINK_SPOUSE         — sets spouseId on both persons bidirectionally
   ADD_CROSS_LINK      — adds CrossLink to both persons bidirectionally
   REMOVE_CROSS_LINK   — removes a CrossLink from both sides
   SET_ACTIVE_TREE     — sets activeTreeId
   PUSH_HISTORY        — pushes a treeId to navigationHistory
   POP_HISTORY         — pops last treeId from navigationHistory
   ADD_TREE_LEVEL      — increments maxHeight for a specific tree
   ```

4. **Helper utility functions** in `utils/familyUtils.js`
   ```
   getPersonById(id, persons)
   getChildrenOf(personId, persons)
   getSpouseOf(personId, persons)
   getTreePersons(treeId, persons)
   getRootPerson(tree, persons)
   buildTreeStructure(treeId, persons, trees)
   getCrossLinkedPersons(personId, persons)
   ```

5. **Auto-branch generation logic**
   - When creating a root person, accept a `numberOfChildren` field
   - Auto-create that many placeholder child Person nodes under the root
   - Each placeholder has name "Child 1", "Child 2", etc. and is editable later

### Deliverable
A working data layer with context, reducer, and utility functions.
No UI yet. Test via console logs.

---

## ✅ PHASE 2 — Tree Creation Form + Home Screen

### Goal
Build the home screen showing all sub-trees as cards, and a multi-step form
to create a new sub-tree by entering root person details.

### UI Pages

#### Home Screen (`/`)
- Header: App name "Family Tree" + button "＋ New Family Tree"
- Grid of **FamilyTreeCard** components, one per tree
  - Shows: Tree name, root person name, number of members
  - Buttons: "Open Tree", "Delete Tree"
- Empty state if no trees exist

#### New Tree Form (`/new-tree`) — Multi-step
**Step 1 — Tree Info**
- Tree Name (e.g. "Sharma Family")

**Step 2 — Root Person (Grandfather/Grandmother)**
- Full Name
- Gender
- Date of Birth
- Date of Death (optional, toggle)
- Profile Photo upload (optional)
- Is Married? (toggle)
  - If yes: Spouse Name, Spouse DOB, Spouse DOD (optional), Anniversary Date
- Number of Children (number input, min 0, max 20)
  → This auto-generates placeholder children at level 1

**Step 3 — Review & Confirm**
- Summary card showing what will be created
- "Create Tree" button

### Design Notes
- Warm earthy color palette (think aged parchment — cream, terracotta, deep brown)
- Use a serif display font for headings (e.g. Playfair Display via Google Fonts)
- Form steps have smooth slide transitions
- Married couple preview shows as two cards side-by-side with a heart connector

### Deliverable
Fully working home screen + new tree form that dispatches to the reducer.

---

## ✅ PHASE 3 — Tree Visualization (Core Feature)

### Goal
Render a sub-tree visually with 3 levels. Married couples are joined blocks.
Nodes are interactive.

### Tree Canvas (`/tree/:treeId`)

#### Layout
- Full-page canvas with pan support (drag to move)
- **Level 0 (Root)** — Center top: Couple block or single block
- **Level 1 (Children)** — Row below root, evenly spaced
  - Each child who is married shows as a couple block
- **Level 2 (Grandchildren)** — Row below each child
- SVG lines connecting parent to children
- Lines between spouses inside a couple block (horizontal connector)

#### Person Node (Single)
```
┌─────────────────┐
│  [Photo / Icon] │
│  Full Name      │
│  DOB: Jan 1980  │
│  ✝ Dec 2020     │  ← only if deceased
└─────────────────┘
```

#### Couple Block (Joined)
```
┌──────────┬─────────┬──────────┐
│ Husband  │  💍     │  Wife    │
│ Name     │ Ann:    │  Name    │
│ DOB      │ 2000    │  DOB     │
└──────────┴─────────┴──────────┘
```

#### Node Click → Context Menu (small popup near node)
Options:
1. 👁 View / Edit Details
2. 👶 Add Child (only if level < maxHeight - 1)
3. 💍 Add / Edit Spouse
4. 🔗 Add Cross-Link (link to person from another tree)
5. ➕ Add Tree Level (only shown on root node, increases maxHeight)

#### Breadcrumb Bar (top of page)
- Shows navigation trail: Home > Sharma Family > [Back]
- Back button pops navigationHistory

#### Height Adder
- On root node context menu: "＋ Extend Tree Height"
- Dispatches ADD_TREE_LEVEL, re-renders tree with new max depth

### SVG Rendering Rules
- Use foreignObject or absolute-positioned divs for nodes
- Calculate x/y positions based on level and sibling index
- Draw SVG `<path>` curves between parent center-bottom to child center-top
- Couple blocks sit on same level, connected by a short horizontal line
- Pan: track mousedown + mousemove delta, apply CSS transform

### Deliverable
Fully interactive tree canvas for a single sub-tree.

---

## ✅ PHASE 4 — Forms, Panels & Cross-Linking

### Goal
Build all the detail forms and the cross-link system.

### 4A — Person Detail Panel (Slide-in from right)

Triggered by "View / Edit Details" from context menu.

Sections:
- **Personal Info**: Name, Gender, DOB, DOD (toggle), Photo upload
- **Marriage Info** (if spouse exists): Anniversary date, Spouse name (read-only link)
- **Cross-Links section**: List of all existing cross-links for this person
  - Shows: linked person's name + tree name + relationship label
  - Each has a ✕ remove button
  - "＋ Add Cross-Link" button
- Save / Cancel buttons

### 4B — Add Child Form (Modal)

Fields: Name, Gender, DOB, DOD (optional), Is Married? (toggle spouse fields)
On submit: ADD_PERSON dispatched with parentId set, level = parent.level + 1

### 4C — Add Spouse Form (Modal)

Two options:
1. **Create New**: Fill in name, DOB, DOD, anniversary → creates new Person linked as spouse
2. **Link Existing**: Search box to find a person already in any tree → LINK_SPOUSE dispatched

### 4D — Cross-Link Modal ("Add Relation")

Triggered from context menu "Add Cross-Link"

Layout:
- **Search bar**: Type name to search across ALL persons in ALL trees
- Results list: Shows person name + tree name + their existing relations summary
- On select: Show relationship label input
  - Dropdown suggestions: Wife's Brother, Wife's Sister, Husband's Brother,
    Husband's Sister, Maternal Uncle, Paternal Uncle, Maternal Aunt,
    Paternal Aunt, Cousin, Family Friend, Other (free text)
- "Link" button → dispatches ADD_CROSS_LINK on both persons

### 4E — Cross-Links Display on Node

When a node has cross-links, show a small badge (e.g. 🔗 3) on the node.
Hovering or clicking shows a mini panel listing linked people.
Each linked person name is a clickable link that:
1. Dispatches PUSH_HISTORY with current treeId
2. Dispatches SET_ACTIVE_TREE with linked person's treeId
3. Navigates to `/tree/:linkedTreeId` and scrolls/highlights that person's node

### Deliverable
All forms working, cross-links created and displayed, navigation between trees working.

---

## ✅ PHASE 5 — Polish, Edge Cases & Final Features

### Goal
Final UI polish, edge case handling, and bonus features.

### 5A — Placeholder Node Editing
- Auto-generated placeholder children (from "Number of Children" in form)
  show as dashed-border nodes with "Edit" prompt
- Clicking opens Add Child form pre-filled with their position

### 5B — Deceased Styling
- Nodes of deceased persons have a subtle greyed border + ✝ icon
- Couple block with one deceased: deceased half is slightly muted

### 5C — Tree Overview Minimap
- Small minimap in bottom-right corner showing full tree structure
- Click area on minimap to pan canvas to that region

### 5D — Search Bar (Global)
- Top nav search: type any name
- Results show: person name, tree name, relationship summary
- Click result → navigate to their tree + highlight their node

### 5E — Export / Print
- "Export as PNG" button on tree page (use html2canvas)
- "Export Data as JSON" button on home screen (downloads full AppState)
- "Import JSON" button to restore a saved state

### 5F — Edge Cases to Handle
- Prevent circular parent-child links
- Prevent linking a person as their own spouse
- Prevent adding child beyond maxHeight
- If a person is deleted who has cross-links, clean up cross-links on both sides
- If a tree is deleted, warn that cross-links from other trees to this tree will be removed
- Spouse can only be assigned once (validate on LINK_SPOUSE)

### 5G — Responsive / Mobile
- On mobile: tree canvas scrolls horizontally
- Context menu becomes a bottom sheet on mobile
- Forms are full-screen modals on mobile

### Deliverable
Production-ready, fully polished family tree app.

---

## 🧩 Component Tree (Reference)

```
App
├── AppContext (Provider)
├── Router
│   ├── / → HomeScreen
│   │   ├── Header
│   │   ├── FamilyTreeCard[]
│   │   └── EmptyState
│   ├── /new-tree → NewTreeWizard
│   │   ├── StepTreeInfo
│   │   ├── StepRootPerson
│   │   └── StepReview
│   └── /tree/:treeId → TreeCanvas
│       ├── BreadcrumbBar
│       ├── SearchBar (global)
│       ├── SVGConnectors
│       ├── PersonNode[] / CoupleBlock[]
│       ├── ContextMenu (portal)
│       ├── PersonDetailPanel (slide-in)
│       ├── AddChildModal
│       ├── AddSpouseModal
│       ├── CrossLinkModal
│       └── Minimap
```

---

## 🎨 Design System

```css
/* Color Palette */
--color-bg:         #FDF6EC   /* warm cream */
--color-surface:    #FFF8F0   /* card background */
--color-border:     #D4A96A   /* warm gold border */
--color-primary:    #7B3F00   /* deep brown */
--color-accent:     #C0392B   /* terracotta red */
--color-text:       #2C1A0E   /* dark brown text */
--color-muted:      #A0856C   /* muted brown */
--color-deceased:   #9E9E9E   /* grey for deceased */
--color-link:       #1A6B8A   /* teal for cross-links */

/* Typography */
--font-display:     'Playfair Display', serif    /* headings, names */
--font-body:        'Lato', sans-serif           /* body text, dates */

/* Shadows */
--shadow-node:      0 4px 16px rgba(123,63,0,0.12)
--shadow-panel:     0 8px 32px rgba(44,26,14,0.18)
```

---

