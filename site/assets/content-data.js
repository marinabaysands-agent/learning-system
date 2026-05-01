// Content database - all articles metadata
const ARTICLES = [
  {
    id: 'cat-wu-anthropic',
    title: '给超级 AGI 做产品太容易了——难的是现在',
    subtitle: 'Anthropic 产品负责人 Cat Wu 谈为什么 PM 最稀缺的技能是「恰好正确程度的 AGI 信仰」',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=PplmzlgE0kg',
    guest: 'Cat Wu · Anthropic',
    duration: '85 min',
    date: '2026-04-23',
    tags: ['ai-product', 'leadership', 'product-management', 'speed'],
    prompts: [
      'Cat 说"恰好正确的 AGI 信仰"很难，你自己在工作中有没有因为太乐观或太保守而做错决策的时候？',
      '如果代码变得几乎免费，你现在的核心竞争力是什么？"决定写什么"这个能力你有多强？',
      'Anthropic 一天出一个功能——你团队的交付节奏是多久？瓶颈在哪？'
    ]
  },
  {
    id: 'boris-cherny-claude-code',
    title: '从 11 月起我没有手写过一行代码——Claude Code 之父的软件终局论',
    subtitle: '印刷术类比、100% AI 编码日常、"Software Engineer"将被"Builder"取代',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=We7BZVKbCVw',
    guest: 'Boris Cherny · Anthropic',
    duration: '~90 min',
    date: '2026-04-22',
    tags: ['ai-product', 'engineering', 'future-of-work'],
    prompts: [
      'Boris 说他不手写代码了——但"不写代码"和"不理解代码"是两回事。你觉得 PM 需要理解代码到什么程度？',
      '"Builder"取代"Software Engineer"这个判断你同意吗？你见过哪些非工程师背景的人用 AI 做出了好产品？',
      '如果软件生产成本趋近于零，什么东西的价值会上升？'
    ]
  },
  {
    id: 'brian-chesky-playbook',
    title: 'CEO 就该是首席产品官——别再为你想怎么管公司道歉了',
    subtitle: '砍掉 80% 项目、消灭事业部、越深入细节越有时间的悖论',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=4ef0juAMqoE',
    guest: 'Brian Chesky · Airbnb',
    duration: '73 min',
    date: '2026-04-10',
    tags: ['leadership', 'product-management', 'focus', 'org-design'],
    prompts: [
      'Chesky 砍掉 80% 项目反而更快——你团队里有什么项目其实可以砍？砍不掉的原因是什么？',
      '"越深入细节越有时间"这个悖论你怎么理解？和 Shreyas 说的"减少忙碌"矛盾吗？',
      'Chesky 消灭事业部、集中决策——这在你的组织里可行吗？为什么？'
    ]
  },
  {
    id: 'kevin-weil-openai-cpo',
    title: '今天的 AI 是你这辈子用过最差的——OpenAI CPO 的产品哲学',
    subtitle: '模型极大主义、像理解人一样理解模型、Eval 是新核心技能',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=scsW6_2SPC4',
    guest: 'Kevin Weil · OpenAI',
    duration: '~90 min',
    date: '2026-04-15',
    tags: ['ai-product', 'product-management', 'strategy'],
    prompts: [
      '"今天的 AI 是最差的"——如果你接受这个前提，你现在做的产品决策中有哪些会改变？',
      'Kevin 说要"像理解人一样理解模型"，你日常工作中花多少时间理解 AI 的能力边界？',
      'Eval 是新核心技能——你团队里谁最擅长评估 AI 输出质量？你自己呢？'
    ]
  },
  {
    id: 'shreyas-doshi-pm-questions',
    title: '你以为自己很忙？不，你只是产品决策太烂了',
    subtitle: '四个"希望自己早点问"的问题：忙碌、品味、沮丧、倾听',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=YP_QghPLG-8',
    guest: 'Shreyas Doshi · 前 Stripe/Twitter/Google',
    duration: '~40 min',
    date: '2026-04-08',
    tags: ['product-management', 'decision-making', 'self-reflection'],
    prompts: [
      'Shreyas 的四个问题里，哪个对你当前最有冲击力？为什么？',
      '"忙碌"和"产出"的区别——上周你做的事情里，有多少是真正推动产品前进的？',
      '他说要"减少忙碌"，Chesky 说要"深入细节"——这两个建议矛盾吗？你怎么调和？'
    ]
  },
  {
    id: 'marc-andreessen-ai-boom',
    title: 'AI 是炼金术——把沙子变成思想的技术',
    subtitle: '50 年技术停滞真相、PM/工程/设计的墨西哥对峙、一人公司时代',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=87Pm0SGTtN8',
    guest: 'Marc Andreessen · a16z',
    duration: '~120 min',
    date: '2026-04-12',
    tags: ['ai-product', 'strategy', 'future-of-work', 'venture-capital'],
    prompts: [
      'Marc 说过去 50 年技术在很多领域停滞了——你在自己的行业里有没有感受到这种停滞？',
      '"一人公司时代"——如果一个人能做以前十个人的工作，对你的职业意味着什么？',
      'PM/工程/设计的"墨西哥对峙"你在团队里见过吗？谁最后赢了？'
    ]
  },
  {
    id: 'marty-cagan-pm-theater',
    title: '你公司 90% 的 PM 其实是项目经理——而且他们自己不知道',
    subtitle: 'Feature Team vs. Product Team、AI 清算、Product Operating Model 的 20 条原则',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=9N4ZgNaWvI0',
    guest: 'Marty Cagan · SVPG',
    duration: '~75 min',
    date: '2026-04-05',
    tags: ['product-management', 'org-design', 'leadership'],
    prompts: [
      'Cagan 说 90% 的 PM 是项目经理——你自己日常工作中，"产品发现"和"项目管理"的时间比例是多少？',
      'Feature Team vs Product Team——你的团队更像哪一种？转型的最大阻力是什么？',
      'AI 会加速对"假 PM"的清算——你觉得哪些 PM 的工作最容易被 AI 替代？'
    ]
  },
  {
    id: 'nikita-bier-go-viral',
    title: '病毒式增长不是运气，是可以工程化的科学',
    subtitle: '15 个失败 App、App Store 第一名全是阿拉伯语、人口贩卖谣言差点杀死 Gas',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=bhnfZhJWCWY',
    guest: 'Nikita Bier · 连续创业者',
    duration: '~90 min',
    date: '2026-04-01',
    tags: ['growth', 'consumer-product', 'viral-loops'],
    prompts: [
      'Nikita 经历了 15 个失败——你觉得大多数人在第几次失败后会放弃？什么让他继续？',
      '"病毒式增长可以工程化"——你的产品有哪些可以被工程化的增长触点？',
      '他的产品几次因为外部危机（谣言、政策）差点死掉——你有没有准备过"产品危机应对"？'
    ]
  },
  {
    id: 'dalton-caldwell-yc-startups',
    title: '别死就行——看过 3000 家创业公司后，活下来才是唯一的方法论',
    subtitle: 'Brex 是 VR 头盔公司、焦油坑创意陷阱、死因从来不是没钱',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=m7LvNTbaqSI',
    guest: 'Dalton Caldwell · YC',
    duration: '~80 min',
    date: '2026-03-28',
    tags: ['startup', 'strategy', 'decision-making'],
    prompts: [
      'Dalton 说死因从来不是没钱——你见过什么项目/产品的死因表面看是资源不够，实际是什么？',
      '"焦油坑创意"——听起来很好但做起来无底洞。你当前工作中有没有这样的项目？',
      'Brex 从 VR 头盔 pivot 到金融科技——最好的 pivot 需要什么条件？'
    ]
  },
  {
    id: 'elizabeth-stone-netflix',
    title: '经济学家当 CTO，Netflix 人才密度的真正含义',
    subtitle: 'Keeper Test 的制度化不舒服、集中式数据团队、没有绩效评审怎么活',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=2XgU6T4DalY',
    guest: 'Elizabeth Stone · Netflix',
    duration: '~60 min',
    date: '2026-03-25',
    tags: ['leadership', 'org-design', 'hiring', 'culture'],
    prompts: [
      'Netflix 的 Keeper Test：如果这个人要离职，你会努力挽留吗？对你团队里的每个人，答案是什么？',
      '没有绩效评审但高人才密度——这在中国公司可行吗？文化差异在哪？',
      '集中式 vs 分布式数据团队——你倾向哪种？为什么？'
    ]
  },
  {
    id: 'jenny-wen-design-process',
    title: '设计流程已死——当工程师同时跑 7 个 Agent，设计师怎么活',
    subtitle: '在代码中打磨的最后一公里选手：设计师的新护城河不是美学，是决定做什么',
    source: 'Lenny\'s Podcast',
    sourceUrl: 'https://www.youtube.com/watch?v=eh8bcBIAAFo',
    guest: 'Jenny Wen · Anthropic',
    duration: '~75 min',
    date: '2026-04-25',
    tags: ['design', 'ai-product', 'future-of-work'],
    prompts: [
      'Jenny 说设计师的护城河不再是美学——你觉得在 AI 时代，"品味"具体指什么？',
      '工程师跑 7 个 Agent 同时开发——设计师如何跟上这个节奏而不成为瓶颈？',
      '你团队的设计流程是什么样的？哪些环节已经可以被 AI 替代？'
    ]
  }
];

