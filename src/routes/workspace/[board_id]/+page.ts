import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
    return {
        boardId: params.board_id,
    };
};
