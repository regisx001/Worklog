type LegacyLoadArgs = { params: { board_id: string } };

export const load = ({ params }: LegacyLoadArgs) => ({
    board_id: params.board_id,
});
