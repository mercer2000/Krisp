import { db } from "@/lib/db";
import {
  boards,
  columns,
  cards,
  cardTags,
  users,
  brainChatSessions,
} from "@/lib/db/schema";
import { eq, and, asc, isNull, isNotNull, max, desc } from "drizzle-orm";
import type {
  ActionResult,
  BoardContext,
  CreateCardData,
  MoveCardData,
  UpdateCardData,
  ArchiveCardData,
  RestoreCardData,
  QueryCardsData,
  PendingAction,
} from "./types";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

// ── Board Context ───────────────────────────────────

export async function getUserBoardContext(
  userId: string
): Promise<BoardContext> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { defaultBoardId: true },
  });

  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        orderBy: [asc(columns.position)],
        columns: { id: true, title: true, position: true },
      },
    },
    columns: { id: true, title: true },
  });

  return {
    boards: userBoards.map((b) => ({
      id: b.id,
      title: b.title,
      columns: b.columns.map((c) => ({
        id: c.id,
        title: c.title,
        position: c.position,
      })),
    })),
    defaultBoardId: user?.defaultBoardId ?? null,
  };
}

// ── Column Resolution ───────────────────────────────

const COLUMN_ALIASES: Record<string, string[]> = {
  todo: ["to do", "todo", "to-do", "backlog", "not started"],
  "in progress": [
    "in progress",
    "in-progress",
    "doing",
    "started",
    "working",
    "wip",
  ],
  done: ["done", "completed", "finished", "complete"],
  review: ["review", "in review", "reviewing"],
};

function resolveColumnByName(
  boardColumns: Array<{ id: string; title: string; position: number }>,
  targetName: string
): { id: string; title: string } | null {
  if (!boardColumns.length) return null;
  const lower = targetName.toLowerCase().trim();

  // Exact match (case-insensitive)
  const exact = boardColumns.find(
    (c) => c.title.toLowerCase() === lower
  );
  if (exact) return { id: exact.id, title: exact.title };

  // Alias match
  for (const [, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(lower)) {
      // Find the board column that matches any alias in the same group
      for (const alias of aliases) {
        const match = boardColumns.find(
          (c) => c.title.toLowerCase() === alias
        );
        if (match) return { id: match.id, title: match.title };
      }
    }
  }

  // Substring match
  const substr = boardColumns.find(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      lower.includes(c.title.toLowerCase())
  );
  if (substr) return { id: substr.id, title: substr.title };

  // Positional aliases — first column = todo, last = done
  if (COLUMN_ALIASES.todo.includes(lower)) {
    return { id: boardColumns[0].id, title: boardColumns[0].title };
  }
  if (COLUMN_ALIASES.done.includes(lower)) {
    const last = boardColumns[boardColumns.length - 1];
    return { id: last.id, title: last.title };
  }

  return null;
}

// ── Board Resolution ────────────────────────────────

function resolveBoard(
  ctx: BoardContext,
  boardName?: string
): {
  board: BoardContext["boards"][0];
  error?: string;
} | null {
  if (!ctx.boards.length) {
    return null;
  }

  if (boardName) {
    const lower = boardName.toLowerCase().trim();
    // Exact
    const exact = ctx.boards.find(
      (b) => b.title.toLowerCase() === lower
    );
    if (exact) return { board: exact };
    // Substring
    const sub = ctx.boards.find(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        lower.includes(b.title.toLowerCase())
    );
    if (sub) return { board: sub };
    // Ambiguous
    return {
      board: ctx.boards[0],
      error: `No board matching "${boardName}". Available boards: ${ctx.boards
        .map((b) => `"${b.title}"`)
        .join(", ")}`,
    };
  }

  // Default board
  if (ctx.defaultBoardId) {
    const def = ctx.boards.find((b) => b.id === ctx.defaultBoardId);
    if (def) return { board: def };
  }

  // Fall back to first board
  return { board: ctx.boards[0] };
}

// ── Card Fuzzy Search ───────────────────────────────

async function findCardsByReference(
  userId: string,
  cardRef: string,
  includeDeleted = false
) {
  const deletedFilter = includeDeleted
    ? isNotNull(cards.deletedAt)
    : isNull(cards.deletedAt);

  // Fetch all matching cards, then filter application-side (titles are encrypted)
  const allResults = await db
    .select({
      id: cards.id,
      title: cards.title,
      columnId: cards.columnId,
      columnTitle: columns.title,
      boardTitle: boards.title,
      priority: cards.priority,
      dueDate: cards.dueDate,
      deletedAt: cards.deletedAt,
    })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(
      and(
        eq(boards.userId, userId),
        deletedFilter,
      )
    )
    .limit(200);

  // Decrypt titles and filter by reference
  const lower = cardRef.toLowerCase();
  const results = allResults
    .map((r) => {
      const dec = decryptFields(r as Record<string, unknown>, CARD_ENCRYPTED_FIELDS);
      return dec as typeof r;
    })
    .filter((r) => r.title.toLowerCase().includes(lower))
    .slice(0, 10);

  return results;
}

