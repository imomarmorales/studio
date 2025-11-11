'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Award, Trophy, Star, Flame, Crown, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Badge as BadgeType } from '@/lib/types';

interface UserBadgesProps {
  badges?: BadgeType[];
  attendanceCount: number;
}

// Badge definitions
const BADGE_DEFINITIONS = [
  {
    id: 'first-steps',
    name: 'Primeros Pasos',
    description: 'Asiste a tu primer evento',
    requirement: 1,
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'engaged',
    name: 'Comprometido',
    description: 'Asiste a 5 eventos',
    requirement: 5,
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    id: 'dedicated',
    name: 'Dedicado',
    description: 'Asiste a 10 eventos',
    requirement: 10,
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'expert',
    name: 'Experto',
    description: 'Asiste a 20 eventos',
    requirement: 20,
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'legend',
    name: 'Leyenda',
    description: 'Asiste a 50 eventos',
    requirement: 50,
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
];

export function UserBadges({ badges = [], attendanceCount }: UserBadgesProps) {
  // Check which badges the user has earned
  const earnedBadgeIds = new Set(badges.map(b => b.id));
  
  // Determine badge status
  const badgesWithStatus = BADGE_DEFINITIONS.map(def => {
    const earned = attendanceCount >= def.requirement;
    const progress = Math.min(100, (attendanceCount / def.requirement) * 100);
    
    return {
      ...def,
      earned,
      progress,
      remaining: Math.max(0, def.requirement - attendanceCount),
    };
  });

  // Find next badge to earn
  const nextBadge = badgesWithStatus.find(b => !b.earned);
  const earnedCount = badgesWithStatus.filter(b => b.earned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Insignias
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {earnedCount} de {BADGE_DEFINITIONS.length} desbloqueadas
          </p>
        </div>
        {nextBadge && (
          <Badge variant="outline" className="gap-2">
            <Target className="h-3 w-3" />
            Siguiente: {nextBadge.requirement - attendanceCount} eventos más
          </Badge>
        )}
      </div>

      {/* Next Badge Progress */}
      {nextBadge && (
        <Card className={`p-4 border-2 ${nextBadge.bgColor}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${nextBadge.bgColor}`}>
              <nextBadge.icon className={`h-6 w-6 ${nextBadge.color}`} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{nextBadge.name}</h4>
                  <p className="text-sm text-muted-foreground">{nextBadge.description}</p>
                </div>
                <Badge variant="secondary">
                  {attendanceCount}/{nextBadge.requirement}
                </Badge>
              </div>
              <div className="space-y-1">
                <Progress value={nextBadge.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {nextBadge.remaining} {nextBadge.remaining === 1 ? 'evento' : 'eventos'} para desbloquear
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {badgesWithStatus.map(badge => {
          const Icon = badge.icon;
          
          return (
            <Card
              key={badge.id}
              className={`p-4 text-center transition-all ${
                badge.earned
                  ? `${badge.bgColor} border-2 ${badge.color.replace('text-', 'border-')} hover:scale-105`
                  : 'opacity-40 grayscale hover:opacity-60'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`p-3 rounded-full ${
                    badge.earned ? badge.bgColor : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${badge.earned ? badge.color : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {badge.description}
                  </p>
                </div>
                {badge.earned ? (
                  <Badge className={`${badge.bgColor} ${badge.color} border-0 mt-1`}>
                    ✓ Desbloqueada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">
                    {badge.requirement} eventos
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* All Badges Earned */}
      {earnedCount === BADGE_DEFINITIONS.length && (
        <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-500">
          <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
            ¡Felicitaciones! 🎉
          </h3>
          <p className="text-yellow-800 dark:text-yellow-200 mt-2">
            Has desbloqueado todas las insignias disponibles. ¡Eres una leyenda del congreso!
          </p>
        </Card>
      )}
    </div>
  );
}
