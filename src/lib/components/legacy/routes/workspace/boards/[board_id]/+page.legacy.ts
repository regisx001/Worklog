import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => ({
    board_id: params.board_id,
});