// ── Create Card ─────────────────────────────────────

export async function executeCreateCard(
  userId: string,
  data: CreateCardData,
  ctx: BoardContext
): Promise<ActionResult> {
  const boardResult = resolveBoard(ctx, data.targetBoard);
  if (!boardResult) {
    return {
      success: false,
      message:
        "You don't have any Kanban boards yet. Create one first at the Boards page.",
    };
  }
  if (boardResult.error) {
    return { success: false, message: boardResult.error };
  }

  const board = boardResult.board;
  if (!board.columns.length) {
    return {
      success: false,
      message: `Board "${board.title}" has no columns. Add columns first.`,
    };
  }

  // Resolve target column
  let targetCol: { id: string; title: string };
  if (data.targetColumn) {
    const resolved = resolveColumnByName(board.columns, data.targetColumn);
    if (!resolved) {
      return {
        success: false,
        message: `Column "${data.targetColumn}" not found on board "${board.title}". Available columns: ${board.columns.map((c) => `"${c.title}"`).join(", ")}`,
      };
    }
    targetCol = resolved;
  } else {
    // Default to first column
    targetCol = { id: board.columns[0].id, title: board.columns[0].title };
  }

  // Calculate next position
  const [posResult] = await db
    .select({ maxPosition: max(cards.position) })
    .from(cards)
    .where(eq(cards.columnId, targetCol.id));
  const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

  // Check for duplicate title warning
  const [existing] = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .where(
      and(
        eq(columns.boardId, board.id),
        eq(cards.title, data.title),
        isNull(cards.deletedAt)
      )
    )
    .limit(1);

  // Insert the card (encrypted)
  const [newCard] = await db
    .insert(cards)
    .values(
      encryptFields({
        columnId: targetCol.id,
        title: data.title,
        description: data.description ?? null,
        position: nextPosition,
        dueDate: data.dueDate ?? null,
        priority: data.priority ?? "medium",
      }, CARD_ENCRYPTED_FIELDS)
    )
    .returning();

  // Add tags if provided
  if (data.tags && data.tags.length > 0) {
    const tagColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    await db.insert(cardTags).values(
      data.tags.map((label, i) => ({
        cardId: newCard.id,
        label,
        color: tagColors[i % tagColors.length],
      }))
    );
  }

  let message = `Created card **"${data.title}"** in column **${targetCol.title}** on board **${board.title}**`;
  if (data.priority && data.priority !== "medium") {
    message += ` (${data.priority} priority)`;
  }
  if (data.dueDate) {
    message += ` — due ${data.dueDate}`;
  }
  if (data.tags && data.tags.length > 0) {
    message += ` — tags: ${data.tags.join(", ")}`;
  }
  if (existing) {
    message += `\n\n> Note: A card with the same title already exists on this board.`;
  }

  return { success: true, message, cardId: newCard.id };
}

// ── Move Card ───────────────────────────────────────

export async function executeMoveCard(
  userId: string,
  data: MoveCardData,
  ctx: BoardContext
): Promise<ActionResult> {
  const matches = await findCardsByReference(userId, data.cardReference);

  if (matches.length === 0) {
    return {
      success: false,
      message: `No card found matching "${data.cardReference}".`,
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      message: `Multiple cards match "${data.cardReference}". Which one did you mean?\n${matches
        .map(
          (c, i) =>
            `${i + 1}. **${c.title}** (in ${c.columnTitle} on ${c.boardTitle})`
        )
        .join("\n")}`,
      candidates: matches.map((c) => ({
        id: c.id,
        title: c.title,
        columnName: c.columnTitle,
      })),
    };
  }

  const card = matches[0];

  // Find the board this card belongs to
  const cardBoard = ctx.boards.find((b) =>
    b.columns.some((c) => c.id === card.columnId)
  );
  if (!cardBoard) {
    return { success: false, message: "Card's board not found." };
  }

  const targetCol = resolveColumnByName(cardBoard.columns, data.targetColumn);
  if (!targetCol) {
    return {
      success: false,
      message: `Column "${data.targetColumn}" not found on board "${cardBoard.title}". Available columns: ${cardBoard.columns
        .map((c) => `"${c.title}"`)
        .join(", ")}`,
    };
  }

  if (targetCol.id === card.columnId) {
    return {
      success: true,
      message: `**${card.title}** is already in **${targetCol.title}**.`,
    };
  }

  // Calculate position in target column
  const [posResult] = await db
    .select({ maxPosition: max(cards.position) })
    .from(cards)
    .where(eq(cards.columnId, targetCol.id));
  const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

  await db
    .update(cards)
    .set({
      columnId: targetCol.id,
      position: nextPosition,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, card.id));

  return {
    success: true,
    message: `Moved **"${card.title}"** from **${card.columnTitle}** to **${targetCol.title}**.`,
    cardId: card.id,
  };
}

