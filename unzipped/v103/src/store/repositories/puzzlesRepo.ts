import { db } from '../db';



import { energyLogsRepo } from './energyLogsRepo';
import { generateId } from './utils';
import type {
  PuzzleCampaignInstance,
  PuzzleCardProgress,
  PuzzleCardTemplate,
  PuzzleQuestInstance,
  PuzzleScoreLogEntry,
  PuzzleTemplate,
} from '../../types.gamify';

const ENERGY_BY_LEVEL: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 6,
  2: 8,
  3: 10,
  4: 12,
  5: 15,
};

function ensureCardId(card: PuzzleCardTemplate): PuzzleCardTemplate {
  if (card.id && card.id.trim().length > 0) {
    return card;
  }
  return {
    ...card,
    id: generateId(),
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function normalizeTemplateForSave(template: PuzzleTemplate): PuzzleTemplate {
  const id = template.id && template.id.trim().length > 0 ? template.id : generateId();
  const cardsSource = Array.isArray(template.cards) ? template.cards : [];
  const cards = cardsSource.map((card) => ({
    ...ensureCardId(card),
    title: card.title?.trim() ?? '未命名卡牌',
  }));
  return withTemplateNormalization({
    ...template,
    id,
    code: template.code?.trim() || undefined,
    name: template.name?.trim() ?? '未命名谜题',
    description: template.description?.trim() || undefined,
    recommendedScene: template.recommendedScene || undefined,
    recommendedAges: template.recommendedAges?.trim() || undefined,
    assignedTo: template.assignedTo ?? 'class',
    category: template.category ?? 'poem',
    tags: normalizeStringArray(template.tags),
    focusAbilities: normalizeStringArray(template.focusAbilities),
    cards,
    continueAcrossSessions: Boolean(template.continueAcrossSessions),
    difficulty: (template.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5,
  });
}

function normalizedCard(templateDifficulty: number, card: PuzzleCardTemplate): PuzzleCardTemplate {
  const level = (card.difficulty ?? templateDifficulty) as 1 | 2 | 3 | 4 | 5;
  const energy = card.reward?.energy ?? ENERGY_BY_LEVEL[level] ?? ENERGY_BY_LEVEL[3];
  return {
    ...card,
    difficulty: level,
    reward: {
      ...card.reward,
      energy,
    },
  };
}

function withTemplateNormalization(template: PuzzleTemplate): PuzzleTemplate {
  const difficulty = (template.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5;
  const cards = template.cards.map((card) => normalizedCard(difficulty, card));
  return {
    ...template,
    totalCards: cards.length,
    totalEnergy: cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0),
    cards,
  };
}




const SAMPLE_TEMPLATES: PuzzleTemplate[] = [
  {
    id: 'quest-poem-jingyesi-8',
    name: '古诗拼图 · 静夜思',
    code: 'PZ-POEM-01',
    category: 'poem',
    description: '以月光线索完成速度、耐力与情感表达挑战，逐句拼出李白的《静夜思》。',
    tags: ['诗词', '趣味感知', '情感表达'],
    assignedTo: 'class',
    difficulty: 2,
    recommendedScene: '课堂主线',
    recommendedAges: '7-10 岁',
    focusAbilities: ['speed', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'poem-jingyesi-1',
        title: '月光签到',
        type: 'speed',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索①：床前的光像雪一样亮——诗句开头是什么？',
        description: 'SR30 达成班级目标后，模仿月光动作说出首句。',
        reward: { text: '解锁“床前明月光”。' },
      },
      {
        id: 'poem-jingyesi-2',
        title: '霜色猜想',
        type: 'stamina',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索②：脚下好像铺着霜，提示下一句。',
        description: '耐力间歇两组后由伙伴接力说出“疑是地上霜”。',
        reward: { text: '霜色被点亮。' },
      },
      {
        id: 'poem-jingyesi-3',
        title: '仰望星河',
        type: 'coordination',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索③：抬头看星星，诗句里用了哪个动作？',
        description: '节奏切换训练三组后双手指天齐声朗读第三句。',
        reward: { text: '“举头望明月”被唤醒。' },
      },
      {
        id: 'poem-jingyesi-4',
        title: '低头乡音',
        type: 'strength',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索④：最后一句把思念放回心里。',
        description: '完成核心力量挑战后抱拳低头朗读。',
        reward: { text: '乡愁回到胸口。' },
      },
      {
        id: 'poem-jingyesi-5',
        title: '作者签章',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索⑤：浪漫诗人是谁？',
        description: '互赠掌声后由全班喊出“李白”并做签名动作。',
        reward: { text: '诗人签章完成。' },
      },
      {
        id: 'poem-jingyesi-6',
        title: '拼音节奏',
        type: 'coordination',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索⑥：拼音 jìng · yè · sī',
        description: '脚步按拼音节奏踩点并重复诗题。',
        reward: { text: '拼音记忆加深。' },
      },
      {
        id: 'poem-jingyesi-7',
        title: '感情朗诵',
        type: 'team',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索⑦：朗读时带上“想家的表情”。',
        description: '分组设计朗读手势并分享一次想家的经历。',
        reward: { text: '情绪表达 +1。' },
      },
      {
        id: 'poem-jingyesi-8',
        title: '月光寄语',
        type: 'team',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索⑧：把想念的人写在月光卡片上。',
        description: '课末写一句鼓励寄语贴到“月光树”上。',
        reward: { text: '整首诗拼图完成。', badge: '月光守护者' },
      },
    ],
  },
  {
    id: 'quest-poem-zaofa-8',
    name: '古诗拼图 · 早发白帝城',
    code: 'PZ-POEM-02',
    category: 'poem',
    description: '用速度、节奏和观察力体验轻舟千里的惊喜感，完成整首《早发白帝城》。',
    tags: ['诗词', '速度', '旅行想象'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '8-12 岁',
    focusAbilities: ['speed', 'coordination', 'team'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'poem-zaofa-1',
        title: '晨光冲刺',
        type: 'speed',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '任务①：用最快的冲刺喊出“朝辞白帝彩云间”。',
        description: '完成三轮爆发力冲刺后齐读首句。',
        reward: { text: '晨光线索点亮。' },
      },
      {
        id: 'poem-zaofa-2',
        title: '千里耐力',
        type: 'stamina',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '任务②：想象轻舟飞驰，一天走完千里。',
        description: '耐力训练四组，同时描述“千里江陵一日还”。',
        reward: { text: '轻舟速度被激活。' },
      },
      {
        id: 'poem-zaofa-3',
        title: '猿声回荡',
        type: 'coordination',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '任务③：模仿两岸猿声接龙节奏。',
        description: '节拍挑战中互叫口令，完成后朗读第三句。',
        reward: { text: '猿声节奏掌握。' },
      },
      {
        id: 'poem-zaofa-4',
        title: '星空问答',
        type: 'team',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '任务④：问答轻舟为何能飞快？',
        description: '小组回答并做舟划动作，朗读“轻舟已过万重山”。',
        reward: { text: '万重山被跨越。' },
      },
      {
        id: 'poem-zaofa-5',
        title: '彩云图鉴',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '任务⑤：用体态摆出彩云姿势写诗题。',
        description: '合作摆造型并亮出《早发白帝城》。',
        reward: { text: '诗题被点亮。' },
      },
      {
        id: 'poem-zaofa-6',
        title: '诗人致意',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '任务⑥：是谁写下这份惊喜？',
        description: '集体敬礼齐声喊出“李白”并表达敬意。',
        reward: { text: '诗人现身。' },
      },
      {
        id: 'poem-zaofa-7',
        title: '速度复盘',
        type: 'speed',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '任务⑦：用两次计时对比证明你的小舟也更快。',
        description: '记录两次 SR30 成绩并分享进步。',
        reward: { text: '轻舟速度真实可见。' },
      },
      {
        id: 'poem-zaofa-8',
        title: '旅程心声',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '任务⑧：说一句你想带谁一日游。',
        description: '每人写一句旅行心愿贴入旅程地图。',
        reward: { text: '旅程情感加分。' },
      },
    ],
  },
  {
    id: 'quest-poem-chunxiao-6',
    name: '古诗拼图 · 春晓',
    code: 'PZ-POEM-03',
    category: 'poem',
    description: '用音乐律动、嗅觉想象与放松动作唤醒《春晓》，适合低年级趣味课堂。',
    tags: ['诗词', '感官体验', '放松调节'],
    assignedTo: 'class',
    difficulty: 1,
    recommendedScene: '课堂主线',
    recommendedAges: '6-9 岁',
    focusAbilities: ['coordination'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'poem-chunxiao-1',
        title: '春风呼吸',
        type: 'coordination',
        skin: 'poem',
        difficulty: 1,
        fragmentText: '线索①：春眠不觉晓——用三次深呼吸叫醒身体。',
        description: '进行呼吸唤醒操并朗读首句。',
        reward: { text: '春天被叫醒。' },
      },
      {
        id: 'poem-chunxiao-2',
        title: '鸟鸣节奏',
        type: 'speed',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索②：处处闻啼鸟——模仿鸟鸣节奏跳绳。',
        description: '快慢节拍轮换两轮并发出鸟鸣。',
        reward: { text: '鸟鸣环绕耳边。' },
      },
      {
        id: 'poem-chunxiao-3',
        title: '风雨脚步',
        type: 'stamina',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索③：夜来风雨声——雨点是你的脚步声。',
        description: '耐力跳绳 90 秒并用脚步敲击节奏。',
        reward: { text: '风雨律动掌握。' },
      },
      {
        id: 'poem-chunxiao-4',
        title: '落花游戏',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索④：花落知多少——猜猜今天掉了几朵花？',
        description: '合作完成花样配合并把彩纸花抛向空中。',
        reward: { text: '花落笑声飘起。' },
      },
      {
        id: 'poem-chunxiao-5',
        title: '拼音律动',
        type: 'coordination',
        skin: 'poem',
        difficulty: 1,
        fragmentText: '线索⑤：chūn · xiǎo——跳出拼音节奏。',
        description: '脚步踩拼音格子并齐声拼读。',
        reward: { text: '语文与运动连线。' },
      },
      {
        id: 'poem-chunxiao-6',
        title: '诗人问候',
        type: 'team',
        skin: 'poem',
        difficulty: 1,
        fragmentText: '线索⑥：写下这首诗的朋友叫什么名字？',
        description: '传递花瓣卡片说出“孟浩然”，并表达感谢。',
        reward: { text: '春日问候完成。' },
      },
    ],
  },
  {
    id: 'quest-poem-dengguanquelou-6',
    name: '古诗拼图 · 登鹳雀楼',
    code: 'PZ-POEM-04',
    category: 'poem',
    description: '用阶梯挑战和视觉延伸完成千里远眺的想象练习。',
    tags: ['诗词', '阶梯挑战', '视野拓展'],
    assignedTo: 'class',
    difficulty: 2,
    recommendedScene: '课堂主线',
    recommendedAges: '8-12 岁',
    focusAbilities: ['coordination', 'team'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'poem-deng-1',
        title: '夕阳节拍',
        type: 'speed',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索①：白日依山尽——做 30 秒夕阳冲刺。',
        description: '冲刺后指向远方朗读首句。',
        reward: { text: '夕阳落山。' },
      },
      {
        id: 'poem-deng-2',
        title: '黄河推理',
        type: 'coordination',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索②：黄河入海流——身体画出河流曲线。',
        description: '完成协调组合动作并描述河流颜色。',
        reward: { text: '黄河奔入海洋。' },
      },
      {
        id: 'poem-deng-3',
        title: '千里望远镜',
        type: 'coordination',
        skin: 'poem',
        difficulty: 3,
        fragmentText: '线索③：欲穷千里目——摆出望远镜姿势找线索。',
        description: '梯形步伐练习后使用“望远镜动作”找下一卡片。',
        reward: { text: '千里目开启。' },
      },
      {
        id: 'poem-deng-4',
        title: '登楼仪式',
        type: 'team',
        skin: 'poem',
        difficulty: 4,
        fragmentText: '线索④：更上一层楼——谁能喊出更高的目标？',
        description: '团队完成终极花样并写下自己下一层目标。',
        reward: { text: '整队更上一层楼！', badge: '登楼勇士' },
      },
      {
        id: 'poem-deng-5',
        title: '诗题点亮',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索⑤：请用身体摆出“鹳雀楼”。',
        description: '合作造型亮出诗题并拍照留念。',
        reward: { text: '诗题闪耀。' },
      },
      {
        id: 'poem-deng-6',
        title: '诗人致谢',
        type: 'team',
        skin: 'poem',
        difficulty: 2,
        fragmentText: '线索⑥：王之涣在楼上向你挥手。',
        description: '做拱手礼并齐声说“谢谢王之涣”。',
        reward: { text: '敬意送达。' },
      },
    ],
  },
  {
    id: 'quest-moti-keep-rhythm-8',
    name: '智慧语录 · 坚持的节奏',
    code: 'PZ-MOTI-01',
    category: 'wisdom',
    description: '每翻一张卡都会出现一段“坚持箴言”，结合节奏训练帮助孩子把勇气说出口。',
    tags: ['智慧语', '节奏训练', '自我对话'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '8-13 岁',
    focusAbilities: ['speed', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'moti-keep-1',
        title: '箴言起步',
        type: 'speed',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '金句①：节奏是心里的鼓点，勇敢的人先敲第一下。',
        description: '热身完成后分享今天想敲响的“第一下”。',
        reward: { text: '鼓点启动。' },
      },
      {
        id: 'moti-keep-2',
        title: '汗水签名',
        type: 'strength',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '金句②：汗水是写在地板上的签名。',
        description: '完成力量组合后在空气中写下自己的名字。',
        reward: { text: '签名被记录。' },
      },
      {
        id: 'moti-keep-3',
        title: '节拍接力',
        type: 'coordination',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '金句③：节拍会帮你记住坚持的次数。',
        description: '节奏训练三组，伙伴互数坚持次数。',
        reward: { text: '节拍记忆 +1。' },
      },
      {
        id: 'moti-keep-4',
        title: '勇气换气',
        type: 'speed',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '金句④：喘气时说一句“我还可以再来一次”。',
        description: '专项测试后大声说出自我鼓励语。',
        reward: { text: '勇气声量升级。' },
      },
      {
        id: 'moti-keep-5',
        title: '伙伴见证',
        type: 'stamina',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '金句⑤：当你坚持时，伙伴就能看见新的你。',
        description: '间歇训练完成后互写一句夸赞。',
        reward: { text: '伙伴见证成长。' },
      },
      {
        id: 'moti-keep-6',
        title: '心跳共鸣',
        type: 'team',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '金句⑥：把手放在心口，听听它的节奏。',
        description: '与搭档同步心跳动作 20 秒。',
        reward: { text: '心跳节奏同步。' },
      },
      {
        id: 'moti-keep-7',
        title: '翻牌宣言',
        type: 'team',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '金句⑦：翻开最后一张卡前，先说“感谢一路陪伴的人”。',
        description: '课末互相握手致谢。',
        reward: { text: '感谢仪式完成。' },
      },
      {
        id: 'moti-keep-8',
        title: '终曲闪耀',
        type: 'team',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '金句⑧：坚持的孩子最后都会发光。',
        description: '集合成圈向上举手，喊出“我们发光”。',
        reward: { text: '班级光环亮起。' },
      },
    ],
  },
  {
    id: 'quest-moti-bravery-light-8',
    name: '智慧语录 · 勇气之光',
    code: 'PZ-MOTI-02',
    category: 'wisdom',
    description: '把战前紧张转化成勇气咒语，每一步挑战都照亮“勇气之灯”。',
    tags: ['勇气', '自信构建', '赛前动员'],
    assignedTo: 'class',
    difficulty: 4,
    recommendedScene: '课堂主线',
    recommendedAges: '10-15 岁',
    focusAbilities: ['team', 'power'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'moti-brave-1',
        title: '火花觉醒',
        type: 'power',
        skin: 'quote',
        difficulty: 4,
        fragmentText: '勇气语①：当你点燃火花，恐惧就退到身后。',
        description: '完成爆发力挑战并喊出“火花已亮”。',
        reward: { text: '勇气火花点燃。' },
      },
      {
        id: 'moti-brave-2',
        title: '道路照明',
        type: 'team',
        skin: 'quote',
        difficulty: 4,
        fragmentText: '勇气语②：把灯照向前方，也照向伙伴。',
        description: '合作完成队形切换，彼此肩碰肩。',
        reward: { text: '道路被照亮。' },
      },
      {
        id: 'moti-brave-3',
        title: '伙伴誓言',
        type: 'team',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '勇气语③：战场上没有孤单。',
        description: '互写“勇气宣言”贴在勇气板上。',
        reward: { text: '伙伴誓言成立。' },
      },
      {
        id: 'moti-brave-4',
        title: '稳住脚步',
        type: 'stamina',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '勇气语④：稳住脚步，给下一次冲刺铺路。',
        description: '耐力测试达标后记录心率恢复。',
        reward: { text: '脚步更稳。' },
      },
      {
        id: 'moti-brave-5',
        title: '迎风微笑',
        type: 'coordination',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '勇气语⑤：面对风雨，请给自己一个笑容。',
        description: '节奏变速挑战时保持微笑完成。',
        reward: { text: '笑容驱散紧张。' },
      },
      {
        id: 'moti-brave-6',
        title: '旗帜飞扬',
        type: 'team',
        skin: 'quote',
        difficulty: 4,
        fragmentText: '勇气语⑥：旗帜在你手中摇摆时，勇气正在传递。',
        description: '队长领喊口号并挥舞队旗。',
        reward: { text: '队旗飘扬。' },
      },
      {
        id: 'moti-brave-7',
        title: '拥抱挑战',
        type: 'team',
        skin: 'quote',
        difficulty: 3,
        fragmentText: '勇气语⑦：张开双臂，挑战会变成朋友。',
        description: '做拥抱动作并说出想突破的项目。',
        reward: { text: '挑战变朋友。' },
      },
      {
        id: 'moti-brave-8',
        title: '光芒终章',
        type: 'team',
        skin: 'quote',
        difficulty: 4,
        fragmentText: '勇气语⑧：当灯光照亮赛道，你也照亮别人。',
        description: '全班围成光圈并把手心朝上。',
        reward: { text: '勇气之光照亮全场。' },
      },
    ],
  },
  {
    id: 'quest-moti-rhythm-confidence-6',
    name: '智慧语录 · 节奏自信',
    code: 'PZ-MOTI-03',
    category: 'wisdom',
    description: '用六句“自信口令”帮助孩子在花样展示前找回节奏感。',
    tags: ['自信建立', '花样展示', '呼吸调节'],
    assignedTo: 'class',
    difficulty: 2,
    recommendedScene: '课堂主线',
    recommendedAges: '8-12 岁',
    focusAbilities: ['coordination'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'moti-rhythm-1',
        title: '节拍收心',
        type: 'coordination',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令①：听见节拍，就等于握住方向盘。',
        description: '节奏热身跟拍完成后说出口令。',
        reward: { text: '方向盘稳稳握住。' },
      },
      {
        id: 'moti-rhythm-2',
        title: '绳影点亮',
        type: 'speed',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令②：绳影是我写下的光。',
        description: '速度段达标后分享今日“最亮瞬间”。',
        reward: { text: '绳影化作光。' },
      },
      {
        id: 'moti-rhythm-3',
        title: '抬头微笑',
        type: 'team',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令③：抬头时请把微笑送给朋友。',
        description: '搭档互评笑容并完成对视击掌。',
        reward: { text: '舞台感 +1。' },
      },
      {
        id: 'moti-rhythm-4',
        title: '呼吸护航',
        type: 'stamina',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令④：深呼吸像是自己的护航船。',
        description: '完成呼吸调节练习两轮。',
        reward: { text: '护航船待命。' },
      },
      {
        id: 'moti-rhythm-5',
        title: '同频伙伴',
        type: 'team',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令⑤：同频的伙伴让动作更好看。',
        description: '搭档花样成功后互敬礼。',
        reward: { text: '同频星光亮起。' },
      },
      {
        id: 'moti-rhythm-6',
        title: '眼神收官',
        type: 'team',
        skin: 'quote',
        difficulty: 2,
        fragmentText: '口令⑥：收官时记得向观众点头。',
        description: '课末全班一起鞠躬致谢。',
        reward: { text: '舞台谢幕完成。' },
      },
    ],
  },
  {
    id: 'quest-emoji-star-runner-6',
    name: '脑洞暗号 · 星速勇士',
    code: 'PZ-RIDDLE-01',
    category: 'riddle',
    description: '用 Emoji 暗号结合身体挑战解开星速勇士的六个谜题，锻炼反应与联想力。',
    tags: ['脑筋急转弯', '趣味联想', '速度'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '9-13 岁',
    focusAbilities: ['speed', 'coordination'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'emoji-star-1',
        title: '电光猜词',
        type: 'speed',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '谜语①：🧠⚡=？ 提示：反应越快越厉害。',
        description: '完成反应拍手接龙后猜出“灵感闪现”。',
        reward: { text: '灵感碎片拿到手。' },
      },
      {
        id: 'emoji-star-2',
        title: '火腿冲刺',
        type: 'strength',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '谜语②：🦵🔥=？ 提示：训练前要热身。',
        description: '完成下肢力量挑战并回答“热腿加速器”。',
        reward: { text: '火焰腿装配完成。' },
      },
      {
        id: 'emoji-star-3',
        title: '笑脸耐力',
        type: 'stamina',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '谜语③：💧😊=？ 提示：坚持后会笑。',
        description: '耐力段完成同时分享坚持让自己开心的理由。',
        reward: { text: '得到“汗水笑脸”徽记。' },
      },
      {
        id: 'emoji-star-4',
        title: '目标锁定',
        type: 'coordination',
        skin: 'emoji',
        difficulty: 2,
        fragmentText: '谜语④：🎯👀=？ 提示：眼睛盯着目标。',
        description: '花样动作保持专注，猜出“锁定焦点”。',
        reward: { text: '焦点之眼点亮。' },
      },
      {
        id: 'emoji-star-5',
        title: '梯级伙伴',
        type: 'team',
        skin: 'emoji',
        difficulty: 2,
        fragmentText: '谜语⑤：🪜🤝=？ 提示：伙伴像梯子一样互相扶持。',
        description: '团队依次完成挑战并回答“互助阶梯”。',
        reward: { text: '互助阶梯建立。' },
      },
      {
        id: 'emoji-star-6',
        title: '星光揭晓',
        type: 'team',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '谜语⑥：⭐📣=？ 提示：把光分享出去。',
        description: '全班互赠掌声并喊出“星速勇士”。',
        reward: { text: '星速徽章亮起。', badge: '星速勇士' },
      },
    ],
  },
  {
    id: 'quest-emoji-team-pulse-6',
    name: '脑洞暗号 · 战队脉冲',
    code: 'PZ-RIDDLE-02',
    category: 'riddle',
    description: '战队成员用 Emoji 暗号推理团队状态并完成合作挑战，建立荣誉语言。',
    tags: ['脑筋急转弯', '团队沟通', '荣誉感'],
    assignedTo: 'team',
    difficulty: 4,
    recommendedScene: '战队挑战',
    recommendedAges: '10-15 岁',
    focusAbilities: ['team'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'emoji-team-1',
        title: '集结密码',
        type: 'team',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '暗号①：👥🔔=？ 答案代表“集合”。',
        description: '战队签到完成并喊出“全员到齐”。',
        reward: { text: '战队上线。' },
      },
      {
        id: 'emoji-team-2',
        title: '心跳节拍',
        type: 'speed',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '暗号②：❤️🎵=？ 提示：节拍和心跳要同频。',
        description: '同步节奏跑完成并回答“心跳节奏”。',
        reward: { text: '节拍心跳同步。' },
      },
      {
        id: 'emoji-team-3',
        title: '能量转盘',
        type: 'stamina',
        skin: 'emoji',
        difficulty: 4,
        fragmentText: '暗号③：🔋⚙️=？ 提示：团队在充电。',
        description: '耐力接力完成并写下自己贡献的能量值。',
        reward: { text: '战队能量加 10⚡。' },
      },
      {
        id: 'emoji-team-4',
        title: '战术星图',
        type: 'team',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '暗号④：🗣️🧭=？ 提示：讨论后方向明确。',
        description: '团队策略讨论三分钟后展示路线。',
        reward: { text: '战术星图绘制完成。' },
      },
      {
        id: 'emoji-team-5',
        title: '荣誉击掌',
        type: 'team',
        skin: 'emoji',
        difficulty: 2,
        fragmentText: '暗号⑤：🖐️✨=？ 提示：击掌时会冒光。',
        description: '完成目标后集体击掌并说“荣誉到手”。',
        reward: { text: '荣誉火花绽放。' },
      },
      {
        id: 'emoji-team-6',
        title: '战队封印',
        type: 'team',
        skin: 'emoji',
        difficulty: 3,
        fragmentText: '暗号⑥：🏆📒=？ 提示：把胜利写进档案。',
        description: '在荣誉墙记录成果并贴上团队箴言。',
        reward: { text: '战队脉冲封印成功。', badge: '战队脉冲' },
      },
    ],
  },
  {
    id: 'quest-energy-totem-9',
    name: '能量图腾 · 星核点亮',
    code: 'PZ-TOTEM-01',
    category: 'science',
    description: '九块能量碎片对应九个运动科学概念，帮助学生把训练感受与知识对齐。',
    tags: ['运动科学', '能量感知', '团队共鸣'],
    assignedTo: 'team',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '8-13 岁',
    focusAbilities: ['team', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'totem-1',
        title: '激活星核',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点①：热身让肌肉像星核一样苏醒。',
        description: '全队完成热身仪式并说出激活的肌肉名称。',
        reward: { text: '星核启动。' },
      },
      {
        id: 'totem-2',
        title: '速度能量',
        type: 'speed',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点②：速度需要快速神经通路。',
        description: '速度接力完成后分享自己的“快速信号”。',
        reward: { text: '能量导入图腾。' },
      },
      {
        id: 'totem-3',
        title: '协调神经',
        type: 'coordination',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点③：协调来自大脑与肌肉的对话。',
        description: '节奏组合动作完成后描述身体反馈。',
        reward: { text: '神经对话同步。' },
      },
      {
        id: 'totem-4',
        title: '体能补给',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点④：补水让能量循环完整。',
        description: '互相提醒喝水并记录补水时间。',
        reward: { text: '补给站点亮。' },
      },
      {
        id: 'totem-5',
        title: '肌群觉醒',
        type: 'strength',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点⑤：力量来自肌纤维招募。',
        description: '完成核心挑战并摸一摸发力部位。',
        reward: { text: '肌群亮灯。' },
      },
      {
        id: 'totem-6',
        title: '心肺节奏',
        type: 'stamina',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点⑥：心率回落代表恢复速度。',
        description: '耐力冲刺后测心率，记录恢复时间。',
        reward: { text: '心肺面板解锁。' },
      },
      {
        id: 'totem-7',
        title: '光束冲刺',
        type: 'speed',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '科学点⑦：冲刺需要地面反作用力。',
        description: '最后冲刺挑战时注意蹬伸动作并分享体感。',
        reward: { text: '冲刺能量爆发。' },
      },
      {
        id: 'totem-8',
        title: '脑力问答',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '科学点⑧：补充知识能强化训练计划。',
        description: '团队完成运动科学快问快答。',
        reward: { text: '知识星门开启。' },
      },
      {
        id: 'totem-9',
        title: '荣誉升腾',
        type: 'team',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '科学点⑨：恢复 + 记录 = 长期成长。',
        description: '庆祝仪式并写下今日科学心得。',
        reward: { text: '图腾全亮，荣誉加冕！', badge: '星核守护者' },
      },
    ],
  },
  {
    id: 'quest-mosaic-element-core-9',
    name: '能量图腾 · 元素之心',
    code: 'PZ-TOTEM-02',
    category: 'science',
    description: '九种自然元素对应九种训练能力，孩子们在任务中理解动作原理。',
    tags: ['运动科学', '自然联想', '动作原理'],
    assignedTo: 'class',
    difficulty: 4,
    recommendedScene: '课堂主线',
    recommendedAges: '10-15 岁',
    focusAbilities: ['speed', 'power', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'element-1',
        title: '风之律动',
        type: 'speed',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '元素①：风代表步频——脚步越轻越快。',
        description: '高速节奏练习并想象风穿过身体。',
        reward: { text: '风元素充能。' },
      },
      {
        id: 'element-2',
        title: '雷之爆发',
        type: 'power',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '元素②：雷代表爆发——一次跳起像雷鸣。',
        description: '爆发跳跃挑战并记录最佳高度。',
        reward: { text: '雷鸣爆发。' },
      },
      {
        id: 'element-3',
        title: '水之流动',
        type: 'coordination',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '元素③：水代表连贯——动作像水流不间断。',
        description: '柔韧协调串联，伙伴点评流畅度。',
        reward: { text: '水流顺畅。' },
      },
      {
        id: 'element-4',
        title: '火之热度',
        type: 'stamina',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '元素④：火代表耐力——保持热量不熄灭。',
        description: '高强度耐力完成后记录呼吸节奏。',
        reward: { text: '火焰燃烧。' },
      },
      {
        id: 'element-5',
        title: '土之稳固',
        type: 'strength',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '元素⑤：土代表稳定——脚下像扎根大地。',
        description: '核心+下肢稳定训练并描绘“土纹”。',
        reward: { text: '土地稳固。' },
      },
      {
        id: 'element-6',
        title: '光之照耀',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '元素⑥：光代表鼓励——给队友照一束光。',
        description: '团队互助展示并说一句鼓励话。',
        reward: { text: '光线照耀团队。' },
      },
      {
        id: 'element-7',
        title: '影之同步',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '元素⑦：影代表默契——影子跟随不掉队。',
        description: '影子舞协作完成并保持同频。',
        reward: { text: '影子律动统一。' },
      },
      {
        id: 'element-8',
        title: '心之连结',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '元素⑧：心代表感恩——说出感谢对象。',
        description: '分享今日感谢并击掌回应。',
        reward: { text: '心灵连结。' },
      },
      {
        id: 'element-9',
        title: '元素合一',
        type: 'team',
        skin: 'mosaic',
        difficulty: 4,
        fragmentText: '元素⑨：合一代表平衡——九种元素一起闪光。',
        description: '总结今日心得并进行能量仪式。',
        reward: { text: '元素之心点亮！', badge: '元素守护者' },
      },
    ],
  },
  {
    id: 'quest-story-save-planet-10',
    name: '情境故事 · 拯救能量星球',
    code: 'PZ-STORY-01',
    category: 'story',
    description: '通过十个章节修复能量星球的心脏，融入动感任务、情绪表达和荣誉仪式。',
    tags: ['故事冒险', '情绪表达', '团队合作'],
    assignedTo: 'class',
    difficulty: 4,
    recommendedScene: '课堂主线',
    recommendedAges: '8-14 岁',
    focusAbilities: ['team', 'stamina', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'story-save-1',
        title: '求救信号',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节①：星球心跳减弱，向地球发出求救。',
        description: '开营仪式 + 分工，写下自己的星球身份。',
        reward: { text: '任务接收。' },
      },
      {
        id: 'story-save-2',
        title: '能量碎裂',
        type: 'coordination',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节②：核心被分成十片碎片。',
        description: '节奏挑战完成后找到第一片碎片。',
        reward: { text: '碎片 1 收集。' },
      },
      {
        id: 'story-save-3',
        title: '风暴走廊',
        type: 'stamina',
        skin: 'story',
        difficulty: 4,
        fragmentText: '章节③：必须穿越风暴带，心态保持稳定。',
        description: '耐力训练达到目标同时调整呼吸。',
        reward: { text: '风暴突破。' },
      },
      {
        id: 'story-save-4',
        title: '修复工坊',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节④：组装能量修复器。',
        description: '团队协作拼搭 + 互评沟通技巧。',
        reward: { text: '修复器完成。' },
      },
      {
        id: 'story-save-5',
        title: '勇士升级',
        type: 'speed',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节⑤：战服升级需要速度证明。',
        description: '速度训练刷新个人纪录。',
        reward: { text: '勇士升级 +1。' },
      },
      {
        id: 'story-save-6',
        title: '心跳共鸣',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节⑥：心跳同步仪式恢复星球节奏。',
        description: '团队同步跳完成并聆听彼此心跳。',
        reward: { text: '心跳共鸣成功。' },
      },
      {
        id: 'story-save-7',
        title: '能量回廊',
        type: 'coordination',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节⑦：穿越光线回廊收集数据。',
        description: '敏捷梯训练完成并分享最佳步法。',
        reward: { text: '光线数据收集。' },
      },
      {
        id: 'story-save-8',
        title: '核心复位',
        type: 'team',
        skin: 'story',
        difficulty: 4,
        fragmentText: '章节⑧：团队需要同时按下十个按钮。',
        description: '终极合作挑战完成。',
        reward: { text: '核心复位成功。' },
      },
      {
        id: 'story-save-9',
        title: '星球苏醒',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节⑨：星球重新发光，需要记录心情。',
        description: '班级庆祝仪式 + 情绪分享。',
        reward: { text: '星球苏醒，能量 +30⚡。' },
      },
      {
        id: 'story-save-10',
        title: '勇士封勋',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '章节⑩：颁发“能量勇士”荣誉。',
        description: '颁发徽章并写下给星球的祝福。',
        reward: { text: '勇士封勋完成。', badge: '能量勇士' },
      },
    ],
  },
  {
    id: 'quest-story-time-explorer-10',
    name: '情境故事 · 时空探险队',
    code: 'PZ-STORY-02',
    category: 'story',
    description: '穿越古代、未来与星际的十个站点，结合历史知识、科学问答与运动挑战。',
    tags: ['故事探险', '跨学科', '周期成长'],
    assignedTo: 'class',
    difficulty: 5,
    recommendedScene: '课堂主线',
    recommendedAges: '10-15 岁',
    focusAbilities: ['stamina', 'speed', 'team'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'story-time-1',
        title: '集结令',
        type: 'team',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点①：接收探险任务并建立队规。',
        description: '开营仪式 + 分工写探险誓词。',
        reward: { text: '探险队成立。' },
      },
      {
        id: 'story-time-2',
        title: '古代步法',
        type: 'coordination',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点②：学习古代战鼓步伐。',
        description: '完成古风步伐挑战并分享历史小知识。',
        reward: { text: '古代碎片解锁。' },
      },
      {
        id: 'story-time-3',
        title: '蒸汽能量',
        type: 'stamina',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点③：蒸汽时代考验耐力。',
        description: '耐力阶段训练达标并记录心率。',
        reward: { text: '蒸汽能量收集。' },
      },
      {
        id: 'story-time-4',
        title: '电光实验',
        type: 'speed',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点④：电光闪耀，需要刷新速度。',
        description: '速度试炼刷新纪录并记录反应时间。',
        reward: { text: '电光闪耀。' },
      },
      {
        id: 'story-time-5',
        title: '未来实验',
        type: 'power',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点⑤：未来力量实验室招募测试员。',
        description: '力量训练完成后写下最想升级的技能。',
        reward: { text: '力量模块修复。' },
      },
      {
        id: 'story-time-6',
        title: '星际航道',
        type: 'team',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点⑥：拼出星际航道图。',
        description: '团队协作完成航道拼图并解读坐标。',
        reward: { text: '航道启动。' },
      },
      {
        id: 'story-time-7',
        title: '时空问答',
        type: 'coordination',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点⑦：穿越迷宫需要回答脑洞问题。',
        description: '结合脑筋急转弯完成敏捷梯任务。',
        reward: { text: '时空迷宫突破。' },
      },
      {
        id: 'story-time-8',
        title: '终极试炼',
        type: 'team',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点⑧：终极试炼需要同心协力。',
        description: '团队完成多环节接力 + 心态调节。',
        reward: { text: '终极试炼完成。' },
      },
      {
        id: 'story-time-9',
        title: '归位仪式',
        type: 'team',
        skin: 'story',
        difficulty: 3,
        fragmentText: '站点⑨：带回时代碎片并举行仪式。',
        description: '班级庆典 + 互赠感谢卡。',
        reward: { text: '时空归位。' },
      },
      {
        id: 'story-time-10',
        title: '勇士封印',
        type: 'team',
        skin: 'story',
        difficulty: 4,
        fragmentText: '站点⑩：颁发时空探险徽章。',
        description: '颁发徽章并制定下一次探险计划。',
        reward: { text: '时空探险勋章到手。' },
      },
    ],
  },
  {
    id: 'quest-math-speed-lock-8',
    name: '趣味数学 · 极速等式锁',
    code: 'PZ-MATH-01',
    category: 'math',
    description: '结合速度训练和等式推理解锁答案，适合冲刺期的趣味数学挑战。',
    tags: ['逻辑', '算术', '冲刺'],
    assignedTo: 'class',
    difficulty: 4,
    recommendedScene: '课堂主线',
    recommendedAges: '10-15 岁',
    focusAbilities: ['speed', 'coordination'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'math-speed-1',
        title: '变量起跑',
        type: 'speed',
        skin: 'math',
        difficulty: 4,
        fragmentText: '等式①：A + B = SR60 今日成绩',
        description: '完成 SR60 计时后把结果填入等式。',
        reward: { text: '变量 A、B 被唤醒。' },
      },
      {
        id: 'math-speed-2',
        title: '比例转弯',
        type: 'coordination',
        skin: 'math',
        difficulty: 4,
        fragmentText: '等式②：B ÷ 2 = 今日节奏成功次数',
        description: '完成节奏转换练习并记录成功次数。',
        reward: { text: 'B 的线索明确。' },
      },
      {
        id: 'math-speed-3',
        title: '耐力加法',
        type: 'stamina',
        skin: 'math',
        difficulty: 4,
        fragmentText: '等式③：C + 5 = 核心训练完成组数',
        description: '完成核心训练，算出 C 的值。',
        reward: { text: 'C 的答案浮现。' },
      },
      {
        id: 'math-speed-4',
        title: '协作联立',
        type: 'team',
        skin: 'math',
        difficulty: 4,
        fragmentText: '等式④：A - D = 小组平均进步值',
        description: '团队讨论各自进步值，联立求 D。',
        reward: { text: 'D 被成功推理。' },
      },
      {
        id: 'math-speed-5',
        title: '终极求解',
        type: 'speed',
        skin: 'math',
        difficulty: 4,
        fragmentText: '等式⑤：求出 A、B、C、D 的最终值',
        description: '进行最终速度挑战并公布答案。',
        reward: { text: '等式全部解锁。' },
      },
      {
        id: 'math-speed-6',
        title: '验证环节',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '任务：互检答案，解释计算过程。',
        description: '分组互换纸条验证等式。',
        reward: { text: '答案通过验证。' },
      },
      {
        id: 'math-speed-7',
        title: '策略分享',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '任务：写下本次突破用到的数学策略。',
        description: '小组分享如何快速推算。',
        reward: { text: '策略宝典成册。' },
      },
      {
        id: 'math-speed-8',
        title: '荣誉授勋',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '奖励：颁发“极速算术”勇士徽章',
        description: '班级为表现突出的小组授勋。',
        reward: { text: '数学勇士诞生。', badge: '极速算术' },
      },
    ],
  },
  {
    id: 'quest-math-energy-code-8',
    name: '趣味数学 · 能量密码本',
    code: 'PZ-MATH-02',
    category: 'math',
    description: '以能量数据为密码素材，鼓励孩子记录训练数值并进行脑洞计算。',
    tags: ['逻辑', '能量', '数据记录'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '9-13 岁',
    focusAbilities: ['coordination', 'team'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'math-energy-1',
        title: '密码段一',
        type: 'coordination',
        skin: 'math',
        difficulty: 3,
        fragmentText: '密码①：E1 = 今日步频 × 2',
        description: '记录步频数据写入能量本。',
        reward: { text: '密码段一完成。' },
      },
      {
        id: 'math-energy-2',
        title: '密码段二',
        type: 'speed',
        skin: 'math',
        difficulty: 3,
        fragmentText: '密码②：E2 = SR30 ÷ 3',
        description: '速度测试记录后计算 E2。',
        reward: { text: '密码段二完成。' },
      },
      {
        id: 'math-energy-3',
        title: '密码段三',
        type: 'stamina',
        skin: 'math',
        difficulty: 3,
        fragmentText: '密码③：E3 = 核心次数 + 5',
        description: '填写核心训练完成次数。',
        reward: { text: '密码段三完成。' },
      },
      {
        id: 'math-energy-4',
        title: '密码段四',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '密码④：E4 = 战队积分 ÷ 2',
        description: '核对战队积分并记录结果。',
        reward: { text: '密码段四完成。' },
      },
      {
        id: 'math-energy-5',
        title: '总和解锁',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '密码⑤：E = E1 + E2 + E3 + E4',
        description: '计算总能量并写下对应奖励。',
        reward: { text: '能量密码生成。' },
      },
      {
        id: 'math-energy-6',
        title: '奖励兑换',
        type: 'team',
        skin: 'math',
        difficulty: 2,
        fragmentText: '任务：用能量值兑换课堂奖励。',
        description: '根据总能量选择适合的奖励。',
        reward: { text: '能量兑换成功。' },
      },
      {
        id: 'math-energy-7',
        title: '策略分享',
        type: 'team',
        skin: 'math',
        difficulty: 2,
        fragmentText: '任务：分享提高能量值的小窍门。',
        description: '学生互相讲述训练策略。',
        reward: { text: '策略共享完成。' },
      },
      {
        id: 'math-energy-8',
        title: '荣誉加成',
        type: 'team',
        skin: 'math',
        difficulty: 3,
        fragmentText: '奖励：荣誉加成 +10⚡',
        description: '班级举行能量加冕仪式。',
        reward: { text: '荣誉加成完成。' },
      },
    ],
  },
  {
    id: 'quest-science-body-lab-8',
    name: '运动科学 · 身体小百科',
    code: 'PZ-SCI-01',
    category: 'science',
    description: '结合训练知识点翻开身体小百科，帮助学生理解身体如何支持跳绳表现。',
    tags: ['科学', '身体认知', '课堂拓展'],
    assignedTo: 'class',
    difficulty: 2,
    recommendedScene: '课堂主线',
    recommendedAges: '8-12 岁',
    focusAbilities: ['coordination'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'science-body-1',
        title: '心率调频',
        type: 'stamina',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识①：心率是身体的鼓点，热身能让鼓点稳定。',
        description: '测量热身前后心率并记录差值。',
        reward: { text: '了解心率变化。' },
      },
      {
        id: 'science-body-2',
        title: '肌肉协作',
        type: 'strength',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识②：肌肉像小伙伴一起发力。',
        description: '完成力量练习时说出感受到的肌肉。',
        reward: { text: '认识肌肉协同。' },
      },
      {
        id: 'science-body-3',
        title: '关节保护',
        type: 'coordination',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识③：关节需要润滑动作来预防受伤。',
        description: '关节活动到位并记录最喜欢的关节操。',
        reward: { text: '关节准备就绪。' },
      },
      {
        id: 'science-body-4',
        title: '呼吸节奏',
        type: 'stamina',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识④：鼻吸口呼能帮助恢复速度。',
        description: '完成呼吸调节练习并分享感受。',
        reward: { text: '呼吸方式掌握。' },
      },
      {
        id: 'science-body-5',
        title: '营养补给',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识⑤：训练后 30 分钟补给更有效。',
        description: '讨论课后最想补充的健康食物。',
        reward: { text: '营养计划完成。' },
      },
      {
        id: 'science-body-6',
        title: '睡眠修复',
        type: 'team',
        skin: 'science',
        difficulty: 1,
        fragmentText: '知识⑥：睡眠是身体的“维修站”。',
        description: '分享自己的睡眠时间并设定目标。',
        reward: { text: '睡眠计划制定。' },
      },
      {
        id: 'science-body-7',
        title: '用眼放松',
        type: 'team',
        skin: 'science',
        difficulty: 1,
        fragmentText: '知识⑦：训练后记得让眼睛看看远方。',
        description: '完成眼保健操并描绘远处景象。',
        reward: { text: '眼睛得到放松。' },
      },
      {
        id: 'science-body-8',
        title: '总结分享',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '知识⑧：身体会记住你给它的关爱。',
        description: '全班分享今日收获并写入小百科。',
        reward: { text: '身体认知升级。' },
      },
    ],
  },
  {
    id: 'quest-science-nerve-boost-8',
    name: '运动科学 · 神经反应实验室',
    code: 'PZ-SCI-02',
    category: 'science',
    description: '神经激活课程配套谜题，强调神经与肌肉反应以及专注力训练。',
    tags: ['科学', '神经', '反应力'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '8-13 岁',
    focusAbilities: ['speed', 'coordination'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'science-nerve-1',
        title: '神经点火',
        type: 'speed',
        skin: 'science',
        difficulty: 3,
        fragmentText: '实验①：反应球测试 3 次，记录最短时间。',
        description: '进行反应球练习并写下进步。',
        reward: { text: '神经点火成功。' },
      },
      {
        id: 'science-nerve-2',
        title: '左右连线',
        type: 'coordination',
        skin: 'science',
        difficulty: 3,
        fragmentText: '实验②：左右脑交叉动作 10 次。',
        description: '完成交叉拍膝动作并描述脑中感觉。',
        reward: { text: '左右连线完成。' },
      },
      {
        id: 'science-nerve-3',
        title: '节奏信号',
        type: 'speed',
        skin: 'science',
        difficulty: 3,
        fragmentText: '实验③：听到口令 2 秒内完成起跳。',
        description: '变速口令训练并记录成功率。',
        reward: { text: '信号传递更快。' },
      },
      {
        id: 'science-nerve-4',
        title: '专注护盾',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '实验④：30 秒专注凝视目标点。',
        description: '进行专注练习并分享保持方法。',
        reward: { text: '专注护盾加持。' },
      },
      {
        id: 'science-nerve-5',
        title: '节奏拼图',
        type: 'coordination',
        skin: 'science',
        difficulty: 3,
        fragmentText: '实验⑤：敲击节拍顺序 1-3-2-4。',
        description: '手脚交替完成节拍组合。',
        reward: { text: '节奏记忆升级。' },
      },
      {
        id: 'science-nerve-6',
        title: '冷静呼吸',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '实验⑥：三次深呼吸 + 闭眼想象成功动作。',
        description: '带着想象再做一次动作。',
        reward: { text: '神经冷静模式开启。' },
      },
      {
        id: 'science-nerve-7',
        title: '伙伴测评',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '实验⑦：伙伴互测反应速度并给建议。',
        description: '交换测评表并写下建议。',
        reward: { text: '反馈环节完成。' },
      },
      {
        id: 'science-nerve-8',
        title: '荣誉记录',
        type: 'team',
        skin: 'science',
        difficulty: 2,
        fragmentText: '实验⑧：写下今天最快的一次反应。',
        description: '记录在神经实验日志中。',
        reward: { text: '实验结果存档。' },
      },
    ],
  },
  {
    id: 'quest-habit-class-ritual-6',
    name: '情感仪式 · 班级六礼',
    code: 'PZ-HABIT-01',
    category: 'habit',
    description: '六个温暖仪式强化课堂秩序、礼貌和情感表达，让班级氛围更具安全感。',
    tags: ['仪式感', '班级氛围', '品格'],
    assignedTo: 'class',
    difficulty: 1,
    recommendedScene: '课堂主线',
    recommendedAges: '6-12 岁',
    focusAbilities: ['team'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'habit-ritual-1',
        title: '准时到达礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪①：见面说“今天也会很棒”并准时签到。',
        description: '完成签到后互相竖起大拇指。',
        reward: { text: '准时习惯 +1。' },
      },
      {
        id: 'habit-ritual-2',
        title: '装备整齐礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪②：检查绳子、鞋带并互帮整理。',
        description: '完成装备自查后击掌确认。',
        reward: { text: '装备整齐。' },
      },
      {
        id: 'habit-ritual-3',
        title: '专注眼神礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪③：眼神对齐教练，表达“我准备好了”。',
        description: '课堂开始时做专注手势。',
        reward: { text: '专注就位。' },
      },
      {
        id: 'habit-ritual-4',
        title: '安全提醒礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪④：互相提醒安全距离，语气温柔。',
        description: '检查场地并口头确认“安全 OK”。',
        reward: { text: '安全守护。' },
      },
      {
        id: 'habit-ritual-5',
        title: '感恩鼓掌礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪⑤：向伙伴鼓掌并说谢谢。',
        description: '每次演示后全班感恩鼓掌。',
        reward: { text: '礼貌加分。' },
      },
      {
        id: 'habit-ritual-6',
        title: '记录成长礼',
        type: 'team',
        skin: 'habit',
        difficulty: 1,
        fragmentText: '礼仪⑥：写下一句话记录今天的成长。',
        description: '课后填写成长记录卡。',
        reward: { text: '成长记录完成。' },
      },
    ],
  },
  {
    id: 'quest-team-light-squad-9',
    name: '团队荣誉 · 闪电战队',
    code: 'PZ-TEAM-01',
    category: 'team',
    description: '适合战队赛的九块荣誉徽章，结合速度、耐力、文化与互助任务，让战队荣誉墙持续发光。',
    tags: ['战队', '徽章', '排行榜'],
    assignedTo: 'team',
    difficulty: 4,
    recommendedScene: '战队挑战',
    recommendedAges: '9-15 岁',
    focusAbilities: ['team', 'speed'],
    continueAcrossSessions: true,
    cards: [
      {
        id: 'team-light-1',
        title: '集结令',
        type: 'team',
        skin: 'team',
        difficulty: 3,
        fragmentText: '徽章①：闪电集结——签到 + 队旗亮相。',
        description: '完成签到后展示队旗和口号。',
        reward: { text: '战队集结完成。' },
      },
      {
        id: 'team-light-2',
        title: '速度试炼',
        type: 'speed',
        skin: 'team',
        difficulty: 4,
        fragmentText: '徽章②：极速冲刺——队员平均 SR60 刷新。',
        description: '统计平均成绩并更新速度榜。',
        reward: { text: '速度试炼通过。' },
      },
      {
        id: 'team-light-3',
        title: '耐力勋章',
        type: 'stamina',
        skin: 'team',
        difficulty: 4,
        fragmentText: '徽章③：持久动力——团队接力耐力完成。',
        description: '完成接力后写下坚持口号。',
        reward: { text: '耐力勋章到手。' },
      },
      {
        id: 'team-light-4',
        title: '战术会议',
        type: 'team',
        skin: 'team',
        difficulty: 3,
        fragmentText: '徽章④：战术制定——列出下一阶段目标。',
        description: '会议记录贴到战术板。',
        reward: { text: '战术明确。' },
      },
      {
        id: 'team-light-5',
        title: '互助榜样',
        type: 'team',
        skin: 'team',
        difficulty: 3,
        fragmentText: '徽章⑤：互助榜样——写下两句表扬。',
        description: '互评伙伴亮点并贴上爱心贴纸。',
        reward: { text: '互助榜样诞生。' },
      },
      {
        id: 'team-light-6',
        title: '文化发布',
        type: 'team',
        skin: 'team',
        difficulty: 3,
        fragmentText: '徽章⑥：战队文化——发布海报或短片。',
        description: '制作战队文化海报张贴在荣誉墙。',
        reward: { text: '战队文化落地。' },
      },
      {
        id: 'team-light-7',
        title: '终极挑战',
        type: 'team',
        skin: 'team',
        difficulty: 4,
        fragmentText: '徽章⑦：终极挑战——完成指定花样组合。',
        description: '挑战成功后记录在战队日志。',
        reward: { text: '终极挑战完成。' },
      },
      {
        id: 'team-light-8',
        title: '荣誉上墙',
        type: 'team',
        skin: 'team',
        difficulty: 3,
        fragmentText: '徽章⑧：荣誉上墙——更新荣誉榜与数据。',
        description: '在荣誉墙贴上最新成绩。',
        reward: { text: '荣誉墙更新。' },
      },
      {
        id: 'team-light-9',
        title: '战队点亮',
        type: 'team',
        skin: 'team',
        difficulty: 4,
        fragmentText: '徽章⑨：闪电全亮——完成终极仪式。',
        description: '全员围圈举旗并喊出战队宣言。',
        reward: { text: '战队徽章全亮！', badge: '闪电战队' },
      },
    ],
  },
  {
    id: 'quest-image-star-track-9',
    name: '视觉创作 · 星光跑道',
    code: 'PZ-IMAGE-01',
    category: 'image',
    description: '完成训练解锁星光跑道海报，结合情绪记录与家校联动让孩子的作品被看见。',
    tags: ['海报', '家校联动', '创意表达'],
    assignedTo: 'class',
    difficulty: 3,
    recommendedScene: '课堂主线',
    recommendedAges: '7-12 岁',
    focusAbilities: ['team', 'speed'],
    continueAcrossSessions: false,
    cards: [
      {
        id: 'image-star-1',
        title: '跑道起点',
        type: 'team',
        skin: 'mosaic',
        difficulty: 2,
        fragmentText: '碎片①：开场合影 + 写下今日心情色彩。',
        description: '课堂开场拍照并填上心情贴纸。',
        reward: { text: '跑道起点解锁。' },
      },
      {
        id: 'image-star-2',
        title: '速度轨迹',
        type: 'speed',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '碎片②：记录最快速度并画出轨迹线。',
        description: '速度段完成后在卡片上画速度线。',
        reward: { text: '速度轨迹显现。' },
      },
      {
        id: 'image-star-3',
        title: '节奏光束',
        type: 'coordination',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '碎片③：选择代表节奏的颜色。',
        description: '节奏训练完成后给光束上色。',
        reward: { text: '节奏光束成形。' },
      },
      {
        id: 'image-star-4',
        title: '伙伴身影',
        type: 'team',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '碎片④：互拍动作定格，写一句夸奖。',
        description: '搭档互拍视频截取最佳帧。',
        reward: { text: '伙伴剪影亮起。' },
      },
      {
        id: 'image-star-5',
        title: '能量线',
        type: 'stamina',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '碎片⑤：耐力练习完成，写下坚持秒数。',
        description: '耐力练习后在海报贴上能量条。',
        reward: { text: '能量线显现。' },
      },
      {
        id: 'image-star-6',
        title: '高光瞬间',
        type: 'team',
        skin: 'mosaic',
        difficulty: 2,
        fragmentText: '碎片⑥：记录今日最佳动作或笑容。',
        description: '选出一张照片贴在海报上。',
        reward: { text: '高光瞬间捕捉。' },
      },
      {
        id: 'image-star-7',
        title: '星空背景',
        type: 'team',
        skin: 'mosaic',
        difficulty: 2,
        fragmentText: '碎片⑦：用星星贴纸写下希望。',
        description: '贴星星并写一条愿望。',
        reward: { text: '星空背景铺设。' },
      },
      {
        id: 'image-star-8',
        title: '终点冲线',
        type: 'speed',
        skin: 'mosaic',
        difficulty: 3,
        fragmentText: '碎片⑧：最后冲刺完成后写下突破数字。',
        description: '冲线时喊出自己的突破宣言。',
        reward: { text: '冲线画面点亮。' },
      },
      {
        id: 'image-star-9',
        title: '分享发布',
        type: 'team',
        skin: 'mosaic',
        difficulty: 2,
        fragmentText: '碎片⑨：生成海报发送家长或张贴班级墙。',
        description: '制作完成后分享给家长或班级。',
        reward: { text: '星光跑道海报完成！' },
      },
    ],
  },
];


