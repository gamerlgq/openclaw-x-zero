"use strict";
/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Local shim for symbols removed from openclaw/plugin-sdk in 2026.3.14.
 * Provides jsonResult and readReactionParams with correct typing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonResult = jsonResult;
exports.readReactionParams = readReactionParams;
/**
 * Wrap an object as an AgentToolResult-compatible text result.
 * Returns the { content, details } shape expected by pi-agent-core.
 */
function jsonResult(obj) {
    return { content: [{ type: 'text', text: JSON.stringify(obj) }], details: obj };
}
/**
 * Extract reaction parameters from raw action params.
 * Returns emoji, remove flag, and isEmpty indicator.
 */
function readReactionParams(params, opts) {
    const raw = params.emoji ?? params.reaction ?? params.type;
    const emoji = typeof raw === 'string' ? raw.trim() : '';
    const remove = Boolean(params.remove ?? params.unreact);
    const isEmpty = !emoji && !remove;
    if (remove && !emoji && opts?.removeErrorMessage) {
        throw new Error(opts.removeErrorMessage);
    }
    return { emoji, remove, isEmpty };
}
