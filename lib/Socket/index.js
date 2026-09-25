import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { makeBanCheckerSocket } from './ban-checker.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    return makeBanCheckerSocket(makeCommunitiesSocket(newConfig));
};
export default makeWASocket;
//# sourceMappingURL=index.js.map