type AwardEntry = {
  studentId?: string;
  energy: number;
};

type UnlockStrategy = 'all' | 'sequential';

const DEFAULT_UNLOCK_STRATEGY: UnlockStrategy = 'all';

function nowISO() {
  return new Date().toISOString();
}

function buildInitialProgress(template: PuzzleTemplate, strategy: UnlockStrategy = DEFAULT_UNLOCK_STRATEGY) {
  const timestamp = nowISO();
  return template.cards.map<PuzzleCardProgress>((card, index) => ({
    cardId: card.id,
    status: strategy === 'sequential' ? (index === 0 ? 'available' : 'locked') : 'available',
    updatedAt: timestamp,
  }));
}

function synchronizeQuestWithTemplate(
  quest: PuzzleQuestInstance,
  template: PuzzleTemplate,
  strategy: UnlockStrategy = DEFAULT_UNLOCK_STRATEGY,
) {
  const timestamp = nowISO();
  const progressMap = new Map(quest.progress.map((item) => [item.cardId, item]));
  const progress: PuzzleCardProgress[] = template.cards.map((card, index) => {
    const existing = progressMap.get(card.id);
    if (existing) {
      return { ...existing };
    }
    return {
      cardId: card.id,
      status: strategy === 'sequential' ? (index === 0 ? 'available' : 'locked') : 'available',
      updatedAt: timestamp,
    } satisfies PuzzleCardProgress;
  });

  return {
    ...quest,
    progress,
  } satisfies PuzzleQuestInstance;
}