// ── Update Card ─────────────────────────────────────

export async function executeUpdateCard(
  userId: string,
  data: UpdateCardData
): Promise<ActionResult> {
  const matches = await findCardsByReference(userId, data.cardReference);

  if (matches.length === 0) {
    return {
      success: false,
      message: `No card found matching "${data.cardReference}".`,
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      message: `Multiple cards match "${data.cardReference}". Which one did you mean?\n${matches
        .map(
          (c, i) =>
            `${i + 1}. **${c.title}** (in ${c.columnTitle} on ${c.boardTitle})`
        )
        .join("\n")}`,
      candidates: matches.map((c) => ({
        id: c.id,
        title: c.title,
        columnName: c.columnTitle,
      })),
    };
  }

  const card = matches[0];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const changes: string[] = [];

  if (data.title !== undefined) {
    updates.title = data.title;
    changes.push(`title → "${data.title}"`);
  }
  if (data.description !== undefined) {
    updates.description = data.description;
    changes.push("description updated");
  }
  if (data.dueDate !== undefined) {
    updates.dueDate = data.dueDate;
    changes.push(data.dueDate ? `due date → ${data.dueDate}` : "due date cleared");
  }
  if (data.priority !== undefined) {
    updates.priority = data.priority;
    changes.push(`priority → ${data.priority}`);
  }

  if (changes.length === 0) {
    return { success: true, message: "No changes specified." };
  }

  await db.update(cards).set(encryptFields(updates, CARD_ENCRYPTED_FIELDS)).where(eq(cards.id, card.id));

  return {
    success: true,
    message: `Updated **"${card.title}"**: ${changes.join(", ")}.`,
    cardId: card.id,
  };
}

// ── Archive Card (with confirmation) ────────────────

export async function executeArchiveCard(
  userId: string,
  data: ArchiveCardData
): Promise<ActionResult & { pendingAction?: PendingAction }> {
  const matches = await findCardsByReference(userId, data.cardReference);

  if (matches.length === 0) {
    return {
      success: false,
      message: `No card found matching "${data.cardReference}".`,
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      message: `Multiple cards match "${data.cardReference}". Which one did you mean?\n${matches
        .map(
          (c, i) =>
            `${i + 1}. **${c.title}** (in ${c.columnTitle} on ${c.boardTitle})`
        )
        .join("\n")}`,
      candidates: matches.map((c) => ({
        id: c.id,
        title: c.title,
        columnName: c.columnTitle,
      })),
    };
  }

  const card = matches[0];
  return {
    success: true,
    needsConfirmation: true,
    message: `Are you sure you want to delete **"${card.title}"** (currently in ${card.columnTitle})? Type **yes** to confirm or **no** to cancel.`,
    pendingAction: {
      type: "archive_card",
      cardId: card.id,
      cardTitle: card.title,
      createdAt: new Date().toISOString(),
    },
  };
}

// ── Confirm Archive ─────────────────────────────────

export async function executeConfirmedArchive(
  userId: string,
  pendingAction: PendingAction
): Promise<ActionResult> {
  // Verify card still exists and is owned
  const [cardResult] = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(
      and(
        eq(cards.id, pendingAction.cardId),
        eq(boards.userId, userId),
        isNull(cards.deletedAt)
      )
    );

  if (!cardResult) {
    return { success: false, message: "Card no longer exists or was already deleted." };
  }

  await db
    .update(cards)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(cards.id, pendingAction.cardId));

  return {
    success: true,
    message: `Deleted **"${pendingAction.cardTitle}"**. You can restore it from the Trash within 30 days.`,
  };
}

// ── Restore Card ────────────────────────────────────

