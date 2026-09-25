/**
 * High-level Pro Messaging & Chat Actions for chama-bailez-pro
 */

/**
 * Edit a previously sent message
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Key of message to edit
 * @param {string} newText New text content
 */
export async function editMessage(sock, jid, key, newText) {
    if (!key) throw new Error('Message key is required to edit');
    return await sock.sendMessage(jid, {
        text: newText,
        edit: key
    });
}

/**
 * Revoke/delete a message
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Key of message to delete
 */
export async function deleteMessage(sock, jid, key) {
    if (!key) throw new Error('Message key is required to delete');
    return await sock.sendMessage(jid, {
        delete: key
    });
}

/**
 * Pin a message in chat
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Key of message to pin
 * @param {number} [durationInSeconds=86400] 86400 (24h), 604800 (7d), or 2592000 (30d)
 */
export async function pinMessage(sock, jid, key, durationInSeconds = 86400) {
    if (!key) throw new Error('Message key is required to pin');
    return await sock.sendMessage(jid, {
        pin: key,
        type: 1, // 1 = pin, 2 = unpin
        time: durationInSeconds
    });
}

/**
 * Unpin a message in chat
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Key of message to unpin
 */
export async function unpinMessage(sock, jid, key) {
    if (!key) throw new Error('Message key is required to unpin');
    return await sock.sendMessage(jid, {
        pin: key,
        type: 2
    });
}

/**
 * Star or unstar a message
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Message key
 * @param {boolean} [star=true] True to star, false to unstar
 */
export async function starMessage(sock, jid, key, star = true) {
    if (!key?.id) throw new Error('Message key with id is required');
    return await sock.chatModify({
        star: {
            messages: [{ id: key.id, fromMe: key.fromMe || false }],
            star
        }
    }, jid);
}

/**
 * React to a message with an emoji or remove reaction
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {any} key Key of message to react to
 * @param {string} [emoji=''] Emoji character, or empty string to remove reaction
 */
export async function reactMessage(sock, jid, key, emoji = '') {
    if (!key) throw new Error('Message key is required to react');
    return await sock.sendMessage(jid, {
        react: {
            text: emoji,
            key
        }
    });
}

/**
 * Send typing, recording, or online presence
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {'composing'|'recording'|'paused'|'available'|'unavailable'} [presence='composing'] 
 */
export async function sendPresence(sock, jid, presence = 'composing') {
    if (presence === 'available' || presence === 'unavailable') {
        return await sock.sendPresenceUpdate(presence);
    }
    return await sock.sendPresenceUpdate(presence, jid);
}

/**
 * Send instant quoted text reply
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat JID
 * @param {string} text Message text
 * @param {any} [quotedMessage] Quoted message object
 */
export async function reply(sock, jid, text, quotedMessage = undefined) {
    return await sock.sendMessage(jid, { text }, { quoted: quotedMessage });
}
