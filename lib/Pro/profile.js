/**
 * High-level Pro Profile & Contact API for chama-bailez-pro
 */

/**
 * Check if a phone number is registered on WhatsApp
 * @param {any} sock Baileys socket instance
 * @param {string} phoneNumber Phone number string
 */
export async function checkNumber(sock, phoneNumber) {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const results = await sock.onWhatsApp(cleaned);
    const first = results?.[0];
    if (first && first.exists) {
        return {
            exists: true,
            jid: first.jid,
            number: cleaned,
            formatted: `+${cleaned}`
        };
    }
    return {
        exists: false,
        number: cleaned,
        formatted: `+${cleaned}`
    };
}

/**
 * Update WhatsApp "About" / Bio status
 * @param {any} sock Baileys socket instance
 * @param {string} text Status bio text
 */
export async function setBio(sock, text) {
    return await sock.updateProfileStatus(text);
}

/**
 * Update display profile name
 * @param {any} sock Baileys socket instance
 * @param {string} name New display name
 */
export async function updateProfileName(sock, name) {
    return await sock.updateProfileName(name);
}

/**
 * Set profile picture for bot or a group
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target group JID or 'me'
 * @param {Buffer|{ url: string }} content Image Buffer or URL
 */
export async function setProfilePicture(sock, jid, content) {
    const targetJid = (!jid || jid === 'me') 
        ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net' 
        : jid;
    return await sock.updateProfilePicture(targetJid, content);
}

/**
 * Remove profile picture for bot or group
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target group JID or 'me'
 */
export async function removeProfilePicture(sock, jid) {
    const targetJid = (!jid || jid === 'me') 
        ? sock.user?.id?.split(':')[0] + '@s.whatsapp.net' 
        : jid;
    return await sock.removeProfilePicture(targetJid);
}

/**
 * Reject an incoming WhatsApp call cleanly
 * @param {any} sock Baileys socket instance
 * @param {string} callId ID of the incoming call
 * @param {string} callFrom Caller JID
 */
export async function rejectCall(sock, callId, callFrom) {
    if (typeof sock.rejectCall === 'function') {
        return await sock.rejectCall(callId, callFrom);
    }
    return await sock.query({
        tag: 'call',
        attrs: {
            from: sock.user?.id,
            to: callFrom
        },
        content: [
            {
                tag: 'reject',
                attrs: {
                    'call-id': callId,
                    'call-creator': callFrom,
                    count: '0'
                },
                content: undefined
            }
        ]
    });
}
