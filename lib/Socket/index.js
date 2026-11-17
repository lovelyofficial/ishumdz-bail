import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { makeBanCheckerSocket } from './ban-checker.js';
import { attachBotCompat } from '../Compat/bot-compat.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeBanCheckerSocket(makeCommunitiesSocket(newConfig));
    // bot compatibility: sendGroupStatus + interactive/list content shapes
    return attachBotCompat(sock);
};
export default makeWASocket;
//# sourceMappingURL=index.js.map