// Tag definitions
const TAGS = {
  'ai-product': { label: 'AI 产品', color: 'oklch(55% 0.15 280)' },
  'leadership': { label: '领导力', color: 'oklch(55% 0.15 30)' },
  'product-management': { label: '产品管理', color: 'oklch(55% 0.15 150)' },
  'engineering': { label: '工程', color: 'oklch(55% 0.12 200)' },
  'future-of-work': { label: '未来工作', color: 'oklch(55% 0.15 310)' },
  'speed': { label: '速度', color: 'oklch(55% 0.12 60)' },
  'focus': { label: '聚焦', color: 'oklch(55% 0.12 90)' },
  'org-design': { label: '组织设计', color: 'oklch(55% 0.12 120)' },
  'strategy': { label: '战略', color: 'oklch(55% 0.12 0)' },
  'decision-making': { label: '决策', color: 'oklch(55% 0.12 45)' },
  'self-reflection': { label: '自我反思', color: 'oklch(55% 0.10 180)' },
  'venture-capital': { label: '风投', color: 'oklch(55% 0.12 240)' },
  'growth': { label: '增长', color: 'oklch(55% 0.15 140)' },
  'consumer-product': { label: '消费产品', color: 'oklch(55% 0.12 170)' },
  'viral-loops': { label: '病毒传播', color: 'oklch(55% 0.15 350)' },
  'startup': { label: '创业', color: 'oklch(55% 0.15 20)' },
  'hiring': { label: '招聘', color: 'oklch(55% 0.10 260)' },
  'culture': { label: '文化', color: 'oklch(55% 0.10 290)' },
  'design': { label: '设计', color: 'oklch(55% 0.15 320)' },
  'gtm': { label: 'GTM', color: 'oklch(55% 0.12 50)' },
  'storytelling': { label: '讲故事', color: 'oklch(55% 0.12 330)' },
  'positioning': { label: '定位', color: 'oklch(55% 0.12 75)' },
  'pricing': { label: '定价', color: 'oklch(55% 0.12 105)' },
  'time-management': { label: '时间管理', color: 'oklch(55% 0.10 210)' },
  'lifestyle': { label: '生活方式', color: 'oklch(55% 0.10 160)' },
  'seo': { label: 'SEO/AEO', color: 'oklch(55% 0.12 230)' },
  'branding': { label: '品牌', color: 'oklch(55% 0.15 340)' },
  'jtbd': { label: 'JTBD', color: 'oklch(55% 0.12 15)' },
  'pmf': { label: 'PMF', color: 'oklch(55% 0.12 135)' },
};

