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
      allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
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
