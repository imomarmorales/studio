import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Badge } from './types';

// Badge milestone definitions
const BADGE_MILESTONES = [
  { id: 'first-steps', name: 'Primeros Pasos', requirement: 1 },
  { id: 'engaged', name: 'Comprometido', requirement: 5 },
  { id: 'dedicated', name: 'Dedicado', requirement: 10 },
  { id: 'expert', name: 'Experto', requirement: 20 },
  { id: 'legend', name: 'Leyenda', requirement: 50 },
];

/**
 * Check and award badges based on attendance count
 * Called after successfully marking attendance
 */
export async function checkAndAwardBadges(
  firestore: Firestore,
  userId: string,
  newAttendanceCount: number
): Promise<Badge[]> {
  const newBadges: Badge[] = [];

  try {
    // Get user's current badges
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return newBadges;
    }

    const userData = userDoc.data();
    const currentBadges = (userData.badges || []) as Badge[];
    const currentBadgeIds = new Set(currentBadges.map(b => b.id));

    // Check which badges should be awarded
    for (const milestone of BADGE_MILESTONES) {
      // If user has reached the milestone and doesn't have the badge yet
      if (newAttendanceCount >= milestone.requirement && !currentBadgeIds.has(milestone.id)) {
        const badge: Badge = {
          id: milestone.id,
          name: milestone.name,
          description: `Asiste a ${milestone.requirement} ${milestone.requirement === 1 ? 'evento' : 'eventos'}`,
          requirement: milestone.requirement,
        };

        newBadges.push(badge);
      }
    }

    // Update user document with new badges
    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: arrayUnion(...newBadges),
      });
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking/awarding badges:', error);
    return newBadges;
  }
}

/**
 * Get badge progress for a user
 */
export function getBadgeProgress(attendanceCount: number) {
  return BADGE_MILESTONES.map(milestone => {
    const earned = attendanceCount >= milestone.requirement;
    const progress = Math.min(100, (attendanceCount / milestone.requirement) * 100);
    
    return {
      ...milestone,
      earned,
      progress,
      remaining: Math.max(0, milestone.requirement - attendanceCount),
    };
  });
}

/**
 * Get the next badge to earn
 */
export function getNextBadge(attendanceCount: number) {
  const progress = getBadgeProgress(attendanceCount);
  return progress.find(b => !b.earned) || null;
}
