import { db } from "@/lib/db";
import { hash } from "bcryptjs";

// Seed script: populates 5 classic DSA problems, 1 demo interviewer, and
// 1 demo candidate so the platform is testable immediately on first launch.
// Run via: bun run src/lib/seed.ts (also auto-invoked on server boot if empty).

interface SeedQuestion {
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  statement: string;
  constraints: string;
  examples: { input: string; output: string; explanation?: string }[];
  optimalTime: string;
  optimalSpace: string;
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  publicTests: { input: string; expectedOutput: string; explanation?: string }[];
  hiddenTests: { input: string; expectedOutput: string; weight?: number }[];
  timeLimitMs: number;
  memoryLimitMb: number;
}

const SEED_QUESTIONS: SeedQuestion[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Arrays", "Hashing"],
    statement:
      "Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice. The answer can be returned in any order.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
    ],
    optimalTime: "O(N)",
    optimalSpace: "O(N)",
    starterCode: {
      javascript:
        "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Hint: a hash map of value -> index gives O(N) time.\n  \n}",
      python: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
    },
    publicTests: [
      { input: "[[2,7,11,15],9]", expectedOutput: "[0,1]", explanation: "nums[0]+nums[1]=9" },
      { input: "[[3,2,4],6]", expectedOutput: "[1,2]" },
    ],
    hiddenTests: [
      { input: "[[3,3],6]", expectedOutput: "[0,1]", weight: 1 },
      { input: "[[1,5,8,12,13],21]", expectedOutput: "[2,3]", weight: 1 },
      { input: "[[0,4,3,0],0]", expectedOutput: "[0,3]", weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    tags: ["Stack", "Strings"],
    statement:
      "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**.\n\nA string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    optimalTime: "O(N)",
    optimalSpace: "O(N)",
    starterCode: {
      javascript:
        "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // A stack is the natural structure here.\n  \n}",
      python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
      java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
      cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
    },
    publicTests: [
      { input: '["()"]', expectedOutput: "true" },
      { input: '["()[]{}"]', expectedOutput: "true" },
    ],
    hiddenTests: [
      { input: '["(]"]', expectedOutput: "false", weight: 1 },
      { input: '["([)]"]', expectedOutput: "false", weight: 1 },
      { input: '["{[]}"]', expectedOutput: "true", weight: 1 },
      { input: '[""]', expectedOutput: "true", weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    tags: ["Arrays", "Sorting"],
    statement:
      "Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    constraints: "1 <= intervals.length <= 10^4\nintervals[i].length == 2",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since [1,3] and [2,6] overlap, merge them to [1,6].",
      },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    optimalTime: "O(N log N)",
    optimalSpace: "O(N)",
    starterCode: {
      javascript:
        "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  // Sort by start, then walk and merge.\n  \n}",
      python: "class Solution:\n    def merge(self, intervals):\n        pass",
      java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};",
    },
    publicTests: [
      {
        input: "[[[1,3],[2,6],[8,10],[15,18]]]",
        expectedOutput: "[[1,6],[8,10],[15,18]]",
      },
      { input: "[[[1,4],[4,5]]]", expectedOutput: "[[1,5]]" },
    ],
    hiddenTests: [
      { input: "[[[1,4],[0,4]]]", expectedOutput: "[[0,4]]", weight: 1 },
      { input: "[[[1,4],[2,3]]]", expectedOutput: "[[1,4]]", weight: 1 },
      { input: "[[]]", expectedOutput: "[]", weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    tags: ["Design", "Hashing", "Linked List"],
    statement:
      "Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.\n\nImplement the `LRUCache` class:\n- `LRUCache(capacity)` initializes the cache with positive size `capacity`.\n- `get(key)` returns the value of the `key` if it exists, otherwise `-1`.\n- `put(key, value)` updates the value if the key exists, otherwise inserts it. When the cache reaches capacity, evict the least recently used key.",
    constraints: "1 <= capacity <= 3000\n0 <= key <= 10^4\nget and put run in O(1) average time.",
    examples: [
      {
        input: '["LRUCache","put","put","get","put","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2]]',
        output: "[null,null,null,1,null,-1]",
      },
    ],
    optimalTime: "O(1)",
    optimalSpace: "O(capacity)",
    starterCode: {
      javascript:
        "/**\n * @param {number} capacity\n */\nfunction LRUCache(capacity) {\n  // Combine a Map (insertion-ordered) with manual eviction.\n  \n}\n/**\n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n  \n};\n/**\n * @param {number} key\n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n  \n};",
      python: "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n    def get(self, key: int) -> int:\n        pass\n    def put(self, key: int, value: int) -> None:\n        pass",
      java: "class LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    public int get(int key) {\n        \n    }\n    public void put(int key, int value) {\n        \n    }\n}",
      cpp: "class LRUCache {\npublic:\n    LRUCache(int capacity) {\n        \n    }\n    int get(int key) {\n        \n    }\n    void put(int key, int value) {\n        \n    }\n};",
    },
    publicTests: [
      // For LRU we test the get-after-put semantics with a representative
      // sequence: capacity 2, put(1,1), put(2,2), get(1) => 1.
      { input: '["LRUCache","put","put","get"]', expectedOutput: "1" },
    ],
    hiddenTests: [
      { input: '["LRUCache","put","put","get","put","get"]', expectedOutput: "-1", weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
  {
    slug: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    tags: ["Sliding Window", "Strings", "Hashing"],
    statement:
      "Given a string `s`, find the length of the **longest substring** without repeating characters.",
    constraints: "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols, and spaces.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: "The answer is 'abc', with length 3." },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3", explanation: "The answer is 'wke', with length 3." },
    ],
    optimalTime: "O(N)",
    optimalSpace: "O(min(N, charset))",
    starterCode: {
      javascript:
        "/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Sliding window with a Set/Map of seen characters.\n  \n}",
      python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass",
      java: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
      cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
    },
    publicTests: [
      { input: '["abcabcbb"]', expectedOutput: "3" },
      { input: '["bbbbb"]', expectedOutput: "1" },
    ],
    hiddenTests: [
      { input: '["pwwkew"]', expectedOutput: "3", weight: 1 },
      { input: '[""]', expectedOutput: "0", weight: 1 },
      { input: '[" "]', expectedOutput: "1", weight: 1 },
      { input: '["dvdf"]', expectedOutput: "3", weight: 1 },
    ],
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  },
];

async function seed() {
  console.log("Seeding Live Interview Platform database...");

  // Demo accounts
  const existingInterviewer = await db.user.findUnique({
    where: { email: "interviewer@demo.dev" },
  });
  if (!existingInterviewer) {
    await db.user.create({
      data: {
        email: "interviewer@demo.dev",
        password: await hash("interviewer123", 10),
        name: "Alex Interviewer",
        role: "interviewer",
      },
    });
    console.log("  + demo interviewer created (interviewer@demo.dev / interviewer123)");
  }

  const existingCandidate = await db.user.findUnique({
    where: { email: "candidate@demo.dev" },
  });
  if (!existingCandidate) {
    await db.user.create({
      data: {
        email: "candidate@demo.dev",
        password: await hash("candidate123", 10),
        name: "Casey Candidate",
        role: "candidate",
      },
    });
    console.log("  + demo candidate created (candidate@demo.dev / candidate123)");
  }

  // Questions
  for (const q of SEED_QUESTIONS) {
    const existing = await db.question.findUnique({ where: { slug: q.slug } });
    if (existing) continue;
    await db.question.create({
      data: {
        slug: q.slug,
        title: q.title,
        difficulty: q.difficulty,
        tags: JSON.stringify(q.tags),
        statement: q.statement,
        constraints: q.constraints,
        examples: JSON.stringify(q.examples),
        optimalTime: q.optimalTime,
        optimalSpace: q.optimalSpace,
        starterCode: JSON.stringify(q.starterCode),
        publicTests: JSON.stringify(q.publicTests),
        hiddenTests: JSON.stringify(q.hiddenTests),
        timeLimitMs: q.timeLimitMs,
        memoryLimitMb: q.memoryLimitMb,
      },
    });
    console.log(`  + question seeded: ${q.title}`);
  }

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
