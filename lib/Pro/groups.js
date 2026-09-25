/**
 * High-level Pro Group Management API for chama-bailez-pro
 */

/**
 * Get group metadata and preview info from invite link/code without joining
 * @param {any} sock Baileys socket instance
 * @param {string} inviteCode Group invite code or full WhatsApp invite URL
 */
export async function groupGetInviteInfo(sock, inviteCode) {
    const code = inviteCode.replace(/.*chat\.whatsapp\.com\//, '').trim();
    return await sock.groupGetInviteInfo(code);
}

/**
 * Join a group using an invite code or URL
 * @param {any} sock Baileys socket instance
 * @param {string} inviteCode Group invite code or URL
 */
export async function groupJoinViaInvite(sock, inviteCode) {
    const code = inviteCode.replace(/.*chat\.whatsapp\.com\//, '').trim();
    return await sock.groupAcceptInvite(code);
}

/**
 * Toggle announcement mode (only admins can send messages)
 * @param {any} sock Baileys socket instance
 * @param {string} jid Group JID
 * @param {boolean} [onlyAdminsCanSend=true] 
 */
export async function groupSetAnnouncement(sock, jid, onlyAdminsCanSend = true) {
    return await sock.groupSettingUpdate(jid, onlyAdminsCanSend ? 'announcement' : 'not_announcement');
}

/**
 * Toggle locked mode (only admins can modify group icon/description/name)
 * @param {any} sock Baileys socket instance
 * @param {string} jid Group JID
 * @param {boolean} [onlyAdminsCanEdit=true]
 */
export async function groupSetLocked(sock, jid, onlyAdminsCanEdit = true) {
    return await sock.groupSettingUpdate(jid, onlyAdminsCanEdit ? 'locked' : 'unlocked');
}

/**
 * List pending membership approval requests in a group
 * @param {any} sock Baileys socket instance
 * @param {string} jid Group JID
 */
export async function groupRequestParticipantsList(sock, jid) {
    return await sock.groupRequestParticipantsList(jid);
}

/**
 * Approve pending join requests
 * @param {any} sock Baileys socket instance
 * @param {string} jid Group JID
 * @param {string[]} participants Array of participant JIDs to approve
 */
export async function groupApproveParticipants(sock, jid, participants) {
    return await sock.groupRequestParticipantsUpdate(jid, participants, 'approve');
}

/**
 * Reject pending join requests
 * @param {any} sock Baileys socket instance
 * @param {string} jid Group JID
 * @param {string[]} participants Array of participant JIDs to reject
 */
export async function groupRejectParticipants(sock, jid, participants) {
    return await sock.groupRequestParticipantsUpdate(jid, participants, 'reject');
}
