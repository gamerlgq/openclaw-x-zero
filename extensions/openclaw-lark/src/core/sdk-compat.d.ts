/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Local shim for symbols removed from openclaw/plugin-sdk in 2026.3.14.
 * Provides jsonResult and readReactionParams with correct typing.
 */
/**
 * Wrap an object as an AgentToolResult-compatible text result.
 * Returns the { content, details } shape expected by pi-agent-core.
 */
export declare function jsonResult(obj: unknown): {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    details: unknown;
};
/**
 * Extract reaction parameters from raw action params.
 * Returns emoji, remove flag, and isEmpty indicator.
 */
export declare function readReactionParams(params: Record<string, unknown>, opts?: {
    removeErrorMessage?: string;
}): {
    emoji: string;
    remove: boolean;
    isEmpty: boolean;
};