export async function executeRestoreCard(
  userId: string,
  data: RestoreCardData
): Promise<ActionResult> {
  const matches = await findCardsByReference(
    userId,
    data.cardReference,
    true // includeDeleted
  );

  if (matches.length === 0) {
    return {
      success: false,
      message: `No deleted card found matching "${data.cardReference}".`,
    };
  }

  if (matches.length > 1) {
    return {
      success: false,
      message: `Multiple deleted cards match "${data.cardReference}". Which one?\n${matches
        .map((c, i) => `${i + 1}. **${c.title}** (on ${c.boardTitle})`)
        .join("\n")}`,
      candidates: matches.map((c) => ({
        id: c.id,
        title: c.title,
        columnName: c.columnTitle,
      })),
    };
  }

  const card = matches[0];
  await db
    .update(cards)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(cards.id, card.id));

  return {
    success: true,
    message: `Restored **"${card.title}"** back to **${card.columnTitle}**.`,
    cardId: card.id,
  };
}

// ── Query Cards ─────────────────────────────────────

export async function executeQueryCards(
  userId: string,
  data: QueryCardsData,
  ctx: BoardContext
): Promise<ActionResult> {
  const boardResult = resolveBoard(ctx, data.boardName);
  if (!boardResult) {
    return { success: false, message: "You don't have any Kanban boards." };
  }
  if (boardResult.error) {
    return { success: false, message: boardResult.error };
  }

  const board = boardResult.board;

  // Fetch full board with cards
  const fullBoard = await db.query.boards.findFirst({
    where: and(eq(boards.id, board.id), eq(boards.userId, userId)),
    with: {
      columns: {
        orderBy: [asc(columns.position)],
        with: {
          cards: {
            where: and(eq(cards.archived, false), isNull(cards.deletedAt)),
            orderBy: [asc(cards.position)],
          },
        },
      },
    },
  });

  if (!fullBoard) {
    return { success: false, message: "Board not found." };
  }

  // Apply filters
  let filteredColumns = fullBoard.columns;

  if (data.status) {
    const col = resolveColumnByName(
      fullBoard.columns.map((c) => ({
        id: c.id,
        title: c.title,
        position: c.position,
      })),
      data.status
    );
    if (col) {
      filteredColumns = fullBoard.columns.filter((c) => c.id === col.id);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const lines: string[] = [
    `**Board: ${fullBoard.title}**`,
    "",
  ];

  let totalCards = 0;

  for (const col of filteredColumns) {
    // Decrypt card titles/descriptions
    let colCards = col.cards.map((c) => {
      const dec = decryptFields(c as Record<string, unknown>, CARD_ENCRYPTED_FIELDS);
      return dec as typeof c;
    });

    if (data.priority) {
      colCards = colCards.filter((c) => c.priority === data.priority);
    }
    if (data.overdue) {
      colCards = colCards.filter(
        (c) => c.dueDate && c.dueDate < today
      );
    }

    if (colCards.length === 0) continue;
    totalCards += colCards.length;

    lines.push(`### ${col.title} (${colCards.length})`);
    for (const card of colCards) {
      const parts = [`- **${card.title}**`];
      if (card.priority !== "medium") parts.push(`[${card.priority}]`);
      if (card.dueDate) {
        const overdue = card.dueDate < today;
        parts.push(overdue ? `~~due ${card.dueDate}~~ (overdue)` : `due ${card.dueDate}`);
      }
      lines.push(parts.join(" "));
    }
    lines.push("");
  }

  if (totalCards === 0) {
    lines.push("No cards match your criteria.");
  } else {
    lines.push(`*${totalCards} card${totalCards === 1 ? "" : "s"} total*`);
  }

  return { success: true, message: lines.join("\n") };
}

// ── Store/Clear Pending Action ──────────────────────

export async function storePendingAction(
  sessionId: string,
  action: PendingAction | null
) {
  await db
    .update(brainChatSessions)
    .set({ pendingAction: action, updatedAt: new Date() })
    .where(eq(brainChatSessions.id, sessionId));
}

// ── Set Default Board ───────────────────────────────

export async function setDefaultBoard(
  userId: string,
  boardId: string
): Promise<ActionResult> {
  // Verify board belongs to user
  const [board] = await db
    .select({ id: boards.id, title: boards.title })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

  if (!board) {
    return { success: false, message: "Board not found." };
  }

  await db
    .update(users)
    .set({ defaultBoardId: boardId, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return {
    success: true,
    message: `Set **"${board.title}"** as your default board.`,
  };
}
