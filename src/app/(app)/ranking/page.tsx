'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { Participant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trophy, Medal as MedalIcon, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => {
  const medalColors = {
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md',
    3: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md',
  };
  const medalIcons = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };
  return (
    <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-2xl ${medalColors[rank]}`}>
      {medalIcons[rank]}
    </div>
  );
};

function PodiumSkeleton() {
  return (
    <div className="hidden md:grid md:grid-cols-3 gap-4 justify-items-center items-end">
      {[2, 1, 3].map((_, i) => (
        <Card key={i} className="relative w-full max-w-sm text-center p-6">
          <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </Card>
      ))}
    </div>
  );
}


export default function RankingPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  // Query users with points > 0, ordered by points descending
  const usersQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      if (isUserLoading) return null; // Wait for auth to complete
      if (!user) return null; // No user, no query
      return query(collection(firestore, 'users'), orderBy('points', 'desc'));
    },
    [firestore, user, isUserLoading]
  );
  const { data: allUsers, isLoading, error } = useCollection<Participant>(usersQuery);

  // Filter out users with 0 points
  const rankedUsers = allUsers?.filter(u => (u.points || 0) > 0) || [];
  
  const topPlayers = rankedUsers.slice(0, 3);
  const otherPlayers = rankedUsers.slice(3);

  const podiumOrderMobile = [...topPlayers]; // 1st, 2nd, 3rd
  const podiumOrderDesktop = topPlayers.length >= 3 
    ? [topPlayers[1], topPlayers[0], topPlayers[2]] // 2nd, 1st, 3rd
    : topPlayers;

  // Find current user's position
  const currentUserPosition = user ? rankedUsers.findIndex(u => u.id === user.uid) + 1 : -1;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leaderboard"
        description="¡Acumula puntos asistiendo a eventos y gana premios!"
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error al Cargar Ranking</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Current User Position Badge */}
      {currentUserPosition > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tu Posición</p>
                <p className="text-2xl font-bold text-primary">#{currentUserPosition}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Puntos Totales</p>
              <p className="text-2xl font-bold">{(rankedUsers[currentUserPosition - 1]?.points || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(isLoading || isUserLoading) && <PodiumSkeleton />}
      
      {/* Top 3 Players - Desktop */}
      {!isLoading && !isUserLoading && topPlayers.length >= 3 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 justify-items-center items-end">
          {podiumOrderDesktop.map((player, index) => {
            const rank = [2, 1, 3][index] as 1 | 2 | 3;
            const isCurrentUser = user?.uid === player.id;
            return (
              <Card 
                key={player.id} 
                className={`relative w-full max-w-sm text-center p-6 transform transition-transform ${
                  rank === 1 ? 'scale-110 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-400' : 'scale-100'
                } ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <Medal rank={rank} />
                {isCurrentUser && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Tú</Badge>
                )}
                <Avatar className={`${rank === 1 ? 'w-28 h-28' : 'w-24 h-24'} mx-auto mb-4 border-4 border-primary`}>
                  <AvatarImage src={player.photoURL} alt={player.name} />
                  <AvatarFallback className="text-2xl font-bold">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className={`${rank === 1 ? 'text-2xl' : 'text-xl'} font-bold mb-1`}>{player.name}</h3>
                <p className="text-primary font-semibold text-lg">{player.points.toLocaleString()} pts</p>
                {player.attendanceCount && (
                  <p className="text-xs text-muted-foreground mt-2">{player.attendanceCount} eventos asistidos</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Top 3 Players - Mobile */}
      {!isLoading && topPlayers.length > 0 && (
        <div className="flex md:hidden gap-2 justify-center items-end">
          {podiumOrderMobile.map((player, index) => {
            const rank = (index + 1) as 1 | 2 | 3;
            const scale = rank === 1 ? 'scale-110 z-10' : 'scale-90';
            const avatarSize = rank === 1 ? 'w-20 h-20' : 'w-16 h-16';
            const textSize = rank === 1 ? 'text-base' : 'text-sm';
            const isCurrentUser = user?.uid === player.id;

            return (
              <Card 
                key={player.id} 
                className={`relative w-1/3 text-center p-2 transform transition-transform ${scale} ${
                  rank === 1 ? 'bg-primary/5 border-primary' : ''
                } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
              >
                {rank < 4 && <Medal rank={rank} />}
                {isCurrentUser && (
                  <Badge className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] px-1 py-0 bg-primary">Tú</Badge>
                )}
                <Avatar className={`${avatarSize} mx-auto mb-2 border-2 border-primary`}>
                  <AvatarImage src={player.photoURL} alt={player.name} />
                  <AvatarFallback className="font-bold">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className={`font-bold ${textSize} truncate`}>{player.name}</h3>
                <p className="text-primary font-semibold text-xs">{player.points.toLocaleString()} pts</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rest of the players */}
      {!isLoading && otherPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Ranking General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Eventos</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherPlayers.map((player, index) => {
                  const position = index + 4;
                  const isCurrentUser = user?.uid === player.id;
                  return (
                    <TableRow 
                      key={player.id}
                      className={isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
                    >
                      <TableCell className="font-medium text-lg">
                        <div className="flex items-center gap-1">
                          #{position}
                          {isCurrentUser && <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Tú</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={player.photoURL} alt={player.name} />
                            <AvatarFallback className="font-bold">{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className={`font-medium ${isCurrentUser ? 'font-bold text-primary' : ''}`}>
                            {player.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                        {player.attendanceCount || 0}
                      </TableCell>
                      <TableCell className={`text-right ${isCurrentUser ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {player.points.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && rankedUsers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No hay ranking aún</h3>
            <p className="text-muted-foreground">
              ¡Sé el primero en ganar puntos asistiendo a eventos!
            </p>
          </div>
        </Card>
      )}

      {/* Loading State for Table */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
