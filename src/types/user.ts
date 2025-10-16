// src/types/user.ts
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  bio?: string
  avatarUrl?: string
  userCode: string // 6-cyfrowy unikalny kod
  createdAt: Date
  updatedAt: Date
  moodEntries?: MoodEntry[]
  friends: string[] // array of userCodes
  friendRequests: FriendRequest[]
  userCode?: string
  friendRequests?: any[]
  streak: number
  level: number
  xp: number
  consistency: number
  currentMood?: number
  lastMoodUpdate?: Date
  moodEntries?: any[]
  role?: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

export interface MoodEntry {
  id: string
  mood: number
  note?: string
  timestamp: Date
  date: string
}