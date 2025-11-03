export interface CongressEvent {
    id: string;
    title: string;
    description: string;
    dateTime: string;
    location: string;
    imageUrl?: string;
}

export interface Participant {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    digitalCredentialQR: string;
    points: number;
}
