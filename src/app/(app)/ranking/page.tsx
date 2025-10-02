import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

const rankingData = [
  { rank: 1, name: "Maria Rodriguez", points: 350 },
  { rank: 2, name: "Carlos Sanchez", points: 320 },
  { rank: 3, name: "Ana Garcia", points: 315 },
  { rank: 4, name: "Luis Hernandez", points: 290 },
  { rank: 5, name: "Sofia Martinez", points: 280 },
];

export default function RankingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ranking de Participantes"
        description="¡Acumula puntos y gana premios!"
      />
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Posición</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead className="text-right">Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingData.map((player) => (
              <TableRow key={player.rank}>
                <TableCell className="font-medium text-center">
                  <div className="flex items-center justify-center">
                    {player.rank <= 3 && <Trophy className="h-4 w-4 mr-2 text-yellow-500" />}
                    {player.rank}
                  </div>
                </TableCell>
                <TableCell>{player.name}</TableCell>
                <TableCell className="text-right font-semibold">{player.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
