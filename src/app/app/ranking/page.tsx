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
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Query } from 'firebase/firestore';
import type { Participant } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => {
  const medalColors = {
    1: 'bg-yellow-400 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-orange-400 text-white',
  };
  return (
    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${medalColors[rank]}`}>
      {rank}
    </div>
  );
};


export default function RankingPage() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('points', 'desc')) as Query<Participant>;
  }, [firestore]);

  const { data: participants, isLoading } = useCollection<Participant>(usersQuery);

  const topPlayers = participants?.slice(0, 3) || [];
  const otherPlayers = participants?.slice(3) || [];

  const podiumOrderMobile = [...topPlayers]; // 1st, 2nd, 3rd
  const podiumOrderDesktop = topPlayers.length === 3 ? [topPlayers[1], topPlayers[0], topPlayers[2]] : [...topPlayers]; // 2nd, 1st, 3rd

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leaderboard"
        description="¡Acumula puntos y gana premios!"
      />
      
      {isLoading && (
        <div className="grid md:grid-cols-3 gap-4 items-end">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
      )}

      {/* Top 3 Players - Desktop */}
      {!isLoading && topPlayers.length > 0 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 justify-items-center items-end">
          {podiumOrderDesktop.map((player, index) => {
            const rank = topPlayers.length === 3 ? [2, 1, 3][index] as 1 | 2 | 3 : (index + 1) as 1 | 2 | 3;
            return (
            <Card key={player.id} className={`relative w-full max-w-sm text-center p-6 transform transition-transform ${rank === 1 ? 'scale-110' : 'scale-100'}`}>
              <Medal rank={rank} />
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
                <AvatarImage src={player.avatarUrl || `https://picsum.photos/seed/${player.id}/200`} alt={player.name} />
                <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{player.name}</h3>
              <p className="text-primary font-semibold">{player.points.toLocaleString()} pts</p>
            </Card>
          )})}
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

              return (
              <Card key={player.id} className={`relative w-1/3 text-center p-2 transform transition-transform ${scale} ${rank === 1 ? 'bg-primary/5' : ''}`}>
                {rank < 4 && <Medal rank={rank} />}
                <Avatar className={`${avatarSize} mx-auto mb-2 border-2 border-primary`}>
                  <AvatarImage src={player.avatarUrl || `https://picsum.photos/seed/${player.id}/200`} alt={player.name} />
                  <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className={`font-bold ${textSize} truncate`}>{player.name}</h3>
                <p className="text-primary font-semibold text-xs">{player.points.toLocaleString()} pts</p>
              </Card>
            )})}
        </div>
      )}


      {/* Rest of the players */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking General</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Puntos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-10 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {!isLoading && otherPlayers.map((player, index) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium text-lg">{index + 4}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={player.avatarUrl || `https://picsum.photos/seed/${player.id}/200`} alt={player.name} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{player.points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
                 {!isLoading && (!participants || participants.length === 0) && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        El ranking está vacío. ¡Participa en eventos para empezar a sumar puntos!
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
