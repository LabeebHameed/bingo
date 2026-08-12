import { randomBytes, randomUUID } from 'crypto';

export interface Participant {
  id: string; // nanoid-style: 8 chars
  name: string;
  nickname: string;
  badge: 'fire' | 'bolt' | 'rabbit' | string;
  sessionToken: string;
  joinedAt: number;
  socketId?: string;
}

export interface BingoSquare {
  id: number; // 1-25
  label: string;
  task: string;
  targetParticipantId: string | null; // null = FREE square
  isFree: boolean;
  completed: boolean;
  photoUrl: string | null;
  answer: string | null;
  questionAsked: string | null;
  completedAt: number | null;
}

export interface BingoCard {
  participantId: string;
  squares: BingoSquare[]; // length 25
  completedLines: number; // count of completed 5-in-a-row lines
  completedSquares: number;
}

export interface ActivityItem {
  id: string;
  participantName: string;
  targetName: string;
  timestamp: number;
  type: 'square_complete' | 'bingo_line' | 'full_bingo' | 'join' | 'system';
  message: string;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  nickname: string;
  badge: string;
  completedSquares: number;
  completedLines: number;
  lastCompletionTime: number | null;
  joinedAt: number;
  rank: number;
}

export interface EventState {
  code: string; // e.g. 'BINGO-A3X9'
  operatorSecret: string;
  title: string;
  status: 'lobby' | 'active' | 'paused' | 'ended';
  durationMinutes: number;
  startTime: number | null;
  endTimestamp: number | null; // Date.now() + durationMs, set when started
  playMode: 'solo' | 'squad';
  selfieRequired: boolean;
  gridConfig: { squares: {id: number, label: string, task: string, isFree: boolean}[] }; // 25 squares
  questions: string[];
  participants: Map<string, Participant>;
  bingoCards: Map<string, BingoCard>;
  activityFeed: ActivityItem[];
  leaderboard: LeaderboardEntry[];
  timerInterval?: NodeJS.Timeout | null;
}

// Singletons
export const events = new Map<string, EventState>();
// Map eventCode to Set of stream controllers
export const sseClients = new Map<string, Set<ReadableStreamDefaultController>>();

export const generateEventCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BINGO-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateId = () => randomBytes(4).toString('hex');
export const generateSessionToken = () => randomBytes(16).toString('hex');

