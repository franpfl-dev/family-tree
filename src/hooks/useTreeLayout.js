/**
 * useTreeLayout.js
 * Computes x/y pixel positions for every node in the tree.
 *
 * Layout rules:
 * - Fully recursive — supports any tree depth (respects tree.maxHeight).
 * - Each node's column width = max(own block width, sum of children column widths + gaps).
 * - Levels are placed top-to-bottom with V_GAP between them.
 * - Collapsed nodes (ids in collapsedIds set) are placed but their children are skipped,
 *   so the canvas compacts naturally.
 *
 * Returns: Map<personId, { x, y, width, height, isCouple, isLeft?, spouseId?, coupleX? }>
 */

import { getChildrenOf } from '../utils/familyUtils';

// ── Layout constants ───────────────────────────────────────────────────────────
export const NODE_W = 150;      // single node width
export const NODE_H = 140;      // single node height
export const COUPLE_W = 310;    // couple block total width (two nodes + connector)
export const COUPLE_H = 140;
export const H_GAP = 36;        // horizontal gap between sibling blocks
export const V_GAP = 110;       // vertical gap between levels
export const CANVAS_PAD_TOP = 60;
export const CANVAS_PAD_X = 80;

/**
 * Build layout positions for a tree — supports unlimited depth.
 *
 * @param {object} tree         FamilyTree object  ({ id, rootPersonId, maxHeight, … })
 * @param {Array}  persons      flat persons list (all trees)
 * @param {Set}    collapsedIds Set of personIds whose children should be hidden
 * @returns {{ positions: Map, canvasWidth: number, canvasHeight: number }}
 */
export function buildLayout(tree, persons, collapsedIds = new Set()) {
  if (!tree) return { positions: new Map(), canvasWidth: 800, canvasHeight: 600 };

  const treePersons = persons.filter((p) => p.treeId === tree.id);
  const positions = new Map();

  const rootPerson = treePersons.find((p) => p.id === tree.rootPersonId);
  if (!rootPerson) return { positions, canvasWidth: 800, canvasHeight: 600 };

  // ── Helper: is this person (or their spouse) collapsed? ───────────────────
  function isCollapsed(personId) {
    if (collapsedIds.has(personId)) return true;
    const person = treePersons.find((p) => p.id === personId);
    if (person?.spouseId && collapsedIds.has(person.spouseId)) return true;
    return false;
  }

  // ── Helper: block width for a single person (NODE_W or COUPLE_W if spouse in same tree) ──
  function blockWidth(person) {
    if (!person.spouseId) return NODE_W;
    const spouse = treePersons.find((p) => p.id === person.spouseId);
    return spouse ? COUPLE_W : NODE_W;
  }

  // ── Recursive: compute the column width needed for a subtree rooted at `personId` ──
  // When a node is collapsed, its children contribute 0 width.
  function subtreeWidth(personId) {
    const person = treePersons.find((p) => p.id === personId);
    if (!person) return NODE_W;

    const ownW = blockWidth(person);

    // If this node is collapsed, no child columns needed
    if (isCollapsed(personId)) return ownW;

    const children = getChildrenOf(personId, treePersons);
    if (children.length === 0) return ownW;

    const childrenTotalW =
      children.reduce((sum, c) => sum + subtreeWidth(c.id), 0) +
      (children.length - 1) * H_GAP;

    return Math.max(ownW, childrenTotalW);
  }

  // ── Recursive: place a person (and their subtree) at a given column-left and Y ──
  function placeNode(personId, columnLeft, columnWidth, y) {
    const person = treePersons.find((p) => p.id === personId);
    if (!person) return;

    const spouse = person.spouseId
      ? treePersons.find((p) => p.id === person.spouseId)
      : null;
    const isCouple = !!spouse;

    const ownW = isCouple ? COUPLE_W : NODE_W;
    const ownH = isCouple ? COUPLE_H : NODE_H;
    const blockLeft = columnLeft + columnWidth / 2 - ownW / 2;

    if (isCouple) {
      // Left person (the main person)
      positions.set(personId, {
        x: blockLeft,
        y,
        width: COUPLE_W,
        height: COUPLE_H,
        isCouple: true,
        spouseId: spouse.id,
        isLeft: true,
        coupleX: blockLeft,
        columnLeft,
        columnWidth,
      });
      // Right person (spouse)
      if (!positions.has(spouse.id)) {
        positions.set(spouse.id, {
          x: blockLeft,
          y,
          width: COUPLE_W,
          height: COUPLE_H,
          isCouple: true,
          spouseId: personId,
          isLeft: false,
          coupleX: blockLeft,
          columnLeft,
          columnWidth,
        });
      }
    } else {
      positions.set(personId, {
        x: blockLeft,
        y,
        width: NODE_W,
        height: NODE_H,
        isCouple: false,
        columnLeft,
        columnWidth,
      });
    }

    // ── Place children — skip if this node is collapsed ────────────────────
    if (isCollapsed(personId)) return;

    // A couple is treated as a single parenting unit. Children of either
    // partner (the main person OR their spouse) are rendered beneath the
    // couple block.
    const children = [
      ...getChildrenOf(personId, treePersons),
      ...(spouse ? getChildrenOf(spouse.id, treePersons) : []),
    ];
    if (children.length === 0) return;

    const childY = y + ownH + V_GAP;

    // Total width of the children row
    const childrenTotalW =
      children.reduce((sum, c) => sum + subtreeWidth(c.id), 0) +
      (children.length - 1) * H_GAP;

    // Center the children row under the parent column
    const columnCenterX = columnLeft + columnWidth / 2;
    let childCursor = columnCenterX - childrenTotalW / 2;

    for (const child of children) {
      const childColW = subtreeWidth(child.id);
      placeNode(child.id, childCursor, childColW, childY);
      childCursor += childColW + H_GAP;
    }
  }

  // ── Root column width = subtree width of the whole tree ──────────────────
  const rootColW = subtreeWidth(rootPerson.id);
  const canvasWidth = Math.max(rootColW + CANVAS_PAD_X * 2, 800);
  const centerX = canvasWidth / 2;

  placeNode(rootPerson.id, centerX - rootColW / 2, rootColW, CANVAS_PAD_TOP);

  // ── Canvas height = deepest Y + padding ──────────────────────────────────
  let maxY = 0;
  for (const pos of positions.values()) {
    maxY = Math.max(maxY, pos.y + pos.height);
  }
  const canvasHeight = Math.max(maxY + CANVAS_PAD_TOP + 60, 600);

  return { positions, canvasWidth, canvasHeight };
}

/**
 * Get the connector anchor points for SVG lines.
 * - parentBottomCenter: bottom-center of the parent's block
 * - childTopCenter: top-center of the child's block
 */
export function getConnectorPoints(parentPos, childPos) {
  // Parent bottom center
  const px = parentPos.isCouple
    ? parentPos.coupleX + parentPos.width / 2
    : parentPos.x + parentPos.width / 2;
  const py = parentPos.y + parentPos.height;

  // Child top center
  const cx = childPos.isCouple
    ? childPos.coupleX + childPos.width / 2
    : childPos.x + childPos.width / 2;
  const cy = childPos.y;

  return { px, py, cx, cy };
}
