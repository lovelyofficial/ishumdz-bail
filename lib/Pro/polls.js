import crypto from 'crypto';
import { proto } from '../../WAProto/index.js';
import { getAggregateVotesInPollMessage } from '../Utils/messages.js';

/**
 * High-level Pro Polls API for chama-bailez-pro
 * Supports creating polls and voting in both E2EE chats/groups and WhatsApp Channels (Newsletters).
 */

/**
 * Send a poll to a user, group, or channel
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat, group, or channel JID
 * @param {{ name: string, values: string[], selectableCount?: number, toNewsletter?: boolean }} pollData 
 */
export async function sendPoll(sock, jid, pollData) {
    if (!pollData || !pollData.name || !Array.isArray(pollData.values) || pollData.values.length < 2) {
        throw new Error('Poll requires a name (question) and at least 2 option values.');
    }

    const selectableCount = pollData.selectableCount || 1;

    // Direct channel poll formatting
    if (jid.endsWith('@newsletter') || pollData.toNewsletter) {
        const options = pollData.values.map(val => ({ optionName: val }));
        return await sock.sendMessage(jid, {
            poll: {
                name: pollData.name,
                values: pollData.values,
                selectableCount
            }
        });
    }

    // Standard individual or group chat poll
    return await sock.sendMessage(jid, {
        poll: {
            name: pollData.name,
            values: pollData.values,
            selectableCount
        }
    });
}

/**
 * Programmatically cast a vote on a poll
 * @param {any} sock Baileys socket instance
 * @param {string} jid Target chat, group, or channel JID
 * @param {any} pollKeyOrMsg Poll creation message key or message object or serverId
 * @param {string[]|string} selectedOptions Array of option strings or single option string
 */
export async function sendPollVote(sock, jid, pollKeyOrMsg, selectedOptions) {
    const optionsArray = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];
    if (!optionsArray.length) {
        throw new Error('Must specify at least one option to vote for.');
    }

    // 1. Channel (Newsletter) Poll Vote
    if (jid.endsWith('@newsletter')) {
        let serverId = null;
        if (typeof pollKeyOrMsg === 'string' || typeof pollKeyOrMsg === 'number') {
            serverId = pollKeyOrMsg.toString();
        } else if (pollKeyOrMsg?.server_id || pollKeyOrMsg?.newsletterServerId || pollKeyOrMsg?.serverId) {
            serverId = (pollKeyOrMsg.server_id || pollKeyOrMsg.newsletterServerId || pollKeyOrMsg.serverId).toString();
        } else if (pollKeyOrMsg?.key?.server_id || pollKeyOrMsg?.key?.id) {
            serverId = (pollKeyOrMsg.key.server_id || pollKeyOrMsg.key.id).toString();
        }

        if (!serverId) {
            throw new Error('Server ID is required to vote on a newsletter poll.');
        }

        const primaryOption = optionsArray[0];
        const optionHash = crypto.createHash('sha256').update(primaryOption).digest();
        const optionHashHex = optionHash.toString('hex');

        // Relay channel poll update message
        const channelPollUpdateMsg = {
            pollUpdateMessage: {
                pollCreationMessageKey: {
                    remoteJid: jid,
                    id: serverId,
                    fromMe: false
                },
                senderTimestampMs: Date.now()
            }
        };

        const relayResult = await sock.relayMessage(jid, channelPollUpdateMsg, {
            additionalAttributes: {
                server_id: serverId
            }
        });

        // Also query standard stanza
        try {
            await sock.query({
                tag: 'message',
                attrs: {
                    to: jid,
                    type: 'poll',
                    server_id: serverId,
                    id: sock.generateMessageTag()
                },
                content: [
                    {
                        tag: 'poll_vote',
                        attrs: {
                            option: optionHashHex
                        }
                    }
                ]
            }).catch(() => {});
        } catch (e) {}

        return {
            success: true,
            type: 'newsletter',
            serverId,
            option: primaryOption,
            optionHashHex,
            relayResult
        };
    }

    // 2. Standard E2EE Chat / Group Poll Vote
    let pollCreation = null;
    let pollMsgId = null;
    let pollCreatorJid = null;
    let fromMe = false;

    if (pollKeyOrMsg?.message) {
        // Full message passed
        pollCreation = pollKeyOrMsg.message.pollCreationMessage || 
                       pollKeyOrMsg.message.pollCreationMessageV2 || 
                       pollKeyOrMsg.message.pollCreationMessageV3;
        pollMsgId = pollKeyOrMsg.key?.id;
        pollCreatorJid = pollKeyOrMsg.key?.participant || pollKeyOrMsg.key?.remoteJid;
        fromMe = pollKeyOrMsg.key?.fromMe || false;
    } else if (pollKeyOrMsg?.id) {
        // Message key passed
        pollMsgId = pollKeyOrMsg.id;
        pollCreatorJid = pollKeyOrMsg.participant || pollKeyOrMsg.remoteJid;
        fromMe = pollKeyOrMsg.fromMe || false;
    }

    if (!pollMsgId) {
        throw new Error('Invalid poll key or message provided. Could not determine poll message ID.');
    }

    const voterJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const selectedOptionHashes = optionsArray.map(opt => crypto.createHash('sha256').update(opt).digest());

    let encPayload = null;
    let encIv = null;

    if (pollCreation && pollCreation.encKey) {
        const sign = Buffer.concat([
            Buffer.from(pollMsgId),
            Buffer.from(pollCreatorJid || jid),
            Buffer.from(voterJid),
            Buffer.from('Poll Vote'),
            new Uint8Array([1])
        ]);
        const key0 = crypto.createHmac('sha256', new Uint8Array(32)).update(pollCreation.encKey).digest();
        const encKey = crypto.createHmac('sha256', key0).update(sign).digest();
        const aad = Buffer.from(`${pollMsgId}\u0000${voterJid}`);
        encIv = crypto.randomBytes(12);

        const voteMsgBytes = proto.Message.PollVoteMessage.encode({
            selectedOptions: selectedOptionHashes
        }).finish();

        const cipher = crypto.createCipheriv('aes-256-gcm', encKey, encIv);
        cipher.setAAD(aad);
        const ct = cipher.update(voteMsgBytes);
        const final = cipher.final();
        const tag = cipher.getAuthTag();
        encPayload = Buffer.concat([ct, final, tag]);
    }

    const pollUpdateMessage = {
        pollCreationMessageKey: {
            remoteJid: jid,
            id: pollMsgId,
            fromMe,
            participant: pollCreatorJid
        },
        vote: encPayload ? {
            encPayload,
            encIv
        } : undefined,
        senderTimestampMs: Date.now()
    };

    const relayRes = await sock.relayMessage(jid, { pollUpdateMessage }, {});
    return {
        success: true,
        type: 'e2ee',
        pollMsgId,
        votedOptions: optionsArray,
        relayResult: relayRes
    };
}

/**
 * Get aggregate vote counts and voter list from a poll message
 * @param {any} sock Baileys socket instance
 * @param {any} pollMessage The stored poll message object containing reactions/pollUpdates
 */
export function getAggregatePollVotes(sock, pollMessage) {
    if (!pollMessage) return [];
    return getAggregateVotesInPollMessage(pollMessage, sock.user?.id);
}