const WINNING_LINES = [
  // 5 rows
  [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
  // 5 cols
  [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
  // 2 diags
  [0,6,12,18,24], [4,8,12,16,20]
];

export const DEFAULT_QUESTIONS = [
  "What is one thing on your bucket list?",
  "What is your go-to karaoke song?",
  "If you could have any superpower, what would it be?",
  "What is the most spontaneous thing you've ever done?",
  "What is your favorite campus coffee spot?",
  "What is the best trip you've ever taken?",
  "What is your hidden talent?",
  "What is your favorite thing about this school?",
  "If you could travel anywhere right now, where would you go?",
  "What is something you want to learn this year?"
];

export const broadcastToEvent = (eventCode: string, type: string, payload: any) => {
  const clients = sseClients.get(eventCode);
  if (!clients) return;
  const message = `data: ${JSON.stringify({ type, payload })}\n\n`;
  for (const client of clients) {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch (e) {
      clients.delete(client);
    }
  }
};

export const checkBingoLines = (squares: BingoSquare[]): number => {
  let count = 0;
  for (const line of WINNING_LINES) {
    if (line.every(index => squares[index]?.completed || squares[index]?.isFree)) {
      count++;
    }
  }
  return count;
};

export const calculateLeaderboard = (event: EventState) => {
  const entries: LeaderboardEntry[] = [];
  for (const p of event.participants.values()) {
    const card = event.bingoCards.get(p.id);
    if (!card) continue;
    let lastCompletionTime: number | null = null;
    for (const sq of card.squares) {
      if (sq.completed && sq.completedAt) {
        if (!lastCompletionTime || sq.completedAt > lastCompletionTime) {
          lastCompletionTime = sq.completedAt;
        }
      }
    }
    entries.push({
      participantId: p.id,
      name: p.name,
      nickname: p.nickname,
      badge: p.badge,
      completedSquares: card.completedSquares,
      completedLines: card.completedLines,
      lastCompletionTime,
      joinedAt: p.joinedAt,
      rank: 0,
    });
  }

  entries.sort((a, b) => {
    if (b.completedSquares !== a.completedSquares) return b.completedSquares - a.completedSquares;
    if (a.lastCompletionTime !== b.lastCompletionTime) {
      return (a.lastCompletionTime || 0) - (b.lastCompletionTime || 0);
    }
    return a.joinedAt - b.joinedAt;
  });

  entries.forEach((e, i) => e.rank = i + 1);
  event.leaderboard = entries;
};

export const generateBingoCard = (event: EventState, participantId: string): BingoCard => {
  const participants = Array.from(event.participants.values()).filter(p => p.id !== participantId);
  const squares: BingoSquare[] = [];
  
  const gridConfig = event.gridConfig.squares;
  
  let targetIndex = 0;
  // Shuffle participants to assign to squares randomly
  const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 25; i++) {
    const config = gridConfig[i] || { id: i+1, label: 'Find Someone', task: 'Find Someone', isFree: false };
    
    let targetParticipantId = null;
    let label = config.label;

    if (!config.isFree) {
      if (shuffledParticipants.length > 0) {
        const targetParticipant = shuffledParticipants[targetIndex % shuffledParticipants.length];
        targetParticipantId = targetParticipant.id;
        targetIndex++;

        // If the label is default/generic, format it with target participant's display name
        if (!config.label || config.label === 'Find Someone' || config.label === 'Find [NAME]' || config.label.startsWith('Find ')) {
          label = `Find ${targetParticipant.nickname}`;
        }
      }
    }
    
    squares.push({
      id: config.id,
      label,
      task: config.task || label,
      targetParticipantId,
      isFree: config.isFree,
      completed: config.isFree, // Free squares are auto-completed
      photoUrl: null,
      answer: null,
      questionAsked: null,
      completedAt: config.isFree ? Date.now() : null,
    });
  }
  
  const card: BingoCard = {
    participantId,
    squares,
    completedLines: 0,
    completedSquares: squares.filter(s => s.completed).length
  };
  card.completedLines = checkBingoLines(card.squares);
  
  return card;
};

export const startTimer = (event: EventState) => {
  if (event.timerInterval) {
    clearInterval(event.timerInterval);
  }
  
  event.timerInterval = setInterval(() => {
    if (event.status !== 'active') return;
    if (!event.endTimestamp) return;
    
    const remaining = Math.max(0, Math.floor((event.endTimestamp - Date.now()) / 1000));
    broadcastToEvent(event.code, 'timer_tick', { remainingSeconds: remaining });
    
    if (remaining <= 0) {
      if (event.timerInterval) clearInterval(event.timerInterval);
      event.timerInterval = null;
      event.status = 'ended';
      broadcastToEvent(event.code, 'game_ended', { leaderboard: event.leaderboard });
    }
  }, 1000);
};

export const createEvent = (data: Partial<EventState>) => {
  const code = generateEventCode();
  const operatorSecret = generateSessionToken();
  const event: EventState = {
    code,
    operatorSecret,
    title: data.title || 'Human Bingo',
    status: 'lobby',
    durationMinutes: data.durationMinutes || 60,
    startTime: null,
    endTimestamp: null,
    playMode: data.playMode || 'solo',
    selfieRequired: data.selfieRequired ?? true,
    gridConfig: data.gridConfig || { squares: Array.from({length: 25}, (_, i) => ({ id: i+1, label: `Label ${i+1}`, task: `Task ${i+1}`, isFree: i === 12 })) },
    questions: data.questions || DEFAULT_QUESTIONS,
    participants: new Map(),
    bingoCards: new Map(),
    activityFeed: [],
    leaderboard: [],
  };
  events.set(code, event);
  return { eventCode: code, operatorSecret };
};
