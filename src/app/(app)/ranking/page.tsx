'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
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
import Image from 'next/image';

// Mock data for participants
const mockParticipants = [
  { id: '1', name: 'Kalam Suresh', points: 59705, avatarUrl: 'https://picsum.photos/seed/user1/200' },
  { id: '2', name: 'Jatin Raj', points: 51231, avatarUrl: 'https://picsum.photos/seed/user2/200' },
  { id: '3', name: 'Harsh Dave', points: 50442, avatarUrl: 'https://picsum.photos/seed/user3/200' },
  { id: '4', name: 'Alex Ensina', points: 42123, avatarUrl: 'https://picsum.photos/seed/user4/200' },
  { id: '5', name: 'Jack Luis', points: 41754, avatarUrl: 'https://picsum.photos/seed/user5/200' },
  { id: '6', name: 'Nathanial Do', points: 40210, avatarUrl: 'https://picsum.photos/seed/user6/200' },
  { id: '7', name: 'Majorie Kane', points: 40020, avatarUrl: 'https://picsum.photos/seed/user7/200' },
  { id: '8', name: 'Karl Xie', points: 39542, avatarUrl: 'https://picsum.photos/seed/user8/200' },
  { id: '9', name: 'Ana Lopez', points: 38100, avatarUrl: 'https://picsum.photos/seed/user9/200' },
  { id: '10', name: 'Carlos Gomez', points: 37500, avatarUrl: 'https://picsum.photos/seed/user10/200' },
].sort((a, b) => b.points - a.points); // Sort by points descending

const topPlayers = mockParticipants.slice(0, 3);
const otherPlayers = mockParticipants.slice(3);

const podiumOrder = [topPlayers[1], topPlayers[0], topPlayers[2]];

const Medal = ({ rank }: { rank: 1 | 2 | 3 }) => {
  const medalColors = {
    1: 'bg-yellow-400 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-yellow-600 text-white',
  };
  return (
    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${medalColors[rank]}`}>
      {rank}
    </div>
  );
};


export default function RankingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Leaderboard"
        description="¡Acumula puntos y gana premios!"
      />
      
      {/* Top 3 Players */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center items-end">
        {podiumOrder.map((player, index) => {
           const rank = [2, 1, 3][index] as 1 | 2 | 3;
          return (
          <Card key={player.id} className={`relative w-full max-w-sm text-center p-6 transform transition-transform ${rank === 1 ? 'scale-110' : 'scale-100'}`}>
            <Medal rank={rank} />
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
              <AvatarImage src={player.avatarUrl} alt={player.name} />
              <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{player.name}</h3>
            <p className="text-primary font-semibold">{player.points.toLocaleString()} pts</p>
          </Card>
        )})}
      </div>

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
              {otherPlayers.map((player, index) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium text-lg">{index + 4}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={player.avatarUrl} alt={player.name} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{player.points.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