function distributeEnergy(totalEnergy: number, participants: string[]): AwardEntry[] {
  if (totalEnergy <= 0) {
    return [];
  }
  if (!participants.length) {
    return [
      {
        energy: totalEnergy,
      },
    ];
  }

  const awards: AwardEntry[] = [];
  const base = Math.floor(totalEnergy / participants.length);
  let remainder = totalEnergy - base * participants.length;

  participants.forEach((studentId) => {
    let energy = base;
    if (remainder > 0) {
      energy += 1;
      remainder -= 1;
    }
    awards.push({ studentId, energy });
  });

  return awards;
}

async function ensureSeededTemplates() {
  const existing = await db.puzzleTemplates.count();
  if (existing > 0) return;
  const normalized = SAMPLE_TEMPLATES.map(normalizeTemplateForSave);
  await db.transaction('rw', db.puzzleTemplates, async () => {
    await db.puzzleTemplates.bulkPut(normalized);
  });
}

async function refreshTemplateCache(template: PuzzleTemplate) {
  const normalized = withTemplateNormalization(template);
  await db.puzzleTemplates.put(normalized);
  return normalized;
}

async function getTemplateOrThrow(templateId: string) {
  const record = await db.puzzleTemplates.get(templateId);
  if (!record) {
    throw new Error(`未找到 ID 为 ${templateId} 的主线谜题模板`);
  }
  return refreshTemplateCache(record);
}

