/**
 * High-level Pro WhatsApp Status (Stories) API for chama-bailez-pro
 */

function hexToArgb(hex) {
    if (!hex) return 0xFF25D366; // Default WhatsApp Green
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
        cleanHex = 'FF' + cleanHex;
    }
    return parseInt(cleanHex, 16);
}

/**
 * Send a text status (story) to WhatsApp broadcast
 * @param {any} sock Baileys socket instance
 * @param {string} text Text content of status
 * @param {{ backgroundColor?: string|number, font?: number, statusJidList?: string[], allContacts?: boolean }} [options] 
 */
export async function sendStatusText(sock, text, options = {}) {
    if (!text) throw new Error('Status text cannot be empty');

    const backgroundColor = options.backgroundColor || '#25D366';
    const font = options.font || 1; // 1: SERIF, 2: NORICAN, 3: BRYNDAN_WRITE, 4: BEBASNEUE, 5: OSWALD

    return await sock.sendMessage('status@broadcast', { text }, {
        backgroundColor,
        font,
        statusJidList: options.statusJidList
    });
}

/**
 * Send an image or video status (story) to WhatsApp broadcast
 * @param {any} sock Baileys socket instance
 * @param {Buffer|string|{ url: string }} media Buffer, local path, or URL
 * @param {{ type?: 'image' | 'video', caption?: string, statusJidList?: string[] }} [options]
 */
export async function sendStatusMedia(sock, media, options = {}) {
    const isVideo = options.type === 'video' || (typeof media === 'string' && /\.(mp4|mov|mkv)$/i.test(media));
    const mediaContent = isVideo ? { video: media, caption: options.caption } : { image: media, caption: options.caption };

    return await sock.sendMessage('status@broadcast', mediaContent, {
        statusJidList: options.statusJidList
    });
}

/**
 * Mark a contact's status story as read (viewed)
 * @param {any} sock Baileys socket instance
 * @param {any} key Message key of the status ({ id, remoteJid, participant })
 */
export async function readStatus(sock, key) {
    if (!key) throw new Error('Status key is required to mark as viewed');
    return await sock.readMessages([key]);
}

/**
 * Like or react with an emoji to a contact's status story
 * @param {any} sock Baileys socket instance
 * @param {any} key Message key of the status
 * @param {string} [emoji='💚'] Emoji to react with
 */
export async function reactStatus(sock, key, emoji = '💚') {
    if (!key) throw new Error('Status key is required to react');
    const targetParticipant = key.participant || key.remoteJid;

    return await sock.sendMessage('status@broadcast', {
        react: {
            text: emoji,
            key
        }
    }, {
        statusJidList: [targetParticipant]
    });
}
