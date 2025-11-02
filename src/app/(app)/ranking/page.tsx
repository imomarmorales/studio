'use client';

import { PageHeader } from "@/components/shared/PageHeader";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import Image from "next/image";
import { Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Participant = {
  id: string;
  name: string;
  points: number;
  avatarUrl?: string;
};

const PodiumCard = ({ participant, rank }: { participant: Participant, rank: number }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  return (
    <div className={cn("relative flex flex-col items-center justify-end px-4",
      isFirst && "row-start-1 h-56",
      isSecond && "row-start-2 h-48",
      isThird && "row-start-2 h-48"
    )}>
      <div className={cn("absolute top-0 z-10 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold text-white",
        isFirst && "bg-yellow-500",
        isSecond && "bg-gray-400",
        isThird && "bg-amber-700"
      )}>
        {rank}
      </div>
      <div className="relative">
         {isFirst && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-400" />}
        <Avatar className="h-20 w-20 border-4 border-primary/50">
            <AvatarImage src={participant.avatarUrl || `https://picsum.photos/seed/${participant.id}/200`} alt={participant.name} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      <div className={cn("w-32 text-center rounded-lg p-3 shadow-lg",
        isFirst && "bg-gradient-to-t from-yellow-200 to-yellow-50",
        isSecond && "bg-gradient-to-t from-gray-200 to-gray-50",
        isThird && "bg-gradient-to-t from-amber-200 to-amber-50"
      )}>
        <h3 className="font-semibold truncate text-foreground">{participant.name}</h3>
        <div className="flex items-center justify-center gap-1 font-bold text-primary">
          <Gem className="h-4 w-4"/>
          {participant.points}
        </div>
      </div>
    </div>
  );
};


const RankingListSkeleton = () => (
    <div className="space-y-8">
      <PageHeader
        title="Ranking de Participantes"
        description="¡Acumula puntos y gana premios!"
      />
       <div className="relative flex justify-center items-end h-64 gap-4">
            <Skeleton className="h-48 w-32 rounded-lg" />
            <Skeleton className="h-56 w-32 rounded-lg" />
            <Skeleton className="h-48 w-32 rounded-lg" />
        </div>
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center bg-card p-2 rounded-lg">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full ml-4" />
                    <Skeleton className="h-5 w-32 ml-4" />
                    <Skeleton className="h-5 w-16 ml-auto" />
                </div>
            ))}
        </div>
    </div>
)

export default function RankingPage() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading } = useCollection<Omit<Participant, 'id'>>(usersQuery);

  const sortedUsers = users ? [...users].sort((a, b) => (b.points || 0) - (a.points || 0)) : [];
  
  const topThree = sortedUsers.slice(0, 3);
  const restOfUsers = sortedUsers.slice(3);

  if (isLoading) {
    return <RankingListSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ranking de Participantes"
        description="¡Acumula puntos y gana premios!"
      />

        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
            <div className="relative grid grid-cols-3 grid-rows-2 items-end h-64">
                {topThree.find((u, i) => i + 1 === 2) && <PodiumCard participant={topThree.find((u, i) => i + 1 === 2)!} rank={2} />}
                {topThree.find((u, i) => i + 1 === 1) && <PodiumCard participant={topThree.find((u, i) => i + 1 === 1)!} rank={1} />}
                {topThree.find((u, i) => i + 1 === 3) && <PodiumCard participant={topThree.find((u, i) => i + 1 === 3)!} rank={3} />}
            </div>
        )}

      {/* List for the rest */}
      <div className="space-y-2">
        {restOfUsers.map((user, index) => (
          <div key={user.id} className="flex items-center bg-card p-3 rounded-lg shadow-sm">
            <div className="w-8 text-center font-bold text-muted-foreground">{index + 4}</div>
            <Avatar className="h-10 w-10 ml-4">
              <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user.id}/200`} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 font-medium text-foreground">{user.name}</div>
            <div className="ml-auto flex items-center gap-2 font-semibold text-primary">
                <Gem className="h-4 w-4" />
                {user.points || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
