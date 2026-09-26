import crypto from 'crypto';
import { proto } from '../../WAProto/index.js';
import { getBinaryNodeChild, getBinaryNodeChildren } from '../WABinary/index.js';

/**
 * High-level Pro Newsletter (WhatsApp Channel) API for chama-bailez-pro
 */

/**
 * Cast a vote on a WhatsApp channel poll
 * @param {any} sock Baileys socket instance
 * @param {string} jid Newsletter JID (e.g. 120363427108046852@newsletter)
 * @param {string|number} serverId Server ID of the poll message
 * @param {string} option Option text to vote for
 */
export async function newsletterVoteMessage(sock, jid, serverId, option) {
    const sId = serverId.toString();
    const optionText = option || 'TEST';
    const optionHash = crypto.createHash('sha256').update(optionText).digest();
    const optionHashHex = optionHash.toString('hex');

    const channelPollUpdateMsg = {
        pollUpdateMessage: {
            pollCreationMessageKey: {
                remoteJid: jid,
                id: sId,
                fromMe: false
            },
            senderTimestampMs: Date.now()
        }
    };

    const relayResult = await sock.relayMessage(jid, channelPollUpdateMsg, {
        additionalAttributes: {
            server_id: sId
        }
    });

    try {
        await sock.query({
            tag: 'message',
            attrs: {
                to: jid,
                type: 'poll',
                server_id: sId,
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
        channelJid: jid,
        serverId: sId,
        option: optionText,
        optionHashHex,
        relayResult
    };
}

/**
 * React to a channel post or remove reaction
 * @param {any} sock Baileys socket instance
 * @param {string} jid Newsletter JID
 * @param {string|number} serverId Server ID of message
 * @param {string} [reaction] Emoji string to react, or empty string to remove reaction
 */
export async function newsletterReact(sock, jid, serverId, reaction = '') {
    return await sock.newsletterReactMessage(jid, serverId.toString(), reaction);
}

/**
 * Fetch and decode clean messages from a WhatsApp Channel
 * @param {any} sock Baileys socket instance
 * @param {string} jid Newsletter JID
 * @param {number} [count=20] Number of messages to retrieve
 * @param {number} [since] Optional timestamp filter
 * @param {number} [after] Optional serverId filter (fetch after serverId)
 */
export async function newsletterGetMessages(sock, jid, count = 20, since = undefined, after = undefined) {
    // FIX: newsletterFetchMessages(type, key, count, after) expects (jid, count, after) —
    // the old call passed `since` into the `after` position and returned parsed updates,
    // then looked for a 'message_updates' wrapper that this query never returns.
    // Request the raw iq -> messages node directly and parse it.
    const raw = await sock.query({
        tag: 'iq',
        attrs: {
            id: sock.generateMessageTag(),
            type: 'get',
            xmlns: 'newsletter',
            to: 's.whatsapp.net'
        },
        content: [
            {
                tag: 'messages',
                attrs: {
                    type: 'jid',
                    jid,
                    count: count.toString(),
                    ...(after ? { after: after.toString() } : {}),
                    ...(since ? { before: since.toString() } : {})
                }
            }
        ]
    });
    const messagesNode = getBinaryNodeChild(raw, 'messages');
    const messageContainers = messagesNode ? getBinaryNodeChildren(messagesNode, 'message') : [];

    const result = [];
    if (!messageContainers.length) return result;

    for (const m of messageContainers) {
        {
            const serverId = m.attrs?.server_id;
            const messageId = m.attrs?.id;
            // WA uses `t` (unix seconds) for message timestamp
            const timestamp = m.attrs?.t ? parseInt(m.attrs.t, 10) : (m.attrs?.time ? parseInt(m.attrs.time, 10) : null);

            // Extract views and reactions
            const viewsNode = getBinaryNodeChild(m, 'views_count');
            const viewsCount = viewsNode?.attrs?.count ? parseInt(viewsNode.attrs.count, 10) : 0;

            const reactionsNode = getBinaryNodeChild(m, 'reactions');
            const reactions = [];
            if (reactionsNode) {
                const reactionList = getBinaryNodeChildren(reactionsNode, 'reaction');
                for (const r of reactionList) {
                    reactions.push({
                        emoji: r.attrs?.code,
                        count: parseInt(r.attrs?.count || '0', 10)
                    });
                }
            }

            // Extract poll votes
            const votesNode = getBinaryNodeChild(m, 'votes');
            const pollVotes = [];
            if (votesNode) {
                const voteList = getBinaryNodeChildren(votesNode, 'vote');
                for (const v of voteList) {
                    const hashBuffer = v.content;
                    pollVotes.push({
                        count: parseInt(v.attrs?.count || '0', 10),
                        optionHash: Buffer.isBuffer(hashBuffer) ? hashBuffer.toString('hex') : null
                    });
                }
            }

            // Extract protobuf message if available
            const pTextNode = getBinaryNodeChild(m, 'plaintext');
            let decodedMessage = null;
            let text = null;
            let mediaType = null;
            let poll = null;

            if (pTextNode && pTextNode.content) {
                try {
                    decodedMessage = proto.Message.decode(pTextNode.content);
                    text = decodedMessage.conversation || 
                           decodedMessage.extendedTextMessage?.text || 
                           decodedMessage.imageMessage?.caption || 
                           decodedMessage.videoMessage?.caption;

                    if (decodedMessage.imageMessage) mediaType = 'image';
                    else if (decodedMessage.videoMessage) mediaType = 'video';
                    else if (decodedMessage.audioMessage) mediaType = 'audio';
                    else if (decodedMessage.documentMessage) mediaType = 'document';

                    const pollMsg = decodedMessage.pollCreationMessage || 
                                    decodedMessage.pollCreationMessageV2 || 
                                    decodedMessage.pollCreationMessageV3;

                    if (pollMsg) {
                        mediaType = 'poll';
                        poll = {
                            name: pollMsg.name,
                            options: (pollMsg.options || []).map(o => ({
                                name: o.optionName,
                                hash: crypto.createHash('sha256').update(o.optionName || '').digest('hex')
                            })),
                            selectableCount: pollMsg.selectableOptionsCount || 1,
                            votes: pollVotes
                        };
                    }
                } catch (e) {}
            }

            result.push({
                serverId,
                messageId,
                timestamp,
                mediaType: mediaType || (pollVotes.length > 0 ? 'poll' : 'text'),
                text,
                poll,
                viewsCount,
                reactions,
                rawProto: decodedMessage
            });
        }
    }

    return result;
}

/**
 * Search public WhatsApp Channels via directory
 * @param {any} sock Baileys socket instance
 * @param {string} query Search keyword
 */
export async function newsletterSearch(sock, query) {
    if (!query) throw new Error('Search query is required');
    const result = await sock.query({
        tag: 'iq',
        attrs: {
            id: sock.generateMessageTag(),
            type: 'get',
            xmlns: 'newsletter',
            to: 's.whatsapp.net'
        },
        content: [
            {
                tag: 'search',
                attrs: { query }
            }
        ]
    }).catch(async () => {
        // Fallback to metadata lookup if query is an invite code
        return await sock.newsletterMetadata('invite', query);
    });
    return result;
}

/**
 * Fetch list of followed / joined newsletters
 * @param {any} sock Baileys socket instance
 */
export async function newsletterList(sock) {
    try {
        const result = await sock.query({
            tag: 'iq',
            attrs: {
                id: sock.generateMessageTag(),
                type: 'get',
                xmlns: 'newsletter',
                to: 's.whatsapp.net'
            },
            content: [{ tag: 'subscribed', attrs: {} }]
        });
        return result;
    } catch (e) {
        return [];
    }
}

/**
 * Smart Channel (Newsletter) Poll Vote
 * Automatically resolves channel links, quoted messages, message IDs, and option indexes.
 *
 * @param {any} sock Baileys socket instance
 * @param {string|object} target Channel URL, JID, or quoted message/contextInfo
 * @param {string|number} option Option text or 1-based index (e.g. 1, 2)
 * @param {string|number} [explicitServerId] Optional explicit message server ID
 */
export async function channelVote(sock, target, option, explicitServerId = null) {
    if (!sock) throw new Error('Socket instance is required');
    if (!target) throw new Error('Target (link, JID, or quoted message) is required');
    if (option === undefined || option === null || option === '') {
        throw new Error('Option or option number to vote for is required');
    }

    let jid = null;
    let serverId = explicitServerId ? explicitServerId.toString() : null;
    let pollOptions = null;

    // Case 1: Target is an object (quoted message or contextInfo)
    if (typeof target === 'object') {
        const ctx = target.extendedTextMessage?.contextInfo || target.contextInfo || target;

        // Try to get newsletter JID
        if (ctx.forwardedNewsletterMessageInfo?.newsletterJid) {
            jid = ctx.forwardedNewsletterMessageInfo.newsletterJid;
            if (ctx.forwardedNewsletterMessageInfo.serverMessageId) {
                serverId = ctx.forwardedNewsletterMessageInfo.serverMessageId.toString();
            }
        } else if (ctx.remoteJid?.endsWith('@newsletter')) {
            jid = ctx.remoteJid;
        } else if (ctx.participant?.endsWith('@newsletter')) {
            jid = ctx.participant;
        }

        if (!serverId && (ctx.stanzaId || ctx.server_id || ctx.serverId)) {
            serverId = (ctx.server_id || ctx.serverId || ctx.stanzaId).toString();
        }

        // Try to extract poll options from quoted message
        const qm = ctx.quotedMessage || target.message;
        const pollMsg = qm?.pollCreationMessage || qm?.pollCreationMessageV2 || qm?.pollCreationMessageV3;
        if (pollMsg?.options?.length) {
            pollOptions = pollMsg.options.map((o) => o.optionName);
        }
    } else if (typeof target === 'string') {
        const trimmed = target.trim();
        // Check for WhatsApp Channel link (e.g. https://whatsapp.com/channel/0029Va84sN7J93wUd3cWwX2c/123)
        const channelLinkMatch = trimmed.match(/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)(?:\/(\d+))?/i);
        if (channelLinkMatch) {
            const inviteCode = channelLinkMatch[1];
            const urlServerId = channelLinkMatch[2];
            if (urlServerId) serverId = urlServerId;

            // Resolve invite code to newsletter metadata
            try {
                const meta = await sock.newsletterMetadata('invite', inviteCode);
                jid = meta?.id || meta?.jid;
            } catch (err) {
                throw new Error(`Could not resolve channel invite "${inviteCode}": ${err.message}`);
            }
        } else if (trimmed.endsWith('@newsletter')) {
            jid = trimmed;
        }
    }

    if (!jid) {
        throw new Error('Could not determine Channel (Newsletter) JID from target.');
    }

    // If serverId or pollOptions is missing, attempt to fetch recent messages to locate the poll
    if (!serverId || !pollOptions) {
        try {
            const recent = await newsletterGetMessages(sock, jid, 25);
            const targetPoll = serverId
                ? recent.find((m) => m.serverId?.toString() === serverId && (m.mediaType === 'poll' || m.poll)) ||
                  recent.find((m) => m.serverId?.toString() === serverId)
                : recent.find((m) => m.mediaType === 'poll' || m.poll);
            if (targetPoll) {
                if (!serverId) serverId = targetPoll.serverId?.toString();
                if (targetPoll.poll?.options?.length) {
                    pollOptions = targetPoll.poll.options.map((o) => o.name);
                }
            }
        } catch {}
    }

    if (!serverId) {
        throw new Error('Could not find poll message server ID in this channel.');
    }

    // Map numeric index (1, 2...), single letter (A, B, C...), or match case-insensitively
    let selectedOptionText = String(option).trim();
    if (pollOptions && pollOptions.length > 0) {
        if (/^\d+$/.test(selectedOptionText)) {
            const idx = parseInt(selectedOptionText, 10) - 1;
            if (idx >= 0 && idx < pollOptions.length) {
                selectedOptionText = pollOptions[idx];
            }
        } else if (/^[a-zA-Z]$/.test(selectedOptionText)) {
            const letterIdx = selectedOptionText.toUpperCase().charCodeAt(0) - 65;
            const exactLetterMatch = pollOptions.find((o) => o.trim().toUpperCase() === selectedOptionText.toUpperCase());
            if (exactLetterMatch) {
                selectedOptionText = exactLetterMatch;
            } else if (letterIdx >= 0 && letterIdx < pollOptions.length) {
                selectedOptionText = pollOptions[letterIdx];
            }
        } else {
            const matched = pollOptions.find((o) => o.toLowerCase() === selectedOptionText.toLowerCase());
            if (matched) selectedOptionText = matched;
        }
    }

    // Cast the vote
    const voteResult = await newsletterVoteMessage(sock, jid, serverId, selectedOptionText);
    return {
        ...voteResult,
        channelJid: jid,
        serverId,
        selectedOption: selectedOptionText,
        option: selectedOptionText
    };
}

