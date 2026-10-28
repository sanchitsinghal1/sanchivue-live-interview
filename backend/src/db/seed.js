// src/db/seed.js
// Auto-seed: 1 demo organization "Sanchivue Demo", 1 interviewer, 1 candidate,
// and 5 classic DSA questions. Reuses the question content from the existing
// Next.js demo at /home/z/my-project/src/lib/seed.ts (ported to pure JS).
import { APP_NAME, CREATOR, USER_ROLES, ORG_ROLES } from '../config/constants.js';
import User from '../models/user.model.js';
import Organization from '../models/organization.model.js';
import OrganizationMember from '../models/organizationMember.model.js';
import Question from '../models/question.model.js';

// Demo question bank — exactly the 5 from the Next.js seed.
const SEED_QUESTIONS = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Arrays', 'Hashing'],
    statement:
      'Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice. The answer can be returned in any order.',
    constraints:
      '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(N)',
    starterCode: {
      javascript:
        '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Hint: a hash map of value -> index gives O(N) time.\n  \n}',
      python: 'class Solution:\n    def twoSum(self, nums, target):\n        pass',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '[[2,7,11,15],9]', expectedOutput: '[0,1]', explanation: 'nums[0]+nums[1]=9' },
      { input: '[[3,2,4],6]', expectedOutput: '[1,2]' },
    ],
    hiddenTests: [
      { input: '[[3,3],6]', expectedOutput: '[0,1]', weight: 1 },
      { input: '[[1,5,8,12,13],21]', expectedOutput: '[2,3]', weight: 1 },
      { input: '[[0,4,3,0],0]', expectedOutput: '[0,3]', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'Strings'],
    statement:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**.\n\nA string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(N)',
    starterCode: {
      javascript:
        '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // A stack is the natural structure here.\n  \n}',
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '["()"]', expectedOutput: 'true' },
      { input: '["()[]{}"]', expectedOutput: 'true' },
    ],
    hiddenTests: [
      { input: '["(]"]', expectedOutput: 'false', weight: 1 },
      { input: '["([)]"]', expectedOutput: 'false', weight: 1 },
      { input: '["{[]}"]', expectedOutput: 'true', weight: 1 },
      { input: '[""]', expectedOutput: 'true', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    tags: ['Arrays', 'Sorting'],
    statement:
      'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: 'Since [1,3] and [2,6] overlap, merge them to [1,6].',
      },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    optimalTime: 'O(N log N)',
    optimalSpace: 'O(N)',
    starterCode: {
      javascript:
        '/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  // Sort by start, then walk and merge.\n  \n}',
      python: 'class Solution:\n    def merge(self, intervals):\n        pass',
      java: 'class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '[[[1,3],[2,6],[8,10],[15,18]]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[[1,4],[4,5]]]', expectedOutput: '[[1,5]]' },
    ],
    hiddenTests: [
      { input: '[[[1,4],[0,4]]]', expectedOutput: '[[0,4]]', weight: 1 },
      { input: '[[[1,4],[2,3]]]', expectedOutput: '[[1,4]]', weight: 1 },
      { input: '[[]]', expectedOutput: '[]', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    tags: ['Design', 'Hashing', 'Linked List'],
    statement:
      'Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.\n\nImplement the `LRUCache` class:\n- `LRUCache(capacity)` initializes the cache with positive size `capacity`.\n- `get(key)` returns the value of the `key` if it exists, otherwise `-1`.\n- `put(key, value)` updates the value if the key exists, otherwise inserts it. When the cache reaches capacity, evict the least recently used key.',
    constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\nget and put run in O(1) average time.',
    examples: [
      {
        input: '["LRUCache","put","put","get","put","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2]]',
        output: '[null,null,null,1,null,-1]',
      },
    ],
    optimalTime: 'O(1)',
    optimalSpace: 'O(capacity)',
    starterCode: {
      javascript:
        '/**\n * @param {number} capacity\n */\nfunction LRUCache(capacity) {\n  // Combine a Map (insertion-ordered) with manual eviction.\n  \n}\n/**\n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n  \n};\n/**\n * @param {number} key\n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n  \n};',
      python:
        'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        pass\n    def put(self, key: int, value: int) -> None:\n        pass',
      java: 'class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    public int get(int key) {\n        \n    }\n    public void put(int key, int value) {\n        \n    }\n}',
      cpp: 'class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    int get(int key) {\n        \n    }\n    void put(int key, int value) {\n        \n    }\n};',
    },
    publicTests: [{ input: '["LRUCache","put","put","get"]', expectedOutput: '1' }],
    hiddenTests: [
      { input: '["LRUCache","put","put","get","put","get"]', expectedOutput: '-1', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['Sliding Window', 'Strings', 'Hashing'],
    statement:
      'Given a string `s`, find the length of the **longest substring** without repeating characters.',
    constraints:
      '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols, and spaces.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: "The answer is 'abc', with length 3." },
      { input: 's = "bbbbb"', output: '1' },
      { input: 's = "pwwkew"', output: '3', explanation: "The answer is 'wke', with length 3." },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(min(N, charset))',
    starterCode: {
      javascript:
        '/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Sliding window with a Set/Map of seen characters.\n  \n}',
      python:
        'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass',
      java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '["abcabcbb"]', expectedOutput: '3' },
      { input: '["bbbbb"]', expectedOutput: '1' },
    ],
    hiddenTests: [
      { input: '["pwwkew"]', expectedOutput: '3', weight: 1 },
      { input: '[""]', expectedOutput: '0', weight: 1 },
      { input: '[" "]', expectedOutput: '1', weight: 1 },
      { input: '["dvdf"]', expectedOutput: '3', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },

  // ====================================================================
  // === EXPANDED QUESTION LIBRARY (v2) — ~52 questions across 16 categories ===
  // ====================================================================
  // The 5 original DSA questions above (Two Sum, Valid Parentheses, Merge
  // Intervals, LRU Cache, Longest Substring Without Repeating Characters) are
  // preserved unchanged. The 47 additions below cover: DSA (3), JavaScript (4),
  // React (4), Node.js (3), Express (2), MongoDB (3), REST APIs (2),
  // Authentication (3), Debugging (3), Testing (2), System Design (4),
  // Scalability (2), Security (3), Architecture (2), Behavioral (4),
  // Project-based (3).
  //
  // Non-coding (discussion) questions use `allowedLanguages: []` and embed an
  // "Evaluation criteria:" rubric in the statement instead of publicTests/
  // hiddenTests. The seed runner honors `q.allowedLanguages` (falling back to
  // the 4-language default) so these discussion questions correctly disable
  // code submission in the UI.

  // ----------------------------------------------------------------------
  // DSA — 3 more classic problems (original 5 preserved above)
  // ----------------------------------------------------------------------

  {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    tags: ['Linked List', 'Pointers'],
    statement: `Given the \`head\` of a singly linked list, reverse the list and return the new head.

For this runner the list is serialized as a JavaScript array (e.g. \`[1,2,3,4,5]\`); your function receives that array and should return the reversed array.`,
    constraints: '0 <= list length <= 5000\n-5000 <= node value <= 5000',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(1) iterative',
    starterCode: {
      javascript:
        '/**\n * @param {number[]} head\n * @return {number[]}\n */\nfunction reverseList(head) {\n  // Hint: walk with prev/curr pointers, or just reverse the array in place.\n  \n}',
      python: 'class Solution:\n    def reverseList(self, head):\n        pass',
      java: 'class Solution {\n    public int[] reverseList(int[] head) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '[[1,2,3,4,5]]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[[1,2]]', expectedOutput: '[2,1]' },
    ],
    hiddenTests: [
      { input: '[[]]', expectedOutput: '[]', weight: 1 },
      { input: '[[1]]', expectedOutput: '[1]', weight: 1 },
      { input: '[[1,2,3]]', expectedOutput: '[3,2,1]', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    tags: ['Trees', 'BFS', 'Queue'],
    statement: `Given the \`root\` of a binary tree, return the level order traversal of its nodes' values (left to right, level by level).

For this runner the tree is serialized as a level-order array where \`null\` marks a missing node (e.g. \`[3,9,20,null,null,15,7]\`). The output is a 2D array with one inner array per level.`,
    constraints: '0 <= number of nodes <= 2000\n-1000 <= node value <= 1000',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'Level 0 is [3]; level 1 is [9,20]; level 2 is [15,7].' },
      { input: 'root = [1]', output: '[[1]]' },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(N)',
    starterCode: {
      javascript:
        '/**\n * @param {Array<number|null>} root\n * @return {number[][]}\n */\nfunction levelOrder(root) {\n  // Hint: BFS with a queue; track level boundaries.\n  \n}',
      python: 'class Solution:\n    def levelOrder(self, root):\n        pass',
      java: 'class Solution {\n    public List<List<Integer>> levelOrder(Integer[] root) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<vector<int>> levelOrder(vector<int>& root) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '[[3,9,20,null,null,15,7]]', expectedOutput: '[[3],[9,20],[15,7]]' },
      { input: '[[1]]', expectedOutput: '[[1]]' },
    ],
    hiddenTests: [
      { input: '[[]]', expectedOutput: '[]', weight: 1 },
      { input: '[[1,2,3,4,5]]', expectedOutput: '[[1],[2,3],[4,5]]', weight: 1 },
      { input: '[[1,null,2,null,3]]', expectedOutput: '[[1],[2],[3]]', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math', 'Fibonacci'],
    statement: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
    constraints: '1 <= n <= 45',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'Two ways: 1+1, or 2.' },
      { input: 'n = 3', output: '3', explanation: 'Three ways: 1+1+1, 1+2, or 2+1.' },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(1)',
    starterCode: {
      javascript:
        '/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  // Hint: Fibonacci. Two rolling variables beat a full DP array.\n  \n}',
      python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}',
      cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};',
    },
    publicTests: [
      { input: '[2]', expectedOutput: '2' },
      { input: '[3]', expectedOutput: '3' },
    ],
    hiddenTests: [
      { input: '[1]', expectedOutput: '1', weight: 1 },
      { input: '[4]', expectedOutput: '5', weight: 1 },
      { input: '[5]', expectedOutput: '8', weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },

  // ----------------------------------------------------------------------
  // JavaScript — 4 conceptual questions (no auto-tests)
  // ----------------------------------------------------------------------

  {
    slug: 'javascript-closures',
    title: 'JavaScript Closures',
    difficulty: 'Medium',
    tags: ['Closures', 'JavaScript', 'Scope'],
    statement: `Explain what a closure is in JavaScript and why the language relies on them so heavily.

Cover the following in your answer:

1. The formal definition: a function bundled with references to its surrounding lexical scope.
2. A concrete code example demonstrating closure behavior. The classic counter factory works well:

    function makeCounter() {
      let count = 0;
      return {
        increment: () => ++count,
        value: () => count,
      };
    }
    const c = makeCounter();
    c.increment();
    c.increment();
    console.log(c.value()); // 2

3. Real-world uses: data privacy/encapsulation (no class fields needed), function factories, partial application / currying, and React hooks (which capture render-scope variables).
4. The "closure in a loop" pitfall when using \`var\` (all callbacks share the same \`i\`), and how block-scoped \`let\` (or an IIFE) fixes it.
5. Memory implications: closures retain references to scope chains, so event listeners and timers must be cleaned up to avoid leaks.

Be prepared to explain why a closure captures the live binding to a variable, not a snapshot of its value at definition time.

Evaluation criteria:
- Correctly identifies that a closure captures the live binding (variable), not a snapshot value.
- Provides at least one compelling use case (data privacy, currying, event-handler cleanup).
- Explains the var-in-loop pitfall and how let/IIFE resolve it.
- Mentions memory-retention risk (timers, listeners) and how to mitigate it.`,
    allowedLanguages: [],
  },
  {
    slug: 'javascript-event-loop',
    title: 'JavaScript Event Loop (Microtasks vs Macrotasks)',
    difficulty: 'Medium',
    tags: ['Event Loop', 'JavaScript', 'Async'],
    statement: `Walk through what the following snippet logs and explain the order using the JavaScript event loop model.

    console.log(1);
    setTimeout(() => console.log(2), 0);
    Promise.resolve().then(() => console.log(3));
    console.log(4);

Expected output: \`1, 4, 3, 2\`.

In your explanation, address:

1. Why synchronous code (1, 4) runs first.
2. Why the Promise (3) runs before the setTimeout (2) even though both have zero delay — i.e. the microtask queue drains completely before the next macrotask.
3. The distinction between the call stack, the microtask queue (Promise.then, queueMicrotask, MutationObserver), and the macrotask queue (setTimeout, setInterval, I/O, setImmediate in Node).
4. How \`async/await\` desugars to Promise chains and therefore schedules continuations as microtasks.
5. Node.js specifics: \`process.nextTick\` runs before Promise microtasks; \`setImmediate\` vs \`setTimeout(0)\` ordering depends on the phase.

Evaluation criteria:
- Correctly predicts the output order 1, 4, 3, 2.
- Distinguishes microtasks (Promises, nextTick) from macrotasks (timers, I/O).
- Explains that the microtask queue is fully drained between each macrotask.
- Mentions async/await desugaring and the Node.js process.nextTick priority.`,
    allowedLanguages: [],
  },
  {
    slug: 'javascript-hoisting',
    title: 'JavaScript Hoisting (var, let, const, function)',
    difficulty: 'Easy',
    tags: ['Hoisting', 'JavaScript', 'Scope'],
    statement: `Explain hoisting in JavaScript and predict the output (or error) of each snippet below.

Snippet A:

    console.log(a);
    var a = 5;

Snippet B:

    console.log(b);
    let b = 5;

Snippet C:

    sayHi();
    function sayHi() { console.log("hi"); }

Snippet D:

    sayBye();
    const sayBye = () => console.log("bye");

In your answer, cover:

1. What "hoisting" actually is: the engine allocates bindings during a compile pass before executing the code line by line. The behavior differs by declaration kind.
2. \`var\` declarations are hoisted and initialized to \`undefined\`; accessing them before the assignment line yields \`undefined\` (not an error).
3. \`let\` and \`const\` are hoisted but remain in the temporal dead zone (TDZ) until the declaration line is reached; accessing them early throws \`ReferenceError\`.
4. Function declarations are fully hoisted (both binding and body) so they can be invoked before their definition line.
5. Function expressions (including arrow functions assigned to const/let) follow the variable hoisting rules above — the body is NOT hoisted.
6. Why this matters: prefer \`let\`/\`const\` to surface bugs early; function declarations are fine for hoisting in modules but can hurt readability if overused.

Evaluation criteria:
- Identifies A logs undefined, B throws ReferenceError, C logs "hi", D throws ReferenceError.
- Explains TDZ for let/const.
- Distinguishes function declarations (hoisted with body) from function expressions (hoisted as variable only).
- Recommends const/let over var with reasoning.`,
    allowedLanguages: [],
  },
  {
    slug: 'javascript-this-binding',
    title: 'JavaScript `this` Binding Rules',
    difficulty: 'Medium',
    tags: ['this', 'JavaScript', 'Functions'],
    statement: `Explain the four rules that determine the value of \`this\` in a JavaScript function, plus how arrow functions differ.

For each rule, give a 2-3 line code example:

1. Default binding — \`this\` is the global object (or \`undefined\` in strict mode).
2. Implicit binding — \`this\` is the object before the dot when the method is called.
3. Explicit binding — \`call\`, \`apply\`, and \`bind\` set \`this\` directly.
4. \`new\` binding — \`this\` is the newly-constructed object.

Then cover:

5. Arrow functions: they have NO own \`this\`; they inherit \`this\` from the enclosing lexical scope. This makes them ideal for callbacks inside class methods (e.g. event handlers in React class components) but problematic as object methods (because they do not bind to the receiver).
6. Precedence: \`new\` > explicit (\`bind\`/\`call\`/\`apply\`) > implicit > default.
7. A common React pitfall: passing \`this.handleClick\` (unbound) to \`onClick\` loses \`this\`. Solutions: \`bind\` in the constructor, class field arrow syntax \`handleClick = () => {...}\`, or use function components with hooks (where this problem does not exist).

Evaluation criteria:
- Names all four rules with examples.
- Explains arrow functions inherit \`this\` lexically (no own binding).
- States the precedence order (new > explicit > implicit > default).
- Mentions the React class-component \`this\` pitfall and at least one fix.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // React — 4 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'react-use-effect-dependencies',
    title: 'React: useEffect Dependencies & Cleanup',
    difficulty: 'Medium',
    tags: ['useEffect', 'React', 'Hooks'],
    statement: `Explain how \`useEffect\` decides when to re-run, the role of the dependency array, and how cleanup functions work.

Cover:

1. The three dependency-array forms:
   - No array: effect runs after every render.
   - Empty array \`[]\`: effect runs once after mount; cleanup runs once on unmount.
   - Array with values \`[a, b]\`: effect runs after mount and whenever \`a\` or \`b\` change (shallow Object.is comparison); cleanup runs before the next effect and on unmount.
2. Why exhaustive-deps lint rule exists: omitting a dependency produces a stale closure over the old value, which is usually a bug.
3. Cleanup pattern for side effects (subscriptions, timers, listeners):

    useEffect(() => {
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, []);

4. The fetch-on-prop-change pattern (and the cancellation race):

    useEffect(() => {
      let cancelled = false;
      fetch(\`/api/\${id}\`).then(r => r.json()).then(data => {
        if (!cancelled) setResult(data);
      });
      return () => { cancelled = true; };
    }, [id]);

5. When to split effects vs combine them — one effect per independent side effect is usually cleaner.
6. Strict Mode double-invocation in development: effects run, clean up, then run again — your cleanup must be idempotent.

Evaluation criteria:
- Correctly distinguishes the three dependency-array forms.
- Explains stale closures and the exhaustive-deps lint rule.
- Shows a cleanup pattern for at least one resource type (timer, listener, subscription, fetch).
- Mentions Strict Mode double-invoke in development.`,
    allowedLanguages: [],
  },
  {
    slug: 'react-use-state-batching',
    title: 'React: useState Batching & Functional Updates',
    difficulty: 'Medium',
    tags: ['useState', 'React', 'Hooks'],
    statement: `Explain how React batches state updates, why functional updates matter, and predict the output of the snippets below.

Snippet A — multiple setState calls in an event handler:

    function Counter() {
      const [count, setCount] = useState(0);
      const handleClick = () => {
        setCount(count + 1);
        setCount(count + 1);
        setCount(count + 1);
      };
      return <button onClick={handleClick}>{count}</button>;
    }

After one click, \`count\` is \`1\`, not \`3\` — because all three calls read the same stale \`count\` value (0) and React batches them into one render using the last value.

Snippet B — functional updates fix it:

    const handleClick = () => {
      setCount(c => c + 1);
      setCount(c => c + 1);
      setCount(c => c + 1);
    };

After one click, \`count\` is \`3\`.

Cover:

1. Batching: React groups multiple setState calls into a single re-render. In React 18+ this is automatic for ALL updates (event handlers, timeouts, promises, native listeners).
2. Why \`setCount(count + 1)\` three times yields +1, not +3: each call schedules a state update with the same \`count\` snapshot, and only the last update "wins" within a batch (well, actually all three are queued but each sees the same closure value of \`count\`).
3. The functional update form \`setCount(prev => prev + 1)\` queues updates that chain off the latest in-progress state.
4. When you need the new state immediately after an update, use \`useEffect\` watching the state — never read the state right after \`setState\` synchronously.
5. Performance: functional updates let you avoid unnecessary dependencies in \`useCallback\` (you no longer need \`count\` in the deps array).

Evaluation criteria:
- Correctly predicts Snippet A yields 1 and Snippet B yields 3.
- Explains batching (automatic in React 18+).
- Distinguishes value-based updates from functional updates.
- Mentions that setState is async; reading state right after yields the old value.`,
    allowedLanguages: [],
  },
  {
    slug: 'react-reconciliation-keys',
    title: 'React Reconciliation & the Role of `key`',
    difficulty: 'Hard',
    tags: ['Reconciliation', 'React', 'Performance'],
    statement: `Explain React's reconciliation algorithm, why the \`key\` prop matters for list rendering, and what goes wrong when you use array indices as keys.

Cover:

1. The virtual DOM diff: React compares the previous and next render trees. To keep this O(N) it makes two assumptions: (a) different component types blow away the subtree, (b) it matches children by \`key\` (falling back to position if \`key\` is absent).
2. Why \`key\` matters: when list order changes (sort, insert at head, remove middle), position-based matching reuses the wrong DOM nodes, causing subtle bugs:
   - Controlled inputs (text fields) end up bound to the wrong item.
   - Animations glitch because transitions fire on mismatched nodes.
   - Local component state "follows" the wrong item.
3. Why array indices as keys are dangerous: any reordering causes index-keyed items to "become" different items from React's perspective only when content changes, which produces the bugs above.
4. Stable, unique keys: use a database ID or other stable identifier from your data. If items are truly static (never reordered/inserted), index keys are acceptable.
5. Avoid \`Math.random()\` keys — they regenerate every render and force React to treat every item as new (destroys reuse and triggers remounts).
6. How reconciliation interacts with \`memo\`: a stable \`key\` alone is not enough; referential prop equality (\`useMemo\`, \`useCallback\`) is also required to skip child re-renders.

Evaluation criteria:
- Explains the O(N) heuristic diff and the two assumptions React makes.
- Identifies the failure mode of index-as-key (controlled inputs, animations, state following wrong item).
- Recommends stable unique IDs (DB id).
- Mentions that \`memo\` needs referential equality, not just stable keys.`,
    allowedLanguages: [],
  },
  {
    slug: 'react-context-vs-prop-drilling',
    title: 'React Context vs Prop Drilling',
    difficulty: 'Easy',
    tags: ['Context', 'React', 'State'],
    statement: `Explain when to use the Context API versus passing props, and the trade-offs of each.

Cover:

1. Prop drilling: passing props through intermediate components that do not need the value themselves. Painful beyond 2-3 levels; refactors ripple through the tree.
2. Context API: declare a Context, provide a value at the top, consume via \`useContext\` anywhere below. Skips the intermediate layers.
3. When Context wins: theme, locale, authenticated user, feature flags — globally relevant, rarely changing values.
4. When Context loses: high-frequency updates (e.g. typing in a controlled input stored in context) — every consumer re-renders on every change. Prefer local state, refs, or state-management libraries (Zustand, Redux, Jotai) for that.
5. Performance: split contexts (e.g. \`ThemeContext\` + \`UserContext\`) so a change to one does not re-render consumers of the other. Also consider \`useMemo\` on the provider value to avoid re-renders from new object identities.
6. Composition alternative: pass elements via props (children-as-prop pattern) so intermediate components do not even know about the value.

Example Context skeleton:

    const ThemeContext = createContext("light");
    function App() {
      return (
        <ThemeContext.Provider value="dark">
          <Toolbar />
        </ThemeContext.Provider>
      );
    }
    function Toolbar() {
      const theme = useContext(ThemeContext);
      return <Button theme={theme} />;
    }

Evaluation criteria:
- Defines prop drilling and its scaling pain.
- Identifies good Context use cases (theme, user, locale) and bad ones (high-frequency state).
- Mentions re-render implications of context value identity (useMemo on provider value).
- Suggests splitting contexts or using a state library for high-churn state.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Node.js — 3 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'node-event-loop-phases',
    title: 'Node.js Event Loop Phases',
    difficulty: 'Hard',
    tags: ['Event Loop', 'Node.js', 'Internals'],
    statement: `Explain the phases of the Node.js event loop and predict the output order of:

    setImmediate(() => console.log("immediate"));
    setTimeout(() => console.log("timeout"), 0);
    Promise.resolve().then(() => console.log("promise"));
    process.nextTick(() => console.log("nextTick"));

Expected output: \`nextTick, promise, timeout, immediate\` (or \`nextTick, promise, immediate, timeout\` depending on the loop phase when the script starts — the I/O callback ordering of \`setImmediate\` vs \`setTimeout(0)\` is non-deterministic at script start).

Cover:

1. The libuv loop phases (in order): timers → pending callbacks → idle/prepare → poll → check → close callbacks. After each phase, microtasks (Promise.then) and process.nextTick are drained — nextTick runs BEFORE Promise microtasks.
2. Timers phase: runs callbacks for setTimeout/setInterval whose thresholds have elapsed.
3. Poll phase: retrieves new I/O events; will block here if waiting for I/O and no timers are due.
4. Check phase: runs setImmediate callbacks.
5. Why \`setImmediate\` vs \`setTimeout(0)\` ordering is phase-dependent: inside an I/O cycle, setImmediate always fires first; at script start, it depends on process performance.
6. The microtask queue (Promises) and nextTick queue drain between every phase and after every macrotask.
7. Blocking the event loop: a synchronous computation longer than ~100ms starves timers and I/O — workers/cluster or offloading to native threads is the fix.

Evaluation criteria:
- Names the libuv phases in order (timers, pending, poll, check, close).
- Explains nextTick vs microtask vs macrotask priority.
- Notes that setImmediate vs setTimeout(0) ordering is phase-dependent.
- Mentions the impact of blocking the loop on timers and I/O.`,
    allowedLanguages: [],
  },
  {
    slug: 'node-streams-backpressure',
    title: 'Node.js Streams & Backpressure',
    difficulty: 'Medium',
    tags: ['Streams', 'Node.js', 'Backpressure'],
    statement: `Explain Node.js streams (Readable, Writable, Duplex, Transform) and how backpressure works.

Cover:

1. The four stream types:
   - Readable: data source (fs.createReadStream, HTTP incoming, process.stdin).
   - Writable: data sink (fs.createWriteStream, HTTP outgoing, process.stdout).
   - Duplex: both readable and writable (TCP sockets).
   - Transform: a Duplex that transforms input to output (zlib, crypto streams).
2. Two consumption modes: data-event mode (\`stream.on("data", chunk => ...)\`) and paused mode (\`stream.read()\`, or async iteration \`for await (const chunk of stream)\`).
3. Piping and pipeline:

    import { pipeline } from "node:stream/promises";
    await pipeline(
      fs.createReadStream("input.txt"),
      zlib.createGzip(),
      fs.createWriteStream("output.txt.gz"),
    );

4. Backpressure: a fast producer feeding a slow consumer fills the internal buffer. The Writable's \`write()\` returns \`false\` to signal "stop sending me data"; the Readable should pause until \`"drain"\` fires. \`pipeline()\` and \`pipe()\` handle this automatically; manual plumbing often forgets to.
5. Memory leak: ignoring backpressure causes the internal Buffer to grow unbounded until heap exhaustion.
6. Error handling: \`pipeline\` properly destroys all streams and forwards errors; \`stream.pipe(dest)\` does not — always use \`pipeline\` (or \`{ end: true }\` + error listeners).

Evaluation criteria:
- Names the four stream types.
- Explains backpressure (write() returns false, wait for drain).
- Recommends pipeline() over pipe() with reasoning (error propagation, cleanup).
- Identifies the unbounded-buffer memory risk when backpressure is ignored.`,
    allowedLanguages: [],
  },
  {
    slug: 'node-modules-async-patterns',
    title: 'Node.js Modules & Async Patterns (Promise.all vs allSettled)',
    difficulty: 'Medium',
    tags: ['Modules', 'Node.js', 'Async'],
    statement: `Compare CommonJS and ES Modules in Node.js, and explain when to use Promise.all vs Promise.allSettled vs Promise.race vs Promise.any.

Part 1 — Modules:

1. CommonJS (require/module.exports): synchronous, default in .js files without \`"type": "module"\`.
2. ESM (import/export): asynchronous, statically analyzable (tree-shaking), supports top-level await, default in .mjs files or when package.json has \`"type": "module"\`.
3. Interop caveats: importing CommonJS into ESM gives the module.exports as the default export; named imports from CommonJS work only via static analysis heuristics.
4. Recommendation for new Node projects: ESM (better tooling, tree-shaking, top-level await).

Part 2 — Async patterns:

1. \`Promise.all([p1, p2, p3])\`: waits for ALL to resolve; rejects immediately on the FIRST rejection (short-circuit). Use when all must succeed.
2. \`Promise.allSettled([p1, p2, p3])\`: waits for ALL to settle; never rejects. Returns \`[{status, value} | {status, reason}]\`. Use when you want every result, even failures (e.g. bulk API calls where partial success is acceptable).
3. \`Promise.race([p1, p2, p3])\`: settles as soon as the FIRST promise settles (resolve OR reject). Use for timeouts (\`Promise.race([fetch(url), timeout(5000)])\`).
4. \`Promise.any([p1, p2, p3])\`: resolves as soon as the FIRST promise RESOLVES; rejects only if ALL reject (with an AggregateError). Use when any one of several mirrors suffices.
5. Concurrency control: \`Promise.all\` runs all promises concurrently. For >100 concurrent ops, batch with a pool (p-limit) to avoid resource exhaustion.

Evaluation criteria:
- Distinguishes CommonJS (sync, require) from ESM (async, import, static analysis).
- Correctly differentiates Promise.all vs allSettled vs race vs any.
- Notes the short-circuit behavior of Promise.all (reject on first).
- Mentions concurrency control for large batches.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Express — 2 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'express-middleware-error-handling',
    title: 'Express: Middleware Order & Error Handling',
    difficulty: 'Medium',
    tags: ['Middleware', 'Express', 'Error Handling'],
    statement: `Explain the Express middleware pipeline, why order matters, and how error-handling middleware differs from regular middleware.

Cover:

1. Middleware signature: \`(req, res, next) => { ... }\`. Each middleware receives the request, can mutate \`req\`/\`res\`, and either calls \`next()\` to continue the pipeline or ends the response (\`res.send\`, \`res.json\`).
2. Order is everything: middleware registered first runs first. A 404 handler registered before your routes will swallow every request.
3. Common pipeline order:
   - Body parsers (express.json, express.urlencoded).
   - Security (helmet, cors, rate limiter).
   - Logging (morgan).
   - Auth (JWT verify).
   - Routes (app.use("/api", router)).
   - 404 handler (catches unmatched routes).
   - Error handler (last).
4. Error-handling middleware has a 4-arg signature \`(err, req, res, next)\`. Express identifies it by arity — must be registered LAST and after all routes.
5. \`next(err)\` forwards to the error handler; throwing inside an async route handler does NOT automatically forward unless you wrap with \`express-async-handler\` or use Express 5's built-in async support.
6. The error handler should: log the error, send a sanitized message (never leak the stack to clients in production), and set the right status code.

Example skeleton:

    app.use(express.json());
    app.use("/api/users", usersRouter);
    app.use((req, res) => res.status(404).json({ error: "Not found" }));
    app.use((err, req, res, _next) => {
      console.error(err);
      res.status(err.status || 500).json({ error: err.message || "Server error" });
    });

Evaluation criteria:
- Explains the next() pipeline and why order matters.
- Distinguishes error-handling middleware by the 4-arg signature.
- Notes that throwing inside async handlers needs wrapping (Express 4 caveat).
- Recommends logging + sanitized client messages in production.`,
    allowedLanguages: [],
  },
  {
    slug: 'express-router-modularization',
    title: 'Express: Router Modularization & Route Params',
    difficulty: 'Easy',
    tags: ['Router', 'Express', 'Routing'],
    statement: `Explain how to split an Express app into multiple routers and the difference between route params (\`:id\`), query params (\`?q=...\`), and body params.

Cover:

1. \`express.Router()\` creates a mini-app you can mount at a path:

    // routes/users.js
    import { Router } from "express";
    const router = Router();
    router.get("/", listUsers);
    router.get("/:id", getUser);
    router.post("/", createUser);
    export default router;

    // app.js
    import usersRouter from "./routes/users.js";
    app.use("/api/users", usersRouter);

2. Route params (\`:id\`) — required path segments, available as \`req.params.id\`. Use for identifying a specific resource.
3. Query params (\`?q=...&page=2\`) — optional key-value pairs after \`?\`, available as \`req.query\`. Use for filtering, sorting, pagination.
4. Body params — sent in the request body (JSON, form-encoded), available as \`req.body\` after the body-parser middleware runs. Use for create/update payloads.
5. Route naming conventions: plural nouns for collections (\`/api/users\`), use the resource ID for specific items (\`/api/users/:id\`), nest for sub-resources (\`/api/users/:id/posts\`).
6. Param validation: use a library like zod or express-validator to validate \`req.params.id\` is a UUID, \`req.query.page\` is an integer, \`req.body.email\` is an email — never trust client input.

Evaluation criteria:
- Shows Router mounting pattern (mini-app at a path).
- Distinguishes params vs query vs body and when to use each.
- Recommends RESTful naming (plural nouns, nested sub-resources).
- Mentions input validation (zod, express-validator) and never trusting client input.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // MongoDB — 3 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'mongodb-indexing-esr-rule',
    title: 'MongoDB Indexing & the ESR Rule',
    difficulty: 'Medium',
    tags: ['Indexing', 'MongoDB', 'Performance'],
    statement: `Explain compound indexes in MongoDB, the ESR (Equality, Sort, Range) rule for index field ordering, and how to read an explain() plan.

Cover:

1. Single-field indexes: \`db.users.createIndex({ email: 1 })\` — supports exact-match queries on \`email\` and range scans.
2. Compound indexes: \`db.users.createIndex({ status: 1, createdAt: -1 })\` — a single B-tree over multiple fields. The ORDER of fields matters.
3. The ESR rule — order fields in a compound index as:
   - Equality first (exact match fields: \`{ status: "active" }\`).
   - Sort next (fields used in \`.sort()\` matching index direction).
   - Range last (fields with $gt, $lt, $in with multiple values).
4. Why ESR: an index can be used for equality on field A, then sort on field B (using the index ordering, no in-memory sort), then range scan on field C. Reordering (e.g. Range before Equality) usually makes the index unusable for that query.
5. Index prefix: an index on \`{a, b, c}\` can serve queries on \`{a}\`, \`{a, b}\`, \`{a, b, c}\` but NOT \`{b, c}\` alone.
6. \`db.users.find({ status: "active" }).sort({ createdAt: -1 }).explain("executionStats")\` — look for \`executionStats.totalDocsExamined\` (should be small, not a full collection scan) and \`winningPlan.stage === "IXSCAN"\` (index scan, not \`COLLSCAN\`).
7. Trade-offs: indexes speed up reads but slow down writes (each index adds a B-tree update on insert/update/delete). Do not over-index OLTP tables.

Evaluation criteria:
- Explains the ESR rule (Equality then Sort then Range).
- Mentions index prefix support ({a,b,c} serves {a}, {a,b}).
- Knows how to read explain() (IXSCAN vs COLLSCAN, totalDocsExamined).
- Notes the write-cost trade-off.`,
    allowedLanguages: [],
  },
  {
    slug: 'mongodb-aggregation-pipeline',
    title: 'MongoDB Aggregation Pipeline',
    difficulty: 'Hard',
    tags: ['Aggregation Pipeline', 'MongoDB', 'Query'],
    statement: `Explain the MongoDB aggregation pipeline. Design a pipeline that returns, for each user, their total spend on completed orders in the last 30 days, sorted descending.

Schema:

    orders: { _id, userId, status: "pending"|"completed"|"cancelled", amount: Number, createdAt: Date }

Cover the key stages:

1. \`$match\` — filter early to reduce the working set. Filter status="completed" AND createdAt >= 30-days-ago. Putting $match first lets MongoDB use indexes.
2. \`$group\` — group by \`userId\`, accumulate \`$sum: "$amount"\`.
3. \`$sort\` — order by total descending.
4. \`$lookup\` (optional) — join with the users collection to enrich with name/email.
5. \`$project\` — shape the output (exclude internal fields).
6. \`$limit\` / \`$skip\` — for pagination.

Example pipeline:

    db.orders.aggregate([
      { $match: { status: "completed", createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      { $group: { _id: "$userId", totalSpend: { $sum: "$amount" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSpend: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, userId: "$_id", name: "$user.name", totalSpend: 1, orderCount: 1 } },
      { $limit: 100 }
    ]);

Performance considerations:
- $match first to leverage indexes.
- Avoid $lookup on large collections without indexes on the foreign field.
- $unwind on a multi-element array multiplies document count — consider $group with $push instead if you can avoid unwinding.
- Use \`allowDiskUse: true\` for pipelines exceeding the 100MB memory limit.

Evaluation criteria:
- Structures pipeline as $match then $group then $sort then (lookup) then $project.
- Uses $sum accumulator correctly.
- Notes the importance of $match-first for index usage.
- Mentions allowDiskUse for large pipelines.`,
    allowedLanguages: [],
  },
  {
    slug: 'mongodb-schema-design',
    title: 'MongoDB Schema Design: Embedding vs Referencing',
    difficulty: 'Medium',
    tags: ['Schema Design', 'MongoDB', 'Modeling'],
    statement: `Explain when to embed vs reference related data in MongoDB, and the trade-offs of each approach.

Cover:

1. Embedding: store related data as a nested array/sub-document inside the parent document.
   - Pros: single read returns everything; atomic updates within a document; no $lookup needed.
   - Cons: document grows unbounded (the 16MB BSON limit); duplicating data on every parent.
   - Best for: 1-to-few relationships (blog post + comments), data that is read together and rarely updated independently.
2. Referencing: store an ObjectId pointer to another collection.
   - Pros: no duplication, no document-size growth, independent updates.
   - Cons: requires $lookup or multiple queries; not atomic across documents (need transactions for multi-doc writes).
   - Best for: 1-to-many (a user has thousands of orders), many-to-many, or when the related data is updated independently.
3. The "favorites" pattern: for a user with 50 favorite products, embed just the IDs (small array of ObjectIds). For a user with 50,000 followers, reference — store the userId on each follower document.
4. The outlier pattern: if 99% of documents are small but 1% grow huge (e.g. a celebrity's follower list), cap the embedded array at N items and overflow to a separate collection.
5. Schema versioning: store a \`schemaVersion\` field so future migrations can detect old documents.
6. Access-pattern-driven design: in MongoDB you model for the queries, not for normalization. List the app's queries first, then design the schema to satisfy each in one round-trip if possible.

Evaluation criteria:
- Distinguishes embedding vs referencing with use cases.
- Notes the 16MB BSON limit and unbounded-array risk.
- Recommends modeling for access patterns, not normalization.
- Mentions at least one advanced pattern (bucket, outlier, polymorphic).`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // REST APIs — 2 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'rest-status-codes-design',
    title: 'REST API: Status Codes & Design Conventions',
    difficulty: 'Easy',
    tags: ['REST', 'HTTP', 'API Design'],
    statement: `Explain RESTful design conventions and the correct HTTP status codes for common scenarios.

Cover:

1. HTTP verbs and their semantics:
   - GET: read, must be safe (no side effects) and idempotent.
   - POST: create (or trigger an action), neither safe nor idempotent.
   - PUT: full replace at a known URI, idempotent.
   - PATCH: partial update, generally idempotent.
   - DELETE: remove, idempotent.
2. Resource naming: plural nouns (\`/api/users\`, \`/api/orders\`), use IDs for specific resources (\`/api/users/42\`), nest sub-resources (\`/api/users/42/orders\`).
3. Status code families:
   - 2xx success: 200 OK (general), 201 Created (POST that created a resource, with Location header), 204 No Content (DELETE/PUT with no body).
   - 3xx redirect: 301 permanent, 304 Not Modified (cache hit).
   - 4xx client errors: 400 Bad Request (validation), 401 Unauthorized (no/failed auth), 403 Forbidden (authenticated but not allowed), 404 Not Found, 409 Conflict (duplicate), 422 Unprocessable Entity (semantic validation failure), 429 Too Many Requests (rate limit).
   - 5xx server errors: 500 Internal Server Error (bug), 502 Bad Gateway, 503 Service Unavailable (down for maintenance), 504 Gateway Timeout.
4. The idempotency-key header: clients send a UUID so retries (e.g. network blip on POST) do not create duplicate resources.
5. Error response shape: consistent JSON envelope like \`{ error: { code: "VALIDATION_FAILED", message: "...", details: [...] } }\`.
6. Versioning: prefix routes with \`/v1/\` so breaking changes can ship in \`/v2/\` without stranding old clients.

Evaluation criteria:
- Maps verbs to semantics (GET safe+idempotent, POST neither, PUT/DELETE idempotent).
- Lists correct 2xx, 4xx, 5xx codes for common cases (201 Created, 401 vs 403, 409 Conflict, 429).
- Recommends consistent error envelope.
- Mentions versioning and idempotency keys.`,
    allowedLanguages: [],
  },
  {
    slug: 'rest-pagination-versioning',
    title: 'REST API: Pagination & Versioning Strategies',
    difficulty: 'Medium',
    tags: ['Pagination', 'REST', 'API Design'],
    statement: `Compare offset-based vs cursor-based pagination, and explain three API-versioning strategies.

Part 1 — Pagination:

1. Offset/limit: \`?page=3&pageSize=20\` (or \`?offset=40&limit=20\`). Simple, allows jumping to arbitrary pages. Cons: skips N rows on each query (deep pagination is slow on SQL); if items are inserted/deleted between requests, pages drift (items appear twice or are skipped).
2. Cursor: \`?cursor=abc123&limit=20\`. The cursor encodes the last-seen position (e.g. \`{createdAt: "2025-01-01T...", id: "..."}\`). Next page fetches rows after the cursor using a sorted index. Pros: stable under inserts/deletes, consistent O(limit) query cost. Cons: no jumping to page N; clients must walk pages in order.
3. When to use which: offset for admin UIs with explicit page numbers; cursor for infinite scrolls and high-write feeds.
4. Response envelope: include \`nextCursor\` (or null at the end) and optionally \`hasMore\`. Do not expose internal row offsets.

Part 2 — Versioning:

1. URI versioning: \`/v1/users\`, \`/v2/users\`. Most visible, easy to route, cache-friendly. Downside: clutters the URL.
2. Header versioning: \`Accept: application/vnd.myapi.v2+json\`. Keeps URLs clean. Downside: harder to test in a browser, less discoverable.
3. Query param: \`?version=2\`. Easy. Downside: easy to forget, breaks caching.
4. Recommendation: URI versioning (\`/v1/\`) for most public APIs — explicit and easy to consume.

Evaluation criteria:
- Distinguishes offset vs cursor pagination with trade-offs (drift, deep-page performance, stable under writes).
- Recommends cursor for infinite scroll / high-write feeds.
- Names the three versioning strategies and recommends URI versioning for public APIs.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Authentication — 3 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'auth-jwt-vs-sessions',
    title: 'Authentication: JWT vs Sessions',
    difficulty: 'Medium',
    tags: ['JWT', 'Authentication', 'Sessions'],
    statement: `Compare JWT-based and session-based authentication. Explain when to use each and the role of refresh tokens.

Cover:

1. Session-based auth: server stores session state (in memory or a session store like Redis); client holds a session ID in an httpOnly, Secure, SameSite cookie. Each request re-validates the session server-side.
   - Pros: easy to revoke (delete the session); stateful server knows exactly who is logged in.
   - Cons: requires server-side session store (hard to scale horizontally without shared store); not friendly to mobile/native clients.
2. JWT-based auth: server signs a token containing claims (userId, role, exp) and the client stores it (localStorage or httpOnly cookie). Each request sends the token; server verifies the signature.
   - Pros: stateless (no session store), works across services, easy to share between domains.
   - Cons: hard to revoke before expiry (no server-side state); larger payload than a session ID; vulnerable if stored in localStorage (XSS can steal it).
3. Refresh tokens: short-lived access tokens (15 min) + long-lived refresh tokens (days/weeks). The access token limits the blast radius of theft; the refresh token is stored more securely (httpOnly cookie) and rotated on each use.
4. The recommended hybrid for web apps: store both access and refresh tokens in httpOnly Secure SameSite cookies — protects against XSS theft; server can revoke refresh tokens.
5. Critical JWT hygiene: never put sensitive data in the payload (it is base64, not encrypted); always set a short \`exp\`; use a strong signing key (256-bit+ for HS256, or RS256/ES256 for asymmetric); validate \`alg\`, \`exp\`, \`iss\`, \`aud\` on every request.
6. Logout with JWT: blacklist the token's \`jti\` (JWT ID) in a Redis set with TTL until natural expiry — only way to "revoke" a JWT before it expires.

Evaluation criteria:
- Distinguishes stateful sessions vs stateless JWTs.
- Explains refresh tokens (short access + long refresh, rotation).
- Recommends httpOnly cookies over localStorage for token storage (XSS protection).
- Mentions JWT hygiene (alg validation, short exp, jti blacklist for logout).`,
    allowedLanguages: [],
  },
  {
    slug: 'auth-password-hashing',
    title: 'Authentication: Password Hashing (bcrypt, salting, timing attacks)',
    difficulty: 'Medium',
    tags: ['Password Hashing', 'Authentication', 'Security'],
    statement: `Explain how to store user passwords safely. Cover hashing algorithms, salting, work factors, and timing attacks.

Cover:

1. Never store plaintext passwords. Never store reversible encryption (you do not need to recover the password, only verify it).
2. Use a slow, salted hash: bcrypt, scrypt, argon2id, or PBKDF2. These are designed to be slow (milliseconds per hash) so brute-force is infeasible. Avoid MD5/SHA-1/SHA-256 alone — they are too fast.
3. Salt: a per-password random value combined with the password before hashing. Prevents rainbow-table attacks (two users with the same password get different hashes). bcrypt generates and embeds the salt in the output string automatically.
4. Work factor / cost: bcrypt takes a cost parameter (e.g. 12). Each increment doubles the compute time. Tune so a single hash takes ~250ms on your server hardware. Re-hash on login if the cost has been raised ("rehash on upgrade").
5. Password verification flow:
   - User submits password.
   - Server fetches the stored hash.
   - bcrypt.compare(submitted, stored) — constant-time comparison.
   - On success, issue session/JWT; on failure, return a generic "invalid credentials" (do not reveal whether the username exists).
6. Timing attacks: always return "invalid credentials" with the same response time whether the username exists or not. For a missing user, run a dummy bcrypt.compare against a precomputed hash to equalize timing.
7. Rate-limit / lockout: cap failed attempts per IP/username (e.g. 10/min) to slow brute-force.
8. Breached-password check: reject passwords found in known breach lists (Have I Been Pwned API) at signup.

Evaluation criteria:
- Recommends bcrypt/scrypt/argon2id; explicitly rejects MD5/SHA alone.
- Explains salt purpose (rainbow tables) and that bcrypt embeds it.
- Mentions work factor tuning (~250ms) and rehash-on-upgrade.
- Notes timing-attack mitigation (constant-time compare, dummy hash for missing users, generic error message).`,
    allowedLanguages: [],
  },
  {
    slug: 'auth-oauth-flows',
    title: 'Authentication: OAuth 2.0 Flows (Auth Code, PKCE, Client Credentials)',
    difficulty: 'Hard',
    tags: ['OAuth', 'Authentication', 'Security'],
    statement: `Explain the OAuth 2.0 Authorization Code flow, why PKCE is required for SPAs/mobile, and the Client Credentials flow for service-to-service auth.

Cover:

1. Roles: Resource Owner (user), Client (app), Authorization Server (issues tokens), Resource Server (API being accessed).
2. Authorization Code flow (web app with a backend):
   - User clicks "Login with X", redirected to \`/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&state=...\`.
   - User consents; auth server redirects back to \`redirect_uri?code=XYZ&state=...\`.
   - Client backend POSTs to \`/token\` with \`code + client_id + client_secret\`, receives \`access_token\` (and optional \`refresh_token\`).
   - The \`state\` param prevents CSRF.
3. Why PKCE (Proof Key for Code Exchange) for SPAs/mobile (no backend to hold a secret):
   - Client generates a random \`code_verifier\` and its SHA-256 hash \`code_challenge\`.
   - Auth request includes \`code_challenge\` + \`code_challenge_method=S256\`.
   - Token exchange includes \`code_verifier\`.
   - Auth server hashes the verifier and compares to the challenge — an attacker who intercepts the \`code\` (e.g. via a malicious redirect_uri) cannot redeem it without the verifier.
4. Client Credentials flow (machine-to-machine):
   - No user involvement. Client POSTs \`client_id + client_secret + grant_type=client_credentials\` to \`/token\`.
   - Receives an access token scoped to the client's permissions.
   - Used by backend services calling other backend services.
5. Implicit flow (\`response_type=token\`) is DEPRECATED — never use it. SPAs should use Auth Code + PKCE.
6. Token security: access tokens in Authorization header (not URL), short-lived (15 min); refresh tokens in httpOnly cookies, rotated on use.
7. OIDC (OpenID Connect) layers an \`id_token\` (JWT with user identity claims) on top of OAuth2 for authentication (vs. just authorization).

Evaluation criteria:
- Walks through the Auth Code flow with the state param (CSRF).
- Explains PKCE and why SPAs/mobile need it (no client secret).
- Distinguishes Client Credentials flow for M2M.
- Notes Implicit flow is deprecated; recommends Auth Code + PKCE for SPAs.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Debugging — 3 find-the-bug questions (runnable, JavaScript-only)
  // Each starterCode contains a buggy implementation the candidate must fix;
  // publicTests verify the corrected behavior.
  // ----------------------------------------------------------------------

  {
    slug: 'debug-closure-in-loop',
    title: 'Debug: Closure-in-Loop Bug (var vs let)',
    difficulty: 'Medium',
    tags: ['Closures', 'Debugging', 'JavaScript'],
    statement: `The following function is supposed to return \`[0, 1, 2]\` when called with \`n=3\`, but it currently returns \`[3, 3, 3]\`.

Identify the bug and fix it.

    function buildClosures(n) {
      const fns = [];
      for (var i = 0; i < n; i++) {
        fns.push(() => i);
      }
      return fns.map(fn => fn());
    }

Root cause: \`var i\` is function-scoped, so every pushed arrow function closes over the SAME \`i\` binding. By the time the functions are invoked (in the \`.map\`), the loop has finished and \`i === n\`. Switching \`var\` to \`let\` makes \`i\` block-scoped — each iteration gets a fresh binding, and each closure captures its own.

Evaluation criteria:
- Identifies the bug as \`var\` creating a single shared binding.
- Fix: replace \`var\` with \`let\` (or wrap the push in an IIFE).
- Explains the difference between function-scoped and block-scoped variables.`,
    examples: [
      { input: 'n = 3', output: '[0,1,2]', explanation: 'After fixing, each closure captures its own block-scoped i.' },
    ],
    starterCode: {
      javascript:
        '// TODO: Fix the closure-in-loop bug. Currently returns [3,3,3] for n=3.\nfunction buildClosures(n) {\n  const fns = [];\n  for (var i = 0; i < n; i++) {\n    fns.push(() => i);\n  }\n  return fns.map(fn => fn());\n}',
    },
    publicTests: [
      { input: '[3]', expectedOutput: '[0,1,2]', explanation: 'Each closure should capture its own index.' },
      { input: '[5]', expectedOutput: '[0,1,2,3,4]' },
    ],
    hiddenTests: [
      { input: '[0]', expectedOutput: '[]', weight: 1 },
      { input: '[1]', expectedOutput: '[0]', weight: 1 },
      { input: '[10]', expectedOutput: '[0,1,2,3,4,5,6,7,8,9]', weight: 1 },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(N)',
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'debug-off-by-one-pagination',
    title: 'Debug: Off-by-One in Pagination',
    difficulty: 'Medium',
    tags: ['Off-by-One', 'Debugging', 'JavaScript'],
    statement: `This pagination helper is meant to be 1-indexed: \`paginate([1..10], 1, 3)\` should return the first 3 items \`[1,2,3]\`, and \`paginate([1..10], 2, 3)\` should return \`[4,5,6]\`. But currently \`paginate([1..10], 1, 3)\` returns \`[4,5,6]\` and \`paginate([1..10], 2, 3)\` returns \`[7,8,9]\`.

Identify the bug and fix it.

    function paginate(arr, page, pageSize) {
      const start = page * pageSize;
      return arr.slice(start, start + pageSize);
    }

Root cause: with 1-indexed pages, the first page (\`page=1\`) should start at index 0, so \`start = (page - 1) * pageSize\`. The current code uses \`page * pageSize\`, treating page 1 as starting at index \`pageSize\`.

Evaluation criteria:
- Identifies the off-by-one: should use \`(page - 1) * pageSize\`.
- Mentions 1-indexed vs 0-indexed pages and the importance of documenting the convention.`,
    examples: [
      { input: 'arr = [1,2,3,4,5,6,7,8,9,10], page = 1, pageSize = 3', output: '[1,2,3]', explanation: 'Page 1 starts at index 0.' },
    ],
    starterCode: {
      javascript:
        '// TODO: Fix the off-by-one bug. Page 1 should return the first `pageSize` items.\nfunction paginate(arr, page, pageSize) {\n  const start = page * pageSize;\n  return arr.slice(start, start + pageSize);\n}',
    },
    publicTests: [
      { input: '[[1,2,3,4,5,6,7,8,9,10],1,3]', expectedOutput: '[1,2,3]' },
      { input: '[[1,2,3,4,5,6,7,8,9,10],2,3]', expectedOutput: '[4,5,6]' },
    ],
    hiddenTests: [
      { input: '[[1,2,3],5,2]', expectedOutput: '[]', weight: 1 },
      { input: '[[],1,5]', expectedOutput: '[]', weight: 1 },
      { input: '[[1,2,3,4,5],3,2]', expectedOutput: '[5]', weight: 1 },
    ],
    optimalTime: 'O(pageSize)',
    optimalSpace: 'O(pageSize)',
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'debug-loose-equality',
    title: 'Debug: Loose Equality (== vs ===) Type Coercion',
    difficulty: 'Medium',
    tags: ['Type Coercion', 'Debugging', 'JavaScript'],
    statement: `This function searches an array for a target value. It should find only strict-equal matches, but currently \`findIndex([1, 2, "5", 5], 5)\` returns \`2\` (matching the string "5") instead of \`3\` (the number 5).

Identify the bug and fix it.

    function findIndex(arr, target) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
          return i;
        }
      }
      return -1;
    }

Root cause: \`==\` performs type coercion, so \`"5" == 5\` is \`true\`. Switching to \`===\` disables coercion and only matches when types are identical.

Evaluation criteria:
- Identifies the bug as \`==\` performing type coercion.
- Fix: use \`===\`.
- Mentions the ESLint \`eqeqeq\` rule as a preventative measure.`,
    examples: [
      { input: 'arr = [1, 2, "5", 5], target = 5', output: '3', explanation: 'Strict equality skips the string "5".' },
    ],
    starterCode: {
      javascript:
        '// TODO: Fix the loose-equality bug. Only strict-equal matches should count.\nfunction findIndex(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] == target) {\n      return i;\n    }\n  }\n  return -1;\n}',
    },
    publicTests: [
      { input: '[[1,2,"5",5],5]', expectedOutput: '3' },
      { input: '[[1,2,3],2]', expectedOutput: '1' },
    ],
    hiddenTests: [
      { input: '[[1,2,3],4]', expectedOutput: '-1', weight: 1 },
      { input: '[[null,0,""],0]', expectedOutput: '1', weight: 1 },
      { input: '[["a","b","c"],"b"]', expectedOutput: '1', weight: 1 },
    ],
    optimalTime: 'O(N)',
    optimalSpace: 'O(1)',
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },

  // ----------------------------------------------------------------------
  // Testing — 2 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'testing-unit-vs-integration',
    title: 'Testing: Unit vs Integration vs E2E',
    difficulty: 'Easy',
    tags: ['Testing', 'Unit Tests', 'Integration'],
    statement: `Explain the differences between unit, integration, and end-to-end (E2E) tests. Give an example of each for a typical Express + MongoDB API.

Cover:

1. Unit test: tests a single function/module in isolation. All external dependencies (DB, network, file system) are mocked or stubbed. Fast (<10ms each), highly deterministic, pinpoint failures.
   - Example: testing a \`formatUser(user)\` pure function returns the expected JSON shape.
2. Integration test: tests how multiple modules work together. Real or test-double database (in-memory Mongo), real Express app instance, but no real network calls.
   - Example: supertest against an Express app with a real in-memory Mongo — POST /api/users then GET /api/users/:id then verify round-trip.
3. End-to-end (E2E) test: tests the whole system from the user's perspective, including the real browser, real backend, real DB (often a staging environment). Slow (seconds each), flaky-prone (network, timing).
   - Example: Playwright/Cypress: open the sign-up page, fill the form, click submit, see the dashboard.
4. The testing pyramid: lots of unit tests (fast, cheap), fewer integration tests, very few E2E tests (slow, expensive). Inverted pyramids (mostly E2E) are slow and brittle.
5. When to use what: unit for business logic / pure functions; integration for API contracts and DB access; E2E for critical user journeys (signup, checkout) only.
6. Mocking trade-offs: mocks make tests fast but can drift from reality (the mock says the DB returns X, the real DB returns Y). Contract tests (Pact) can bridge this.

Evaluation criteria:
- Distinguishes unit/integration/E2E by scope and speed.
- Gives concrete examples for an Express+Mongo API.
- Recommends the testing pyramid (more unit, fewer E2E).
- Notes the mock-drift risk and that contract tests mitigate it.`,
    allowedLanguages: [],
  },
  {
    slug: 'testing-tdd-mocking',
    title: 'Testing: TDD (Red-Green-Refactor) & Mocking',
    difficulty: 'Medium',
    tags: ['TDD', 'Testing', 'Mocking'],
    statement: `Explain the TDD cycle, when TDD is appropriate, and how to mock dependencies without making tests brittle.

Cover:

1. The TDD cycle (Red-Green-Refactor):
   - Red: write a failing test that describes the next slice of behavior. Watch it fail (proves the test would catch a regression).
   - Green: write the MINIMUM code to make it pass. Do not gold-plate.
   - Refactor: clean up the code with the test as a safety net. Rename, extract, simplify.
2. Why TDD: forces you to think about interface before implementation; guarantees every line of production code is covered by a test; gives rapid feedback (~seconds).
3. When TDD fits well: pure functions, business logic, algorithms, API contracts design.
4. When TDD fits poorly: exploratory prototyping (you do not know the shape yet), UI layout (visual feedback is faster than writing assertions), one-off scripts.
5. Mocking: replace a real dependency (DB client, HTTP API, clock) with a test double so the test is fast and deterministic.
   - Use the smallest hammer: prefer real fakes (in-memory Mongo) over mocks; only mock what you own (do not mock third-party libraries directly — wrap them in your own adapter and mock that).
   - Mock behaviors, not implementations: assert "the email was sent with these arguments", not "the sendEmail method was called with these arguments in this order".
   - Reset mocks between tests to avoid state bleed.
6. The London vs Chicago schools: London (mockist) mocks collaborators heavily; Chicago (classical) uses real objects whenever feasible. Both work; pick one and apply it consistently.
7. Code coverage caveats: 100% coverage does not mean 100% correctness — branch coverage and mutation testing (Stryker) catch more bugs than line coverage alone.

Evaluation criteria:
- Walks through Red-Green-Refactor with rationale.
- Identifies good vs poor TDD fits (logic yes, UI/exploration no).
- Recommends fakes over mocks where feasible; mock behaviors not implementations.
- Notes that coverage % is necessary but not sufficient.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // System Design — 4 discussion questions (no tests)
  // ----------------------------------------------------------------------

  {
    slug: 'system-design-url-shortener',
    title: 'System Design: URL Shortener (e.g. bit.ly)',
    difficulty: 'Medium',
    tags: ['System Design', 'URL Shortener', 'Hashing'],
    statement: `Design a URL shortener service like bit.ly. Expected scale: 100M new URLs/month, 10B redirects/month.

Walk through the standard system-design framework:

1. Requirements clarification:
   - Functional: shorten a long URL to a 7-char code; redirect short URL to long URL; (optional) custom aliases, analytics, expiration.
   - Non-functional: high read-to-write ratio (~100:1), low-latency redirects (<50ms p99), high availability (redirects must work even if the write path is down).
2. Capacity estimates:
   - 100M writes/month → ~40 writes/sec average, ~400/sec peak.
   - 10B reads/month → ~4000 reads/sec average, ~40k/sec peak.
   - Storage: 500 bytes per URL record x 100M x 12 months x 5 years = ~300GB over 5 years (fits on a single sharded Mongo/Postgres).
3. API design:
   - POST /api/shorten { longUrl } → { shortUrl }
   - GET /:code → 301 (permanent, cacheable) or 302 (temporary, lets analytics track). Most choose 301 for SEO + 302 for tracking (split by use case).
4. Short-code generation:
   - Option A: hash the long URL (MD5 + base62), take first 7 chars. Risk of collisions — handle with a check-and-retry.
   - Option B: auto-increment ID from a counter (Zookeeper / Redis INCR) → base62 encode. No collisions, but predictable.
   - Option C: pre-generate 7-char codes in a pool and hand them out.
5. Data model: \`{ _id, shortCode (indexed unique), longUrl, userId, createdAt, expiresAt }\`.
6. Caching: hot URLs cached in Redis (LRU, 80/20 rule — 20% of URLs get 80% of traffic). Cache miss falls through to DB.
7. High availability: multi-AZ DB with read replicas; CDN for redirect edge caching (CloudFront/Cloudflare).
8. Analytics: async pipeline — publish redirect events to Kafka → consumer writes to OLAP store (ClickHouse / BigQuery).
9. Edge cases: same long URL → same short URL? (decide policy); expired URLs; abuse / spam / malware URLs (check against Google Safe Browsing).

Evaluation criteria:
- Produces capacity estimates (writes/sec, reads/sec, storage).
- Compares hash-based vs counter-based short-code generation with trade-offs.
- Includes caching (Redis) and CDN for read latency.
- Discusses 301 vs 302 redirect semantics and analytics pipeline.`,
    allowedLanguages: [],
  },
  {
    slug: 'system-design-rate-limiter',
    title: 'System Design: Distributed Rate Limiter',
    difficulty: 'Hard',
    tags: ['System Design', 'Rate Limiting', 'Distributed'],
    statement: `Design a distributed rate limiter that enforces "100 requests per user per minute" across a fleet of 100 API servers.

Cover:

1. Requirements clarification:
   - Functional: limit per-user request rate; return 429 with Retry-After header when exceeded.
   - Non-functional: low overhead (<5ms added latency), accurate (some overage acceptable under partition failure), survives node restarts.
2. Algorithm choices:
   - Fixed window: simple, but bursts at window boundaries (2x traffic at the boundary).
   - Sliding window log: exact, but memory-heavy (store every request timestamp).
   - Sliding window counter (hybrid): keep a counter for the current and previous window; weighted estimate. Good balance.
   - Token bucket: supports bursts up to bucket size; refill rate enforces average. Best for most APIs.
   - Leaky bucket: smooths traffic to a constant output rate; good for downstream protection.
3. Single-node implementation: in-memory token bucket per user. Works for one server.
4. Distributed: every server needs to see the same counter → store counters in Redis (atomic INCR + EXPIRE in a Lua script to avoid race conditions).
5. Latency optimization: each API server keeps a local token bucket "lease" (e.g. 10 tokens) — only hits Redis when the local bucket is empty. Reduces Redis load by 10x.
6. Failure modes:
   - Redis down: fail-open (allow the request, log the incident) vs fail-closed (reject everything). Most public APIs fail-open to preserve availability.
   - Clock skew between nodes: use Redis TIME, not local clocks, for window boundaries.
7. Identity: rate-limit by API key (authenticated) → fallback to IP (unauthenticated). For IPv6, prefix-aggregate to /64 to prevent address-spray abuse.
8. Multi-tier limits: per-route limits (e.g. /auth/login is 5/min, /api/* is 100/min) plus a global limit per user.
9. Headers: return \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`, and \`Retry-After\` (seconds) on 429.

Evaluation criteria:
- Compares fixed-window, sliding-window, token-bucket, leaky-bucket algorithms.
- Designs a Redis-backed distributed counter with atomic Lua scripts.
- Mentions local-lease optimization to reduce Redis load.
- Discusses fail-open vs fail-closed and the headers clients expect.`,
    allowedLanguages: [],
  },
  {
    slug: 'system-design-chat-system',
    title: 'System Design: Realtime Chat System (e.g. WhatsApp)',
    difficulty: 'Hard',
    tags: ['System Design', 'Realtime', 'WebSockets'],
    statement: `Design a realtime 1:1 and group chat system supporting 50M DAU, with delivery guarantees and presence.

Cover:

1. Requirements:
   - Functional: 1:1 messages, group chats (up to 200 members), online/offline presence, message history, read receipts, push notifications.
   - Non-functional: messages delivered in <500ms p99, eventually consistent, no message loss.
2. Communication protocol:
   - WebSocket (persistent, bidirectional, low overhead) for the client↔server link.
   - Mobile: WebSocket over TCP, with FCM/APNs fallback when the app is backgrounded.
3. Connection layer: a fleet of "chat servers" each holding ~100k open WebSocket connections. A sticky-session load balancer (or per-user consistent hashing) routes a user to one chat server.
4. Message flow (sender → receiver):
   - Sender's chat server receives the message, assigns a monotonically increasing ID (Snowflake: timestamp + server-id + counter), writes to Cassandra (keyed by conversation_id, sorted by message_id).
   - Looks up the recipient's currently-connected chat server in a Redis registry (\`user_id → server_id\`).
   - Forwards the message over an internal bus (Kafka or gRPC) to that server, which pushes to the recipient's WebSocket.
   - If recipient is offline, queues the message and triggers a push notification.
5. Delivery guarantees: at-least-once over WebSocket (client acks each message; server retries on timeout). Deduplicate by message_id on the client.
6. Presence: each chat server reports its users' presence to Redis (TTL 60s, refreshed every 30s). Presence changes broadcast to interested subscribers (friends, group members) via a fanout service.
7. Group chats: store group membership in a separate table. New message → fanout service looks up members → delivers to each (skips offline unless they are mentioned).
8. Storage: Cassandra (write-optimized, scales horizontally by conversation_id). Old messages (>1 year) tier to S3 with parquet for compliance export.
9. Media (images, video): upload to S3 via a presigned URL; store the S3 key in the message body.
10. Push notifications: separate worker pool consumes a notifications Kafka topic, calls FCM/APNs, retries with exponential backoff.
11. Scaling the connection layer: shard by user_id; use a service mesh (Envoy/Istio) for mTLS between chat servers; graceful draining on deploy (WebSocket close code 1001 + client reconnect).

Evaluation criteria:
- Chooses WebSocket with FCM/APNs fallback.
- Designs the message flow: ID generation (Snowflake), Cassandra write, fanout via Redis lookup + internal bus.
- Handles offline users with push notifications + retry queue.
- Mentions at-least-once + client-side dedup and the presence service.`,
    allowedLanguages: [],
  },
  {
    slug: 'system-design-news-feed',
    title: 'System Design: News Feed (e.g. Twitter/Instagram)',
    difficulty: 'Hard',
    tags: ['System Design', 'News Feed', 'Fanout'],
    statement: `Design a news feed system: 100M DAU, each user follows up to 5000 others, each user posts ~10 tweets/day. The feed must show the latest N posts from followed users, sorted by recency.

Cover:

1. Requirements:
   - Functional: a user posts; followers see the post in their feed within ~5s.
   - Non-functional: feed generation < 200ms p99; eventual consistency acceptable for non-active users.
2. The two architectures:
   - **Fanout-on-write** (push): when a user posts, write the post to every follower's pre-materialized feed (Redis sorted set, score = timestamp). Read is O(N) — just read the top of the feed.
     - Pros: fast reads, simple.
     - Cons: celebrity problem (a user with 50M followers writes 50M entries per post); wasted writes for inactive followers.
   - **Fanout-on-read** (pull): when a user opens their feed, fetch the latest posts from all their followees, merge-sort by timestamp.
     - Pros: no wasted writes; scales naturally for celebrities.
     - Cons: read latency depends on followee count; hard to do personalization/ranking.
   - **Hybrid**: fanout-on-write for normal users; fanout-on-read for celebrities (followers > 100k). Caches the celebrity's recent posts in Redis; the read path merges pre-materialized + celebrity cache.
3. Data model:
   - \`tweets(tweet_id, user_id, content, created_at)\` sharded by user_id (or tweet_id).
   - \`follows(follower_id, followee_id)\`.
   - \`feed(user_id, tweet_id, created_at)\` — the pre-materialized feed, in Redis (ZSET) or Cassandra.
4. Ranking: chronological for v1; later, an ML ranker scores candidate tweets (recency, affinity, engagement) and the feed returns the top K. The ranker needs features from the user-graph and tweet-engagement stores.
5. Caching: hot tweets in Memcached (key = tweet_id). Feed pre-materialization in Redis.
6. Background workers: a Kafka topic per post; consumer fanout workers write to follower feeds. At-least-once delivery; deduplicate by tweet_id in the feed ZSET.
7. Pagination: cursor-based (\`?cursor=<timestamp,tweet_id>\`) — never offset (drift when new tweets arrive).
8. Edge cases: deleted tweets (mark tombstone in feed), blocked users (filter at read time), private accounts (only approved followers get fanout).
9. Capacity: 100M DAU x 10 tweets x avg 200 followers = 200B feed writes/day. At 2M writes/sec, this needs ~50-100 fanout workers, each handling 20-40k writes/sec.

Evaluation criteria:
- Compares fanout-on-write vs fanout-on-read with trade-offs.
- Identifies the celebrity problem and proposes the hybrid approach.
- Chooses appropriate storage (Redis ZSET for feed, sharded SQL/Cassandra for tweets).
- Mentions cursor-based pagination and edge cases (deletes, blocks).`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Scalability — 2 discussion questions
  // ----------------------------------------------------------------------

  {
    slug: 'scalability-caching-strategies',
    title: 'Scalability: Caching Strategies (cache-aside vs write-through vs write-back)',
    difficulty: 'Medium',
    tags: ['Caching', 'Scalability', 'Redis'],
    statement: `Compare caching strategies and explain cache invalidation, eviction, and the thundering-herd problem.

Cover:

1. Cache-aside (lazy loading): app checks cache; on miss, reads from DB and writes to cache.
   - Pros: cache survives DB restarts; only caches what is actually requested.
   - Cons: stale data until TTL or explicit invalidation; thundering herd on hot-key miss.
2. Write-through: app writes to cache AND DB synchronously (usually via the cache layer).
   - Pros: cache never stale; reads always hit cache after warmup.
   - Cons: higher write latency (two writes); cache filled with rarely-read data.
3. Write-back (write-behind): app writes to cache only; cache asynchronously flushes to DB.
   - Pros: very fast writes; absorbs write bursts.
   - Cons: data loss if cache crashes before flush; complex (durability ordering).
4. Cache invalidation:
   - TTL: simplest, accepts eventual consistency.
   - Event-driven: on DB update, publish an event that deletes/updates the cache entry.
   - Version-based: cache key includes a version (e.g. \`user:42:v3\`) so updates create a new key — no invalidation race.
5. Eviction policies: LRU (least recently used, default for Redis), LFU (least frequently used — better for skewed access), FIFO (rarely used), Random (surprisingly good for uniform access).
6. Thundering herd / cache stampede: when a hot key expires, all concurrent requests miss and hit the DB. Fixes:
   - Lock + retry: first miss acquires a lock, others wait + retry the cache.
   - Probabilistic early expiration (XFetch): randomly expire a fraction of TTL early so misses spread out.
7. CDN as a caching layer: static assets at edge nodes; API responses cacheable with \`Cache-Control: s-maxage=60, stale-while-revalidate=600\`.
8. Multi-tier: L1 in-process (LRU, ~10k entries, ~1us) → L2 Redis (shared, ~100ms TTL, ~1ms). L1 hit avoids the Redis round-trip but invalidation across instances is hard (use pub/sub invalidation or skip L1 for write-heavy data).

Evaluation criteria:
- Distinguishes cache-aside vs write-through vs write-back with trade-offs.
- Recommends an eviction policy (LRU default, LFU for skewed access).
- Identifies the thundering-herd problem and a fix (lock, probabilistic early expiration).
- Mentions CDN caching for static + API responses.`,
    allowedLanguages: [],
  },
  {
    slug: 'scalability-sharding-load-balancing',
    title: 'Scalability: Database Sharding & Load Balancing',
    difficulty: 'Hard',
    tags: ['Sharding', 'Load Balancing', 'Scalability'],
    statement: `Explain horizontal sharding of a relational database, sharding-key choice, and how to load-balance across a fleet of stateless API servers.

Part 1 — Sharding:

1. Vertical vs horizontal scaling: vertical = bigger machine (limited by hardware ceiling); horizontal = more machines (limited by sharding complexity).
2. Sharding key choice:
   - High cardinality (avoids hot shards).
   - Low skew (uniform distribution — hash-based for uniform, range-based for locality).
   - Immutable (changing the key after deployment is a multi-month migration).
   - Used in WHERE clauses of hot queries (so the query routes to a single shard).
3. Sharding strategies:
   - Hash-based: \`shard = hash(user_id) % N\`. Uniform distribution; rebalancing requires re-hashing everything (use consistent hashing to minimize movement).
   - Range-based: shard 0 covers user_id [0..1M], shard 1 [1M..2M]. Supports range scans; risks hot spots if IDs are sequential (newest shard gets all writes).
   - Directory-based: a lookup service maps key → shard. Flexible; the lookup service is a SPOF and bottleneck.
4. Cross-shard queries: a query without the shard key must fan out to all shards (scatter-gather). Expensive — design the schema so 99% of queries hit a single shard.
5. Resharding: when a shard grows too big, split it. Use consistent hashing + double-write to old + new shard during migration, then cut over.
6. Joins: cross-shard joins are near-impossible. Denormalize or move joins into the application layer. CQRS / materialized views can pre-compute the join result.

Part 2 — Load balancing:

1. L4 (TCP) vs L7 (HTTP) load balancers:
   - L4 (HAProxy, AWS NLB): fast, protocol-agnostic, no HTTP awareness.
   - L7 (Nginx, AWS ALB): HTTP-aware (path routing, header manipulation, TLS termination).
2. Algorithms: round-robin, least-connections (default for stateless), least-response-time, consistent hashing (for sticky sessions).
3. Health checks: active (LB polls /health) and passive (circuit breaker — pull a server out if it returns 5xx N times in a row).
4. Session stickiness: avoid if possible (stateless servers scale better). If needed, use a sticky cookie or consistent hashing by user_id.
5. TLS termination at the LB (offload from app servers); modern alternative is end-to-end mTLS via a service mesh.

Evaluation criteria:
- Compares hash/range/directory sharding strategies.
- Identifies the cross-shard-query problem and the 99%-single-shard design rule.
- Distinguishes L4 vs L7 load balancers.
- Recommends stateless servers with health checks (active + passive).`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Security — 3 conceptual questions
  // ----------------------------------------------------------------------

  {
    slug: 'security-xss-prevention',
    title: 'Security: XSS Prevention',
    difficulty: 'Medium',
    tags: ['XSS', 'Security', 'Web'],
    statement: `Explain Cross-Site Scripting (XSS), the three flavors, and how to defend against each.

Cover:

1. Stored XSS: malicious script is persisted (e.g. in a comment) and served to every viewer. Most damaging — affects many users.
2. Reflected XSS: malicious script is part of the URL (\`/search?q=<script>...\`); the server reflects it back in the response. Affects the single user who clicks the crafted link.
3. DOM-based XSS: client-side JS reads attacker-controlled data (location.hash, document.referrer) and writes it to the DOM via innerHTML without sanitization. Server is not involved.

Defenses:

1. Output encoding: escape user-supplied data when rendering HTML. Modern frameworks (React, Vue, Angular) auto-escape by default — never bypass with \`dangerouslySetInnerHTML\` unless you have sanitized.
2. Content-Security-Policy (CSP): HTTP header restricting where scripts can be loaded from.
   - Strict: \`default-src 'self'; script-src 'self'\` — blocks inline scripts and external CDNs.
   - Use nonces (\`'nonce-abc123'\`) or hashes for legitimate inline scripts.
   - Report-only mode first to gauge breakage.
3. Sanitization: when storing rich text (HTML), parse and strip dangerous tags/attributes server-side with a library like DOMPurify (js) or bleach (python). Do not write your own regex.
4. HttpOnly cookies: prevents JS from reading session cookies even if XSS fires (limits blast radius to CSRF-style attacks).
5. Trusted Types: browser API requiring all DOM sinks (\`innerHTML\`, \`eval\`) to receive a TrustedHTML object — forces sanitization at the boundary.
6. Subresource Integrity (SRI): hash-verify third-party scripts so a compromised CDN cannot inject malicious code.

Evaluation criteria:
- Distinguishes stored, reflected, and DOM-based XSS.
- Recommends framework auto-escaping + avoid dangerouslySetInnerHTML.
- Proposes a strict CSP with nonces for legitimate inline scripts.
- Mentions HttpOnly cookies and Trusted Types as defense-in-depth.`,
    allowedLanguages: [],
  },
  {
    slug: 'security-csrf-protection',
    title: 'Security: CSRF Protection',
    difficulty: 'Medium',
    tags: ['CSRF', 'Security', 'Web'],
    statement: `Explain Cross-Site Request Forgery (CSRF) and how to defend against it. Compare the synchronizer-token pattern, double-submit cookie, and SameSite cookies.

Cover:

1. The attack: a logged-in user visits attacker.com; the attacker's page issues a cross-origin POST to bank.com/transfer. The browser automatically attaches the user's bank.com cookies → the transfer goes through.
   - Note: CSRF only works for cookie-authenticated requests. APIs auth'd via Authorization header (Bearer token in JS) are NOT vulnerable because browsers do not auto-attach those.
2. SameSite cookie attribute:
   - \`SameSite=Strict\`: cookie never sent on cross-site requests (most secure, can break deep-link UX — a user clicking a link to your site arrives unauthenticated).
   - \`SameSite=Lax\`: cookie sent on top-level cross-site GETs (default in modern browsers); blocks cross-site POSTs. Reasonable default.
   - \`SameSite=None; Secure\`: cookie sent on all cross-site requests (required for third-party embeds); MUST be Secure.
3. Synchronizer-token pattern: server generates a random CSRF token per session, embeds it in the form as a hidden field, validates on POST. The attacker cannot read the token (same-origin policy blocks reading the response).
4. Double-submit cookie: server sets a CSRF cookie; client JS reads it and includes it as an X-CSRF-Token header on mutations. Server compares the header to the cookie. Stateless (no server-side session needed) but requires JS to read the cookie.
5. Custom request header: require mutations to send an \`X-Requested-With\` header. Cross-site forms cannot set custom headers without a CORS preflight; preflight denies → attack blocked.
6. CSRF tokens in SPA: token fetched from /api/csrf-token on app load; included as X-CSRF-Token on every mutation. Refresh on token rotation.
7. Linter/test: ensure every POST/PUT/PATCH/DELETE route validates CSRF token. GETs must be read-only (no state mutation).

Evaluation criteria:
- Explains the CSRF attack (browser auto-attaches cookies on cross-site requests).
- Distinguishes SameSite=Strict vs Lax vs None.
- Compares synchronizer token vs double-submit cookie.
- Notes that bearer-token APIs are not CSRF-vulnerable (only cookie-auth APIs are).`,
    allowedLanguages: [],
  },
  {
    slug: 'security-injection-validation',
    title: 'Security: SQL/NoSQL Injection & Input Validation',
    difficulty: 'Medium',
    tags: ['Injection', 'Security', 'Validation'],
    statement: `Explain SQL injection and NoSQL injection. Show vulnerable code, the fix, and defense-in-depth measures.

Cover:

1. SQL injection — vulnerable code:

    const sql = \`SELECT * FROM users WHERE email = '\${req.body.email}'\`;
    db.query(sql);

   Attack: \`req.body.email = "' OR '1'='1"\` → query becomes \`SELECT * FROM users WHERE email = '' OR '1'='1\` → returns every user.
   Worse: \`email = "; DROP TABLE users; --"\` → table gone.
2. SQL injection fix — parameterized queries / prepared statements:

    db.query("SELECT * FROM users WHERE email = ?", [req.body.email]);

   The driver sends the SQL and parameters separately; the database engine never interprets params as SQL. ORM query builders (Knex, Prisma, Sequelize) do this by default if you use their API (not raw query strings).
3. NoSQL injection — vulnerable code:

    db.users.findOne({ email: req.body.email });

   Attack: \`req.body.email = { "$ne": null }\` → returns the first user with any email (bypasses auth).
   Fix: validate the type explicitly:

    if (typeof req.body.email !== "string") return res.status(400).json({ error: "Invalid email" });
    db.users.findOne({ email: req.body.email });

4. Defense in depth:
   - Validate every input with a schema (zod, joi, express-validator) BEFORE touching the DB. Reject anything that does not match the expected shape.
   - Use the principle of least privilege: the DB user used by the app should not be able to DROP tables or access unrelated schemas.
   - Error messages: never echo SQL errors back to the client (they leak schema info).
   - WAF (Cloudflare, AWS WAF) blocks obvious injection patterns.
   - Logs: log suspicious queries (ones containing \`--\`, \`;\`, \`$ne\`, etc.) for incident response.
5. ORMs are not a silver bullet: raw queries (\`prisma.$queryRaw\`, \`sequelize.query\`) bypass parameterization unless you use the tagged-template form.

Evaluation criteria:
- Shows vulnerable SQL with template-string concatenation and the fix (parameterized queries).
- Shows NoSQL injection via \`{ $ne: null }\` and the type-validation fix.
- Recommends schema validation (zod/joi) at the request boundary.
- Mentions least-privilege DB users and not echoing SQL errors.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Architecture — 2 discussion questions
  // ----------------------------------------------------------------------

  {
    slug: 'architecture-microservices-vs-monolith',
    title: 'Architecture: Microservices vs Monolith',
    difficulty: 'Medium',
    tags: ['Architecture', 'Microservices', 'Monolith'],
    statement: `Compare monolithic and microservice architectures. When should you choose each, and what are the hidden costs of microservices?

Cover:

1. Monolith: single deployable unit; one codebase, one database (usually), one process. All modules share memory and a stack.
   - Pros: simple to build, deploy, debug (single stack trace); local dev is one command; refactoring across modules is a find-replace.
   - Cons: scaling requires scaling the whole app; one module's memory leak takes down everything; team boundaries blur as the codebase grows.
2. Microservices: many small services, each independently deployable, communicating over the network (REST, gRPC, async events).
   - Pros: independent scaling (scale only the hot service); technology diversity (Go for the API gateway, Python for ML); team autonomy; failure isolation (one service crashing does not take down everything if you have designed graceful degradation).
   - Cons: distributed system complexity (network failures, eventual consistency, distributed transactions are hard); operational overhead (need service discovery, distributed tracing, centralized logging); harder local dev (need docker-compose with 8 services); CI/CD complexity per service.
3. When to choose a monolith: small team (<10 engineers), early-stage product (requirements shifting fast), simple domain, low scale (<1000 RPS).
4. When to choose microservices: large organization (Conway's Law — services align with team boundaries), high scale on a specific subset, hard isolation requirements (a payment service with strict compliance), polyglot needs.
5. The "modular monolith" middle ground: organize the codebase into well-defined modules with strict boundaries (no cross-module imports of internals), single deployable. Easier to split into services later when the team and scale demand it. Basecamp, GitHub, and Stack Overflow run on monoliths at scale.
6. Migration path: do not start with microservices. Start with a modular monolith; when a specific module needs independent scaling or deployment, extract it.
7. Hidden costs of microservices: distributed tracing setup, contract testing between services, service mesh adoption, on-call burden (each service is a pager), network failure modes (timeouts, retries, circuit breakers), data consistency (sagas, outbox pattern).

Evaluation criteria:
- Lists monolith pros (simplicity, debuggability) and cons (scaling, single point of failure).
- Lists microservice pros (independent scaling, team autonomy) and cons (distributed complexity, ops overhead).
- Recommends modular monolith as the default starting point.
- Mentions hidden costs: tracing, contract testing, on-call, network failure modes.`,
    allowedLanguages: [],
  },
  {
    slug: 'architecture-event-driven-cqrs',
    title: 'Architecture: Event-Driven & CQRS',
    difficulty: 'Hard',
    tags: ['Architecture', 'Event-Driven', 'CQRS'],
    statement: `Explain event-driven architecture, CQRS, and event sourcing. When do they make sense, and what are the trade-offs?

Cover:

1. Event-driven architecture: services communicate by publishing and consuming events (via Kafka, RabbitMQ, SQS, EventBridge) rather than direct RPC.
   - Pros: producer and consumer are decoupled (producer does not know who consumes); natural buffering (queue absorbs spikes); easy to add new consumers.
   - Cons: eventual consistency (the producer cannot synchronously know the consumer succeeded); debugging is harder (distributed trace required); ordering guarantees vary by broker.
2. CQRS (Command Query Responsibility Segregation): split the write model (commands — create/update/delete) from the read model (queries). Writes go to the authoritative store; reads come from a denormalized projection optimized for queries.
   - Why: write and read workloads have different shapes (writes need consistency, reads need speed and flexible shapes). Splitting them lets each be optimized independently.
   - The projection: a consumer subscribes to domain events and updates a read-optimized store (e.g. Elasticsearch for search, Redis for hot reads, a denormalized SQL view).
3. Event sourcing: instead of storing the current state, store the sequence of events that led to it. The current state is derived by replaying events.
   - Example: a bank account does not have a \`balance\` column — it has a sequence of \`MoneyDeposited\` / \`MoneyWithdrawn\` events. The balance is the sum of those events.
   - Pros: full audit log (regulatory compliance); time travel (replay to any past state); easy to build new projections by replaying history.
   - Cons: event schema evolution (old events must remain replayable); snapshots required (replaying 10 years of events to get current state is too slow); eventually-consistent reads; complexity tax.
4. When to use CQRS + event sourcing: domains with complex write logic and many read shapes (e.g. e-commerce — order placement is the write, dashboards/fulfillment/billing are different reads); systems that need audit trails (finance, healthcare).
5. When NOT to use: CRUD apps with simple read patterns; small teams (the operational overhead is significant); systems where eventual consistency is unacceptable.
6. The outbox pattern: when a service writes to its DB and publishes an event, those two operations cannot be atomic across DB+broker. Write the event to an \`outbox\` table in the same DB transaction; a separate process polls the outbox and publishes to the broker. Ensures events are published at-least-once.
7. Idempotent consumers: events may be delivered more than once; consumers must deduplicate (by event_id) and produce the same effect on retry.

Evaluation criteria:
- Defines event-driven architecture with pros (decoupling, buffering) and cons (eventual consistency, debugging).
- Explains CQRS (separate write and read models) and why.
- Explains event sourcing (store events, derive state) with pros (audit, time travel) and cons (schema evolution, snapshots).
- Recommends outbox + idempotent consumers for reliable event publishing.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Behavioral — 4 discussion questions (STAR-format answers)
  // ----------------------------------------------------------------------

  {
    slug: 'behavioral-conflict-resolution',
    title: 'Behavioral: Describe a Conflict with a Coworker',
    difficulty: 'Easy',
    tags: ['Behavioral', 'Conflict', 'Collaboration'],
    statement: `Tell me about a time you disagreed with a coworker on a technical decision. How did you resolve it?

Use the STAR format (Situation, Task, Action, Result) — keep your answer under 3 minutes.

What the interviewer is looking for:

1. Specifics — a real anecdote with names and dates, not a vague generalization.
2. Empathy — you considered their coworker's perspective, not just your own correctness.
3. Process — how you evaluated trade-offs (data, prototypes, RFC, third-party opinion) rather than who "won".
4. Ownership — even if the decision went against you, you committed to the team's choice and did not sabotage it.
5. Reflection — what you learned (about the technology, about communication, about yourself).

Avoid:
- "I was right and they were wrong" framing (even if true).
- "I went to the manager and they sided with me" (escalation should be the last resort, not the first).
- Generalities like "I always listen to others".

Evaluation criteria:
- Uses STAR format with a specific real anecdote.
- Shows empathy and a data-driven resolution process.
- Demonstrates commitment to the team's decision post-conflict.
- Reflects on what they learned.`,
    allowedLanguages: [],
  },
  {
    slug: 'behavioral-project-failure',
    title: 'Behavioral: Tell Me About a Project That Failed',
    difficulty: 'Easy',
    tags: ['Behavioral', 'Failure', 'Learning'],
    statement: `Tell me about a project that failed or missed its goals. What was your role, and what did you learn?

Use the STAR format. The interviewer is NOT looking for "I have no failures" — they want to see how you handle setbacks.

What the interviewer is looking for:

1. Ownership — you take responsibility for your contribution to the failure, not blame the team / PM / customer / luck.
2. Specifics — what was the failure (missed deadline, broken prod, failed product launch, abandoned feature)?
3. Root-cause analysis — what actually went wrong (scope creep, underestimated complexity, missing dependency, communication gap)?
4. Lessons learned — concrete changes you made afterward (better estimation, weekly check-ins, written design docs, smaller PRs).
5. Forward application — how you applied those lessons to a later successful project.

Avoid:
- "The project failed because of other people" (no ownership).
- "I learned to communicate more" (vague — what specifically?).
- Picking a fake "weakness that is secretly a strength" (e.g. "I work too hard").

Evaluation criteria:
- Tells a real failure with concrete specifics.
- Takes ownership rather than blaming others.
- Identifies a root cause (not just symptoms).
- Describes a specific behavioral change made afterward.`,
    allowedLanguages: [],
  },
  {
    slug: 'behavioral-leadership-mentoring',
    title: 'Behavioral: Describe a Time You Mentored Someone',
    difficulty: 'Easy',
    tags: ['Behavioral', 'Leadership', 'Mentoring'],
    statement: `Tell me about a time you helped a junior engineer grow — technically or professionally. What was the situation and what was the outcome?

Use the STAR format. The interviewer wants to see how you multiply others' impact, not just your own.

What the interviewer is looking for:

1. Specifics — who (anonymized), what they were struggling with, why you stepped in.
2. Diagnosis — you understood the actual gap (was it domain knowledge? process? confidence? communication?) rather than assuming "they just need to code more".
3. Concrete actions — pair programming, code review with explanations (not just "fix this"), reading group, written docs, stretch assignments, regular 1:1s.
4. Outcomes — measurable growth (shipped a feature solo, presented at a meeting, got promoted, mentored someone else).
5. Self-awareness — what you learned about your own communication / patience / biases.

Avoid:
- "I told them to read the docs" (abdication, not mentoring).
- "I did the work for them" (fixes the immediate problem, teaches nothing).
- Taking credit for their growth ("I made them a senior engineer").

Evaluation criteria:
- Describes a specific mentee and their actual struggle.
- Shows diagnosis before action (understood the gap).
- Uses concrete mentoring techniques (pairing, written docs, stretch tasks).
- Reports measurable growth and credits the mentee.`,
    allowedLanguages: [],
  },
  {
    slug: 'behavioral-cross-team-collaboration',
    title: 'Behavioral: Cross-Team Collaboration',
    difficulty: 'Easy',
    tags: ['Behavioral', 'Collaboration', 'Communication'],
    statement: `Tell me about a project that required you to work closely with another team (e.g. infra, design, data, marketing). How did you ensure alignment?

Use the STAR format. The interviewer wants to see how you operate outside your immediate team.

What the interviewer is looking for:

1. Specifics — the project, the other team, why the collaboration was needed.
2. Empathy for the other team's constraints — you understood their goals, deadlines, and incentives (not just your own roadmap).
3. Communication channels — written design docs, weekly syncs, shared Slack channel, RFC process, joint demo.
4. Conflict navigation — when priorities diverged, how you negotiated (compromise, escalation, written decision log).
5. Outcome — what shipped, what worked, what you would do differently.

Avoid:
- "They didn't deliver, so we built it ourselves" (abdication of collaboration).
- "We had a meeting every week" without saying what was decided or changed.
- Blaming the other team for delays.

Evaluation criteria:
- Names the other team and their constraints (not just your team's needs).
- Establishes concrete communication channels with artifacts (docs, decision logs).
- Handles priority conflicts through negotiation, not blame.
- Reflects on what they would do differently next time.`,
    allowedLanguages: [],
  },

  // ----------------------------------------------------------------------
  // Project-based — 3 questions (starterCode + runnable smoke tests, JS-only)
  // ----------------------------------------------------------------------

  {
    slug: 'project-build-todo-api',
    title: 'Project: Build a TODO Item Factory',
    difficulty: 'Medium',
    tags: ['JavaScript', 'Project', 'Factory Pattern'],
    statement: `Implement a \`createTodoItem(text, id, done)\` factory function that returns a TODO item object.

The returned object must have the shape:

    { id: number, text: string, done: boolean }

Requirements:
- If \`done\` is omitted, default to \`false\`.
- Throw a \`TypeError\` if \`text\` is not a non-empty string.
- Throw a \`TypeError\` if \`id\` is not a positive integer.
- The returned object should be immutable (use \`Object.freeze\`).

Example:

    createTodoItem("buy milk", 1)
    // → { id: 1, text: "buy milk", done: false }
    createTodoItem("walk dog", 2, true)
    // → { id: 2, text: "walk dog", done: true }`,
    constraints: 'text must be a non-empty string.\nid must be a positive integer.\ndone is optional, defaults to false.',
    examples: [
      { input: 'text = "buy milk", id = 1', output: '{"id":1,"text":"buy milk","done":false}', explanation: 'done defaults to false.' },
    ],
    starterCode: {
      javascript:
        '/**\n * Build a TODO item object.\n * @param {string} text - non-empty\n * @param {number} id - positive integer\n * @param {boolean} [done=false]\n * @returns {Readonly<{id:number,text:string,done:boolean}>}\n */\nfunction createTodoItem(text, id, done = false) {\n  if (typeof text !== "string" || text.length === 0) throw new TypeError("text must be a non-empty string");\n  if (!Number.isInteger(id) || id <= 0) throw new TypeError("id must be a positive integer");\n  // TODO: return the frozen object with {id, text, done}\n  \n}',
    },
    publicTests: [
      { input: '["buy milk",1]', expectedOutput: '{"done":false,"id":1,"text":"buy milk"}', explanation: 'Field equality is order-independent in deep-equal.' },
      { input: '["walk dog",2,true]', expectedOutput: '{"done":true,"id":2,"text":"walk dog"}' },
    ],
    hiddenTests: [
      { input: '["cook",3]', expectedOutput: '{"done":false,"id":3,"text":"cook"}', weight: 1 },
      { input: '["a",99,false]', expectedOutput: '{"done":false,"id":99,"text":"a"}', weight: 1 },
    ],
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'project-build-debounce',
    title: 'Project: Build a Debounce Utility',
    difficulty: 'Easy',
    tags: ['JavaScript', 'Project', 'Debounce'],
    statement: `Implement a \`debounce(fn, delay)\` function that returns a debounced version of \`fn\`.

The returned function should:
1. Delay invoking \`fn\` by \`delay\` milliseconds.
2. If called again before \`delay\` elapses, reset the timer (only the last call fires).
3. Preserve \`this\` and \`arguments\` of the latest call.
4. NOT call \`fn\` synchronously (the smoke test enforces this).

The starterCode below contains a \`smokeTestDebounce\` helper that the test runner calls (the runner invokes the FIRST function defined in your code). The smoke test verifies that your \`debounce\` returns a callable function, that calling it does not throw, and that the original \`fn\` is NOT called synchronously. Implement \`debounce\` so that \`smokeTestDebounce()\` returns the string \`"PASS"\`.

Hint: use \`setTimeout\` + \`clearTimeout\`. The sandbox's \`microtaskMode\` does not drain macrotasks, so \`setTimeout\` callbacks will not fire during the test — your debounce just needs to defer the call, not invoke it synchronously.`,
    examples: [
      { input: 'smokeTestDebounce()', output: '"PASS"', explanation: 'The smoke test verifies debounce returns a function and defers the call.' },
    ],
    starterCode: {
      javascript:
        '// === Smoke-test entry point — the runner calls this FIRST function. ===\n// Verifies that your debounce() returns a callable function and does NOT call fn synchronously.\nfunction smokeTestDebounce() {\n  // 1. Verify return type\n  const debounced = debounce(() => {}, 100);\n  if (typeof debounced !== "function") return "FAIL:type";\n  // 2. Verify calling the debounced function does not throw\n  try { debounced(); } catch (e) { return "FAIL:throw"; }\n  // 3. Verify debounce does NOT call fn synchronously\n  let called = false;\n  const d2 = debounce(() => { called = true; }, 100);\n  d2();\n  if (called) return "FAIL:sync";\n  return "PASS";\n}\n\n// === Implement debounce below ===\n/**\n * @param {Function} fn\n * @param {number} delay - milliseconds\n * @returns {Function}\n */\nfunction debounce(fn, delay) {\n  // TODO: implement using setTimeout + clearTimeout.\n  // Must return a function that defers fn by `delay` ms and resets on each call.\n  let timer;\n  return function(...args) {\n    // your code here\n  };\n}',
    },
    publicTests: [
      { input: '[]', expectedOutput: '"PASS"', explanation: 'Smoke test: debounce returns a function and does not call fn synchronously.' },
    ],
    hiddenTests: [
      { input: '[]', expectedOutput: '"PASS"', weight: 1 },
    ],
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: 'project-build-pagination-hook',
    title: 'Project: Build a Pagination Utility (logic for usePagination)',
    difficulty: 'Medium',
    tags: ['JavaScript', 'Project', 'Pagination'],
    statement: `Implement the core logic underlying a React \`usePagination\` hook: a pure \`paginate(array, page, pageSize)\` function.

Requirements:
- \`page\` is 1-indexed (page 1 returns the first \`pageSize\` items).
- Returns the slice of \`array\` for the requested page.
- Returns an empty array if the page is out of range (page < 1 or page > totalPages).
- Does not mutate the input array.

This is the pure logic — a real \`usePagination\` React hook would wrap this in \`useState\`/\`useMemo\` and expose \`{ page, pageSize, items, totalPages, next, prev, canNext, canPrev }\` for a UI to consume.

Example:

    paginate([1,2,3,4,5,6,7,8,9,10], 2, 3)
    // → [4,5,6]
    paginate([1,2,3], 5, 2)
    // → []`,
    constraints: 'array.length <= 10^6.\npage and pageSize are positive integers.',
    examples: [
      { input: 'array = [1,2,3,4,5,6,7,8,9,10], page = 2, pageSize = 3', output: '[4,5,6]', explanation: 'Page 2 starts at index (2-1)*3 = 3.' },
    ],
    starterCode: {
      javascript:
        '/**\n * Returns the items on the given page (1-indexed) of `array`.\n * Returns an empty array if the page is out of range.\n * @param {any[]} array\n * @param {number} page - 1-indexed page number\n * @param {number} pageSize - items per page\n * @returns {any[]}\n */\nfunction paginate(array, page, pageSize) {\n  // TODO: implement pagination. Hint: start = (page - 1) * pageSize\n  \n}',
    },
    publicTests: [
      { input: '[[1,2,3,4,5,6,7,8,9,10],2,3]', expectedOutput: '[4,5,6]' },
      { input: '[[1,2,3],1,5]', expectedOutput: '[1,2,3]' },
    ],
    hiddenTests: [
      { input: '[[1,2,3,4,5],3,2]', expectedOutput: '[5]', weight: 1 },
      { input: '[[],1,10]', expectedOutput: '[]', weight: 1 },
      { input: '[[1,2,3],5,2]', expectedOutput: '[]', weight: 1 },
    ],
    allowedLanguages: ['javascript'],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
];

// Main seed entry point — idempotent (skips rows that already exist).
export async function runSeed() {
  console.log(`[${APP_NAME}] Seeding database (created by ${CREATOR})...`);

  // --- Demo org ----------------------------------------------------------
  let org = await Organization.findOne({ slug: 'sanchivue-demo' });
  if (!org) {
    // We need an owner first — create the interviewer, then the org, then link them.
    const interviewer = await upsertDemoUser({
      name: 'Alex Interviewer',
      email: 'interviewer@demo.dev',
      password: 'interviewer123',
      role: USER_ROLES.INTERVIEWER,
    });
    org = await Organization.create({
      name: 'Sanchivue Demo',
      slug: 'sanchivue-demo',
      ownerId: interviewer._id,
      description: `Demo organization for ${APP_NAME} development.`,
      settings: {
        aiPolicy: 'allowed',
        defaultInterviewDurationMin: 60,
        defaultTimezone: 'UTC',
        proctoringEnabled: true,
        allowedLanguages: ['javascript'],
      },
    });
    await OrganizationMember.create({
      orgId: org._id,
      userId: interviewer._id,
      role: ORG_ROLES.OWNER,
      status: 'ACTIVE',
    });
    console.log('  + demo org created (slug=sanchivue-demo)');
  } else {
    console.log('  • demo org already exists — skipping');
  }

  // --- Demo users --------------------------------------------------------
  const interviewer = await upsertDemoUser({
    name: 'Alex Interviewer',
    email: 'interviewer@demo.dev',
    password: 'interviewer123',
    role: USER_ROLES.INTERVIEWER,
  });
  // Ensure interviewer is a member of the demo org (idempotent).
  await OrganizationMember.findOneAndUpdate(
    { orgId: org._id, userId: interviewer._id },
    {
      $setOnInsert: {
        orgId: org._id,
        userId: interviewer._id,
        role: ORG_ROLES.INTERVIEWER,
        status: 'ACTIVE',
      },
    },
    { upsert: true },
  );

  const _candidate = await upsertDemoUser({
    name: 'Casey Candidate',
    email: 'candidate@demo.dev',
    password: 'candidate123',
    role: USER_ROLES.CANDIDATE,
  });
  // `_candidate` is intentionally unused — seeding ensures it exists for tests.
  void _candidate;
  console.log('  + demo accounts ready (interviewer@demo.dev / candidate@demo.dev)');

  // --- Questions ----------------------------------------------------------
  for (const q of SEED_QUESTIONS) {
    const existing = await Question.findOne({ orgId: org._id, slug: q.slug });
    if (existing) {
      console.log(`  • question "${q.title}" already exists — skipping`);
      continue;
    }
    await Question.create({
      orgId: org._id,
      title: q.title,
      slug: q.slug,
      difficulty: q.difficulty,
      tags: q.tags,
      statement: q.statement,
      constraints: q.constraints,
      examples: q.examples,
      starterCode: q.starterCode,
      publicTests: q.publicTests,
      hiddenTests: q.hiddenTests,
      optimalTime: q.optimalTime,
      optimalSpace: q.optimalSpace,
      timeLimitMs: q.timeLimitMs,
      memoryLimitMb: q.memoryLimitMb,
      allowedLanguages: q.allowedLanguages ?? ['javascript', 'python', 'java', 'cpp'],
      createdBy: interviewer._id,
    });
    console.log(`  + question seeded: ${q.title}`);
  }

  console.log(`[${APP_NAME}] Seed complete.`);
}

// Helper — create user if missing, return the doc. Doesn't re-hash if it exists.
async function upsertDemoUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password, role });
  }
  return user;
}

export default runSeed;
