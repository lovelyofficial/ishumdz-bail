import { randomBytes } from 'crypto';
import { generateWAMessageContent, generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/messages.js';
import { generateMessageID } from '../Utils/generics.js';
import { createBotCompat } from './bot-compat-core.js';

const compat = createBotCompat({
    generateWAMessageContent,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    generateMessageID,
    randomBytes
});

export const attachBotCompat = compat.attach;
export const attachGroupStatus = compat.attachGroupStatus;
export const attachContentShapes = compat.attachContentShapes;
