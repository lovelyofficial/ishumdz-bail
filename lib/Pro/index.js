import * as PollsPro from './polls.js';
import * as NewsletterPro from './newsletter.js';
import * as StatusPro from './status.js';
import * as ChatsPro from './chats.js';
import * as GroupsPro from './groups.js';
import * as ProfilePro from './profile.js';

export * from './polls.js';
export * from './newsletter.js';
export * from './status.js';
export * from './chats.js';
export * from './groups.js';
export * from './profile.js';

/**
 * Attaches all high-level Pro features directly onto the Baileys socket instance
 * @param {any} sock The Baileys socket instance
 */
export function attachProMethods(sock) {
    if (!sock) return sock;

    // --- 📊 Polls Pro ---
    sock.sendPoll = (jid, pollData) => PollsPro.sendPoll(sock, jid, pollData);
    sock.sendPollVote = (jid, pollKeyOrMsg, selectedOptions) => PollsPro.sendPollVote(sock, jid, pollKeyOrMsg, selectedOptions);
    sock.getAggregatePollVotes = (pollMsg) => PollsPro.getAggregatePollVotes(sock, pollMsg);

    // --- 📢 Newsletter & Channels Pro ---
    sock.channelVote = (target, option, serverId) => NewsletterPro.channelVote(sock, target, option, serverId);
    sock.newsletterVoteMessage = (jid, serverId, option) => NewsletterPro.newsletterVoteMessage(sock, jid, serverId, option);
    sock.newsletterReact = (jid, serverId, reaction) => NewsletterPro.newsletterReact(sock, jid, serverId, reaction);
    sock.newsletterGetMessages = (jid, count, since, after) => NewsletterPro.newsletterGetMessages(sock, jid, count, since, after);
    sock.newsletterSearch = (query) => NewsletterPro.newsletterSearch(sock, query);
    sock.newsletterList = () => NewsletterPro.newsletterList(sock);

    // --- 🟢 Status / Stories Pro ---
    sock.sendStatusText = (text, options) => StatusPro.sendStatusText(sock, text, options);
    sock.sendStatusMedia = (media, options) => StatusPro.sendStatusMedia(sock, media, options);
    sock.readStatus = (key) => StatusPro.readStatus(sock, key);
    sock.reactStatus = (key, emoji) => StatusPro.reactStatus(sock, key, emoji);

    // --- 💬 Messaging & Chats Pro ---
    sock.editMessage = (jid, key, newText) => ChatsPro.editMessage(sock, jid, key, newText);
    sock.deleteMessage = (jid, key) => ChatsPro.deleteMessage(sock, jid, key);
    sock.pinMessage = (jid, key, durationInSeconds) => ChatsPro.pinMessage(sock, jid, key, durationInSeconds);
    sock.unpinMessage = (jid, key) => ChatsPro.unpinMessage(sock, jid, key);
    sock.starMessage = (jid, key, star) => ChatsPro.starMessage(sock, jid, key, star);
    sock.reactMessage = (jid, key, emoji) => ChatsPro.reactMessage(sock, jid, key, emoji);
    sock.sendPresence = (jid, presence) => ChatsPro.sendPresence(sock, jid, presence);
    sock.reply = (jid, text, quotedMessage) => ChatsPro.reply(sock, jid, text, quotedMessage);

    // --- 👥 Group Management Pro ---
    sock.groupGetInviteInfo = (code) => GroupsPro.groupGetInviteInfo(sock, code);
    sock.groupJoinViaInvite = (code) => GroupsPro.groupJoinViaInvite(sock, code);
    sock.groupSetAnnouncement = (jid, onlyAdminsCanSend) => GroupsPro.groupSetAnnouncement(sock, jid, onlyAdminsCanSend);
    sock.groupSetLocked = (jid, onlyAdminsCanEdit) => GroupsPro.groupSetLocked(sock, jid, onlyAdminsCanEdit);
    sock.groupRequestParticipantsList = (jid) => GroupsPro.groupRequestParticipantsList(sock, jid);
    sock.groupApproveParticipants = (jid, participants) => GroupsPro.groupApproveParticipants(sock, jid, participants);
    sock.groupRejectParticipants = (jid, participants) => GroupsPro.groupRejectParticipants(sock, jid, participants);

    // --- 👤 Profile, Contacts & Calls Pro ---
    sock.checkNumber = (phoneNumber) => ProfilePro.checkNumber(sock, phoneNumber);
    sock.setBio = (text) => ProfilePro.setBio(sock, text);
    sock.updateProfileName = (name) => ProfilePro.updateProfileName(sock, name);
    sock.setProfilePicture = (jid, content) => ProfilePro.setProfilePicture(sock, jid, content);
    sock.removeProfilePicture = (jid) => ProfilePro.removeProfilePicture(sock, jid);
    sock.rejectCall = (callId, callFrom) => ProfilePro.rejectCall(sock, callId, callFrom);

    return sock;
}