function unlockNextCard(progress: PuzzleCardProgress[]) {
  const nextLocked = progress.find((item) => item.status === 'locked');
  if (nextLocked) {
    nextLocked.status = 'available';
    nextLocked.updatedAt = nowISO();
  }
}

async function recordEnergyAwards(
  quest: { id: string; classId: string; sessionId: string; templateId: string },
  cardId: string,
  awards: AwardEntry[],
) {
  if (!awards.length) return;
  if (quest.classId === 'preview') return;

  const timestamp = nowISO();
  await Promise.all(
    awards
      .filter((award) => award.studentId && award.energy > 0)
      .map((award) =>
        energyLogsRepo.record({
          studentId: award.studentId!,
          source: 'puzzle_card',
          refId: `${quest.id}:${cardId}`,
          delta: award.energy,
          createdAt: timestamp,
          metadata: {
            questId: quest.id,
            sessionId: quest.sessionId,
            templateId: quest.templateId,
            cardId,
          },
        }),
      ),
  );
}

async function listTemplatesInternal() {
  await ensureSeededTemplates();
  const templates = await db.puzzleTemplates.toArray();
  const normalized = templates.map(normalizeTemplateForSave);
  await db.puzzleTemplates.bulkPut(normalized);
  return normalized.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'));
}

