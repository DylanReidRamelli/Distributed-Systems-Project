export interface Resolution {
    id: string;
    title: string;
    description: string;
    yesVotes: number;
    noVotes: number;
    createdAt: Date;
}

export interface Vote {
    resolutionId: string;
    voterAddress: string;
    vote: 'yes' | 'no';
}