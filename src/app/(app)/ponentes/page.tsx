import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const speakers = [
  { id: 1, name: "Dr. Alan Turing", institution: "Universidad de Cambridge" },
  { id: 2, name: "Dra. Ada Lovelace", institution: "Corte Real Británica" },
  { id: 3, name: "Dr. Linus Torvalds", institution: "Universidad de Helsinki" },
];

export default function PonentesPage() {
    const speakerImage = PlaceHolderImages.find(p => p.id === "speaker-placeholder");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Ponentes y Facilitadores"
        description="Conoce a los expertos que nos acompañan."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {speakers.map((speaker) => (
          <Card key={speaker.id} className="text-center">
            <CardHeader>
                {speakerImage && (
                    <Image
                        src={speakerImage.imageUrl}
                        alt={`Foto de ${speaker.name}`}
                        width={120}
                        height={120}
                        className="rounded-full mx-auto border-4 border-primary/20"
                        data-ai-hint={speakerImage.imageHint}
                    />
                )}
            </CardHeader>
            <CardContent>
              <CardTitle className="font-headline text-lg">{speaker.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{speaker.institution}</p>
              <p className="mt-4 text-sm">Biografía y resumen de ponencia próximamente.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