export const puzzlesRepo = {
  async ensureSeededTemplates() {
    await ensureSeededTemplates();
  },

  async listTemplates() {
    return listTemplatesInternal();
  },

  async saveTemplate(template: PuzzleTemplate) {
    const record = normalizeTemplateForSave(template);
    await db.puzzleTemplates.put(record);
    return record;
  },

  async deleteTemplate(templateId: string) {
    await db.puzzleTemplates.delete(templateId);
  },

  async replaceTemplates(templates: PuzzleTemplate[]) {
    const normalized = templates.map(normalizeTemplateForSave);
    await db.transaction('rw', db.puzzleTemplates, async () => {
      await db.puzzleTemplates.clear();
      if (normalized.length) {
        await db.puzzleTemplates.bulkPut(normalized);
      }
    });
    return listTemplatesInternal();
  },

  async importTemplates(templates: PuzzleTemplate[], options: { replace?: boolean } = {}) {
    const { replace = false } = options;
    const normalized = templates.map(normalizeTemplateForSave);
    await db.transaction('rw', db.puzzleTemplates, async () => {
      if (replace) {
        await db.puzzleTemplates.clear();
      }
      if (normalized.length) {
        await db.puzzleTemplates.bulkPut(normalized);
      }
    });
    return listTemplatesInternal();
  },

  async getTemplate(templateId: string) {
    await ensureSeededTemplates();
    try {
      const template = await getTemplateOrThrow(templateId);
      return template;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  async previewQuest(templateId: string) {
    await ensureSeededTemplates();
    const template = await getTemplateOrThrow(templateId);
    const questId = `preview-${templateId}`;
    const baseQuest: PuzzleQuestInstance = {
      id: questId,
      scope: 'classroom',
      classId: 'preview',
      sessionId: `preview-${templateId}`,
      templateId,
      continueAcrossSessions: true,
      progress: buildInitialProgress(template),
      scoreLog: [],
      energyEarned: 0,
    };

    const existing = await db.puzzleQuests.get(questId);
    const quest = existing
      ? {
          ...synchronizeQuestWithTemplate(existing, template),
          classId: 'preview',
          sessionId: `preview-${templateId}`,
          continueAcrossSessions: true,
          progress: buildInitialProgress(template),
          scoreLog: [],
          energyEarned: 0,
          finishedAt: undefined,
        }
      : baseQuest;

    await db.puzzleQuests.put(quest);
    return { quest, template };
  },

  async startQuest({
    classId,
    sessionId,
    templateId,
    continueAcrossSessions = false,
    unlockStrategy = DEFAULT_UNLOCK_STRATEGY,
  }: {

    

    classId: string;
    sessionId: string;
    templateId: string;
    continueAcrossSessions?: boolean;

    

    unlockStrategy?: UnlockStrategy;
  }) {
    await ensureSeededTemplates();
    const template = await getTemplateOrThrow(templateId);
    const existing = await db.puzzleQuests
      .where('classId')
      .equals(classId)
      .filter((quest) => quest.sessionId === sessionId)
      .first();

    if (existing) {
      const synced = synchronizeQuestWithTemplate(existing, template, unlockStrategy);
      synced.continueAcrossSessions = continueAcrossSessions;
      await db.puzzleQuests.put(synced);
      return synced;
    }

    const quest: PuzzleQuestInstance = {
      id: generateId(),
      scope: 'classroom',
      classId,
      sessionId,
      templateId,
      continueAcrossSessions,
      progress: buildInitialProgress(template, unlockStrategy),
      scoreLog: [],
      energyEarned: 0,
    };

    

    await db.puzzleQuests.put(quest);
    return quest;
  },


  

  async getQuest(questId: string) {
    return db.puzzleQuests.get(questId);
  },

  async flipCardInQuest(questId: string, cardId: string, participants: string[] = []) {
    await ensureSeededTemplates();
    let result: {
      quest: PuzzleQuestInstance;
      template: PuzzleTemplate;
      reward?: PuzzleCardTemplate['reward'];
      awards: AwardEntry[];
    } | null = null;

    await db.transaction('rw', db.puzzleQuests, db.puzzleTemplates, db.energyLogs, async () => {
      const quest = await db.puzzleQuests.get(questId);
      if (!quest) {
        throw new Error('未找到对应的主线任务实例');
      }

      const templateRecord = await db.puzzleTemplates.get(quest.templateId);
      if (!templateRecord) {
        throw new Error('未找到对应的主线谜题模板');
      }
      const template = withTemplateNormalization(templateRecord);

      const card = template.cards.find((item) => item.id === cardId);
      if (!card) {
        throw new Error('该卡牌不属于当前主线任务');
      }

      const timestamp = nowISO();
      let progress = quest.progress.find((item) => item.cardId === cardId);
      if (!progress) {
        progress = {
          cardId,
          status: 'available',
          updatedAt: timestamp,
        };
        quest.progress.push(progress);
      }

      if (progress.status === 'completed') {
        result = { quest, template, reward: card.reward, awards: [] };
        return;
      }

      progress.status = 'completed';
      progress.updatedAt = timestamp;
      progress.completedBy = participants[0];
      progress.sharedWith = participants;

      unlockNextCard(quest.progress);

      const totalEnergy = card.reward?.energy ?? 0;
      const awards = distributeEnergy(totalEnergy, participants);

      const reason = `完成「${card.title}」`;
      const awardLogs = awards.filter((award) => award.energy > 0);
      if (awardLogs.length) {
        awardLogs.forEach((award) => {
          quest.scoreLog.push({
            studentId: award.studentId,
            delta: award.energy,
            reason,
            createdAt: timestamp,
            cardId: card.id,
            badge: card.reward?.badge,
          });
        });
      } else if (totalEnergy > 0) {
        quest.scoreLog.push({
          delta: totalEnergy,
          reason,
          createdAt: timestamp,
          cardId: card.id,
          badge: card.reward?.badge,
        });
      }

      await recordEnergyAwards(quest, card.id, awards);

      quest.energyEarned += totalEnergy;
      if (quest.progress.every((item) => item.status === 'completed')) {
        quest.finishedAt = timestamp;
      }

      await db.puzzleQuests.put(quest);
      await db.puzzleTemplates.put(template);

      result = { quest, template, reward: card.reward, awards };
    });

    if (!result) {
      throw new Error('翻牌操作未成功提交');
    }

    return result;
  },

  async resetQuest(questId: string, unlockStrategy: UnlockStrategy = DEFAULT_UNLOCK_STRATEGY) {
    await ensureSeededTemplates();
    const quest = await db.puzzleQuests.get(questId);
    if (!quest) return null;
    const templateRecord = await db.puzzleTemplates.get(quest.templateId);
    if (!templateRecord) return null;
    const template = withTemplateNormalization(templateRecord);

    const progress = buildInitialProgress(template, unlockStrategy);
    const resetQuest: PuzzleQuestInstance = {
      ...quest,
      progress,
      scoreLog: [],
      energyEarned: 0,
      finishedAt: undefined,
    };
    await db.puzzleQuests.put(resetQuest);
    return resetQuest;
  },

  async listCampaigns() {
    await ensureSeededTemplates();
    return db.puzzleCampaigns.toArray();
  },

  async getCampaign(id: string) {
    return db.puzzleCampaigns.get(id);
  },

  async startCampaign({
    squadId,
    name,
    templateId,
    members,
    startDate,
    endDate,
    rules,
    unlockStrategy = DEFAULT_UNLOCK_STRATEGY,
  }: {
    squadId: string;
    name: string;
    templateId: string;
    members: string[];
    startDate: string;
    endDate?: string;
    rules?: Partial<PuzzleCampaignInstance['rules']>;
    unlockStrategy?: UnlockStrategy;
  }) {
    await ensureSeededTemplates();
    const template = await getTemplateOrThrow(templateId);
    const existing = await db.puzzleCampaigns
      .where('squadId')
      .equals(squadId)
      .filter((campaign) => campaign.templateId === templateId && campaign.endDate === endDate)
      .first();

    const baseRules: PuzzleCampaignInstance['rules'] = {
      mode: rules?.mode ?? 'co-op',
      openCardsPerDay: rules?.openCardsPerDay,
      scorePerCard: rules?.scorePerCard ?? template.cards.length >= 9 ? 15 : 12,
      personalScoreFactor: rules?.personalScoreFactor ?? 1,
    };

    if (existing) {
      const synced: PuzzleCampaignInstance = {
        ...existing,
        name,
        members,
        startDate,
        endDate,
        rules: baseRules,
        progress: buildInitialProgress(template, unlockStrategy),
        scoreBoard: {
          squad: 0,
          byMember: members.reduce<Record<string, number>>((acc, memberId) => {
            acc[memberId] = existing.scoreBoard.byMember[memberId] ?? 0;
            return acc;
          }, {}),
        },
        kudos: existing.kudos ?? [],
        finishedAt: undefined,
      };
      await db.puzzleCampaigns.put(synced);
      return synced;
    }

    const campaign: PuzzleCampaignInstance = {
      id: generateId(),
      scope: 'squad',
      squadId,
      name,
      templateId,
      startDate,
      endDate,
      rules: baseRules,
      members,
      progress: buildInitialProgress(template, unlockStrategy),
      scoreBoard: {
        squad: 0,
        byMember: members.reduce<Record<string, number>>((acc, memberId) => {
          acc[memberId] = 0;
          return acc;
        }, {}),
      },
      kudos: [],
    };
    await db.puzzleCampaigns.put(campaign);
    return campaign;
  },

  async flipCardInCampaign(campaignId: string, cardId: string, participants: string[] = []) {
    await ensureSeededTemplates();
    let result: {
      campaign: PuzzleCampaignInstance;
      template: PuzzleTemplate;
      reward?: PuzzleCardTemplate['reward'];
      awards: AwardEntry[];
    } | null = null;

    await db.transaction('rw', db.puzzleCampaigns, db.puzzleTemplates, db.energyLogs, async () => {
      const campaign = await db.puzzleCampaigns.get(campaignId);
      if (!campaign) {
        throw new Error('未找到对应的战队挑战实例');
      }

      const templateRecord = await db.puzzleTemplates.get(campaign.templateId);
      if (!templateRecord) {
        throw new Error('未找到对应的主线谜题模板');
      }
      const template = withTemplateNormalization(templateRecord);

      const card = template.cards.find((item) => item.id === cardId);
      if (!card) {
        throw new Error('该卡牌不属于当前战队挑战');
      }

      const timestamp = nowISO();
      let progress = campaign.progress.find((item) => item.cardId === cardId);
      if (!progress) {
        progress = {
          cardId,
          status: 'available',
          updatedAt: timestamp,
        };
        campaign.progress.push(progress);
      }

      if (progress.status === 'completed') {
        result = { campaign, template, reward: card.reward, awards: [] };
        return;
      }

      progress.status = 'completed';
      progress.updatedAt = timestamp;
      progress.completedBy = participants[0];
      progress.sharedWith = participants;

      unlockNextCard(campaign.progress);

      const totalEnergy = card.reward?.energy ?? 0;
      const awards = distributeEnergy(totalEnergy, participants);

      const baseScore = card.reward?.score ?? campaign.rules.scorePerCard ?? totalEnergy;
      campaign.scoreBoard.squad += baseScore;

      awards.forEach((award) => {
        if (!award.studentId || award.energy <= 0) return;
        campaign.scoreBoard.byMember[award.studentId] =
          (campaign.scoreBoard.byMember[award.studentId] ?? 0) + award.energy;
      });

      if (campaign.progress.every((item) => item.status === 'completed')) {
        campaign.finishedAt = timestamp;
      }

      await recordEnergyAwards(
        { id: campaign.id, classId: campaign.squadId, sessionId: campaign.startDate, templateId: campaign.templateId },
        card.id,
        awards,
      );

      await db.puzzleCampaigns.put(campaign);
      await db.puzzleTemplates.put(template);

      result = { campaign, template, reward: card.reward, awards };
    });

    if (!result) {
      throw new Error('战队翻牌操作未成功提交');
    }

    return result;
  },

  async recordCampaignKudos(campaignId: string, entry: { from: string; to: string; badge: string }) {
    const campaign = await db.puzzleCampaigns.get(campaignId);
    if (!campaign) return null;
    const timestamp = nowISO();
    const updated: PuzzleCampaignInstance = {
      ...campaign,
      kudos: [...campaign.kudos, { ...entry, createdAt: timestamp }],
    };
    await db.puzzleCampaigns.put(updated);
    return updated;
  },
};