// Backlog items - books, videos, articles to read (no analysis page yet)
const BACKLOG = [
  {
    id: 'daniel-pink-whole-new-mind',
    title: '全新思维',
    subtitle: '设计感、故事力、交响力、共情力、娱乐感、意义感——20年前预言的六大能力，正是当下最稀缺的',
    source: '书籍',
    guest: '丹尼尔·平克',
    type: 'book',
    date: '2026-04-29',
    tags: ['future-of-work', 'design'],
    prompts: [
      '平克 20 年前提的六大能力，哪个你最缺？在 AI 时代哪个最值钱？',
      '"程序员在快餐店擦柜台"——你觉得这个预言准确吗？什么样的程序员不会？',
    ]
  },
  {
    id: 'moth-storytelling',
    title: '怎样讲好一个故事',
    subtitle: '飞蛾故事会 30 年经验：一味炫耀辉煌让人失去兴趣，邀请听众参与才是关键',
    source: '书籍',
    guest: '飞蛾故事会',
    type: 'book',
    date: '2026-04-29',
    tags: ['storytelling', 'product-management'],
    prompts: [
      '你能用飞蛾的方法，把自己最近做的一件事讲成一个故事吗？',
      '"邀请听众参与"——你的产品 pitch 里有没有做到这一点？',
    ]
  },
  {
    id: 'april-dunford-positioning',
    title: '产品定位10步法',
    subtitle: 'April Dunford：第一步不是定义自己，而是找到"如果你不存在，客户会用什么"',
    source: '书籍',
    guest: 'April Dunford',
    type: 'book',
    date: '2026-04-29',
    tags: ['positioning', 'gtm', 'product-management'],
    prompts: [
      '你的产品的竞争性替代方案是什么？如果你不存在，客户会怎么办？',
      '你的独有能力中，哪些和技术无关（服务、品位、经验）？',
    ]
  },
  {
    id: 'monetizing-innovation',
    title: '创新变现 (Monetizing Innovation)',
    subtitle: '定价是产品的核心功能——别等研发完了再拍脑袋',
    source: '书籍',
    guest: 'Madhavan Ramanujam & Georg Tacke',
    type: 'book',
    date: '2026-04-29',
    tags: ['pricing', 'product-management', 'strategy'],
    prompts: [
      '你现在的产品定价是怎么定的？有没有在研发前就验证过支付意愿？',
      '"竞争对手有啥我就有啥"这个陷阱你踩过吗？',
    ]
  },
  {
    id: 'hyper-time-management',
    title: '超高效时间管理',
    subtitle: '以周为单位：战略时间段 3h 深度工作 + 缓冲时间 30min-1h + 休息时间 ≥3h',
    source: '书籍',
    guest: '',
    type: 'book',
    date: '2026-04-29',
    tags: ['time-management'],
    prompts: [
      '你现在的工作节奏更像"日计划"还是"周计划"？试试以周为单位会怎样？',
      '上周你有多少小时是真正的"战略时间段"无干扰深度工作？',
    ]
  },
  {
    id: 'ideal-simple-life',
    title: '理想的简单生活',
    subtitle: '旅居日本的法国女作家：拥有更少，才能更自由地生活',
    source: '书籍',
    guest: 'Dominique Loreau',
    type: 'book',
    date: '2026-04-29',
    tags: ['lifestyle'],
    prompts: [
      '你生活中哪些东西其实可以做减法？',
      '"简单"和"偷懒"的区别是什么？',
    ]
  },
  {
    id: 'todd-jackson-pmf',
    title: 'Todd Jackson：寻找 PMF 的实战框架',
    subtitle: 'First Round Capital 合伙人：极致 PMF = 需求 × 满意度 × 效率',
    source: '视频/播客',
    guest: 'Todd Jackson · First Round Capital',
    type: 'video',
    date: '2026-04-29',
    tags: ['pmf', 'startup', 'gtm'],
    prompts: [
      '需求、满意度、效率——你的产品在哪个维度最弱？',
      '你怎么判断自己的产品是否达到了 PMF？用什么指标？',
    ]
  },
  {
    id: 'kane-callaway-storytelling',
    title: 'Kane Callaway：讲好故事的 5 个法则',
    subtitle: '从 Rapper 到百万 KOL：用 "But & Therefore" 逻辑重构所有销售内容',
    source: '视频/播客',
    guest: 'Kane Callaway',
    type: 'video',
    date: '2026-04-29',
    tags: ['storytelling', 'gtm', 'growth'],
    prompts: [
      '试试用 "But & Therefore" 重写你产品的一句话介绍？',
      'B2B 决策最大的敌人是"无行动"——你怎么对抗它？',
    ]
  },
  {
    id: 'ethan-smith-aeo',
    title: 'Ethan Smith：为什么 AEO 是搜索的未来',
    subtitle: 'SEO 核心原则仍适用，但 AEO 长尾更长更具体——品牌要被推荐在"答案"中',
    source: '视频/播客',
    guest: 'Ethan Smith',
    type: 'video',
    date: '2026-04-29',
    tags: ['seo', 'gtm', 'ai-product'],
    prompts: [
      '你的产品/品牌在 AI 搜索的"答案"里出现过吗？试过吗？',
      'AEO 的长尾比 SEO 更长——这对你的内容策略意味着什么？',
    ]
  },
  {
    id: 'seth-godin-brand-ai',
    title: 'Seth Godin：AI 时代如何打造非同凡响的品牌',
    subtitle: '"真实性是陷阱，一致性才是专业"——在不同时空持续做好一件事',
    source: '视频/播客',
    guest: 'Seth Godin',
    type: 'video',
    date: '2026-04-29',
    tags: ['branding', 'gtm', 'strategy'],
    prompts: [
      '"真实性 vs 一致性"——你品牌的核心承诺是什么？你一直在兑现吗？',
      'Seth 说营销本质是"让人自发传播"——你的产品有没有这样的传播点？',
    ]
  },
  {
    id: 'jtbd-hbr-christensen',
    title: 'Know Your Customers\' "Jobs to Be Done"',
    subtitle: 'Clayton Christensen 经典：焦糖布丁理论——客户"雇佣"你的产品来完成什么任务？',
    source: 'Harvard Business Review',
    guest: 'Clayton Christensen',
    type: 'article',
    url: 'https://hbr.org/2016/09/know-your-customers-jobs-to-be-done',
    date: '2026-04-29',
    tags: ['jtbd', 'product-management', 'strategy'],
    prompts: [
      '你的客户"雇佣"你的产品来完成什么任务？功能性的？情感性的？社会性的？',
      '推动力 vs 摩擦阻力——你的客户在采购决策中最大的摩擦是什么？',
      '你能不能像奶昔案例一样，找到你产品的"非典型使用场景"？',
    ]
  },
];
