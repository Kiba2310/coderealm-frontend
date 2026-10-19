export interface UserStats {
  username: string;
  points: number;
  xp: number;
  level: number;
  achievements: string[];
}

export interface DungeonState {
  bossHealth: number;
  maxHealth: number;
  teams: { name: string; damage: number }[];
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: string;
}

let mockStats: UserStats = {
  username: 'John_Doe',
  points: 1500,
  xp: 1500,
  level: 5,
  achievements: ['First Blood', 'Code Warrior', 'Piston Master']
};

let mockDungeon: DungeonState = {
  bossHealth: 75000,
  maxHealth: 100000,
  teams: [
    { name: 'Team Alpha', damage: 15000 },
    { name: 'Team Beta', damage: 8000 },
    { name: 'Your Team', damage: 2000 }
  ]
};

const storeItems: StoreItem[] = [
  { id: '1', name: 'Flame Avatar', description: 'Surrounds your avatar with flames.', cost: 500, effect: 'flame_avatar' },
  { id: '2', name: 'XP Boost', description: 'Double XP for 1 hour.', cost: 1000, effect: 'xp_boost' },
  { id: '3', name: 'Custom Username Color', description: 'Change your username color to gold.', cost: 2000, effect: 'gold_name' },
];

export const mockBackend = {
  getUserStats: async (): Promise<UserStats> => {
    return new Promise((resolve) => setTimeout(() => resolve({ ...mockStats }), 500));
  },
  addPoints: async (points: number): Promise<UserStats> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockStats.points += points;
        mockStats.xp += points;
        if (mockStats.xp > mockStats.level * 1000) {
          mockStats.level += 1;
        }
        resolve({ ...mockStats });
      }, 300);
    });
  },
  getDungeonState: async (): Promise<DungeonState> => {
    return new Promise((resolve) => setTimeout(() => resolve({ ...mockDungeon }), 500));
  },
  dealDamageToBoss: async (damage: number): Promise<DungeonState> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockDungeon.bossHealth = Math.max(0, mockDungeon.bossHealth - damage);
        const myTeam = mockDungeon.teams.find(t => t.name === 'Your Team');
        if (myTeam) myTeam.damage += damage;
        resolve({ ...mockDungeon });
      }, 300);
    });
  },
  getStoreItems: async (): Promise<StoreItem[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(storeItems), 500));
  },
  purchaseItem: async (itemId: string): Promise<{ success: boolean; newStats?: UserStats; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const item = storeItems.find(i => i.id === itemId);
        if (!item) return resolve({ success: false, error: 'Item not found' });
        if (mockStats.points < item.cost) return resolve({ success: false, error: 'Not enough points' });

        mockStats.points -= item.cost;
        resolve({ success: true, newStats: { ...mockStats } });
      }, 500);
    });
  }
};
