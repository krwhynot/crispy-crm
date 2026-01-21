/**
 * ESLint Rule: no-raw-error-in-notify
 *
 * Prevents raw error.message from being passed to notify() or toast() calls.
 * This prevents technical/database error messages from leaking to users.
 *
 * @fileoverview This rule detects dangerous patterns where error.message
 * or err.message is passed to notification functions, exposing internal
 * error details to end users.
 *
 * Examples of incorrect code:
 *   notify(error.message, { type: 'error' })
 *   notify(`Failed: ${error.message}`, { type: 'error' })
 *   notify(err.message)
 *   toast(error.message)
 *   notify(error instanceof Error ? error.message : "fallback", ...)
 *
 * Examples of correct code:
 *   const { error: notifyError } = useSafeNotify();
 *   notifyError(error);
 *   notifyError(error, "Custom fallback message");
 *
 * Engineering Constitution: Single source of truth for error sanitization
 */

/**
 * Common error variable names used in try-catch blocks
 */
const ERROR_VAR_NAMES = ["error", "err", "e", "ex", "exception"];

/**
 * Notification function names to check
 */
const NOTIFY_FUNCTIONS = ["notify", "toast"];

/**
 * Check if a node represents accessing .message on an error-like variable
 * Handles: error.message, err.message, e.message
 */
function isErrorMessageAccess(node) {
  if (!node) return false;

  // Direct property access: error.message
  if (
    node.type === "MemberExpression" &&
    node.property &&
    node.property.type === "Identifier" &&
    node.property.name === "message"
  ) {
    // Check if object is an error-like variable
    if (node.object && node.object.type === "Identifier") {
      return ERROR_VAR_NAMES.includes(node.object.name);
    }
    return false;
  }

  return false;
}

/**
 * Check if a template literal contains error.message interpolation
 * Handles: `Failed: ${error.message}`
 */
function templateContainsErrorMessage(node) {
  if (node.type !== "TemplateLiteral") return false;

  for (const expression of node.expressions || []) {
    if (isErrorMessageAccess(expression)) {
      return true;
    }
    // Also check nested conditional expressions
    if (expression.type === "ConditionalExpression") {
      if (
        isErrorMessageAccess(expression.consequent) ||
        isErrorMessageAccess(expression.alternate)
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a conditional expression contains error.message
 * Handles: error instanceof Error ? error.message : "fallback"
 */
function conditionalContainsErrorMessage(node) {
  if (node.type !== "ConditionalExpression") return false;

  return (
    isErrorMessageAccess(node.consequent) ||
    isErrorMessageAccess(node.alternate) ||
    (node.consequent && conditionalContainsErrorMessage(node.consequent)) ||
    (node.alternate && conditionalContainsErrorMessage(node.alternate))
  );
}

/**
 * Check if a binary expression (string concatenation) contains error.message
 * Handles: "Error: " + error.message
 */
function binaryContainsErrorMessage(node) {
  if (node.type !== "BinaryExpression" || node.operator !== "+") return false;

  return (
    isErrorMessageAccess(node.left) ||
    isErrorMessageAccess(node.right) ||
    (node.left && node.left.type === "BinaryExpression" && binaryContainsErrorMessage(node.left)) ||
    (node.right && node.right.type === "BinaryExpression" && binaryContainsErrorMessage(node.right))
  );
}

/**
 * Check if any argument contains error.message pattern
 */
function argumentContainsErrorMessage(arg) {
  if (!arg) return false;

  // Direct error.message access
  if (isErrorMessageAccess(arg)) return true;

  // Template literal: `Failed: ${error.message}`
  if (templateContainsErrorMessage(arg)) return true;

  // Conditional: error instanceof Error ? error.message : "fallback"
  if (conditionalContainsErrorMessage(arg)) return true;

  // Binary expression: "Error: " + error.message
  if (binaryContainsErrorMessage(arg)) return true;

  return false;
}

/**
 * Get the callee name from a call expression
 * Handles both direct calls (notify) and member expression calls (obj.notify)
 */
function getCalleeName(node) {
  if (!node.callee) return null;

  // Direct call: notify(...)
  if (node.callee.type === "Identifier") {
    return node.callee.name;
  }

  // Member expression: something.notify(...) - we only care about the method name
  if (
    node.callee.type === "MemberExpression" &&
    node.callee.property &&
    node.callee.property.type === "Identifier"
  ) {
    return node.callee.property.name;
  }

  return null;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw error.message in notify/toast calls",
      category: "Security",
      recommended: true,
      url: "https://github.com/your-repo/eslint-rules/blob/main/docs/no-raw-error-in-notify.md",
    },
    messages: {
      noRawError:
        "Don't pass error.message to {{ functionName }}(). Use useSafeNotify().error(error) instead. " +
        "Raw error messages may expose technical details to users.",
    },
    hasSuggestions: false, // Auto-fix would require significant refactoring
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        const calleeName = getCalleeName(node);

        // Only check notify() and toast() calls
        if (!NOTIFY_FUNCTIONS.includes(calleeName)) return;

        // Check first argument (the message)
        const firstArg = node.arguments[0];
        if (!firstArg) return;

        if (argumentContainsErrorMessage(firstArg)) {
          context.report({
            node: firstArg,
            messageId: "noRawError",
            data: {
              functionName: calleeName,
            },
          });
        }
      },
    };
  },
};
