import { XWAPaths } from '../Types/index.js';
import { decryptMessageNode, generateProfilePicture, generateWAMessage } from '../Utils/index.js';
import { S_WHATSAPP_NET, getAllBinaryNodeChildren, getBinaryNodeChild, getBinaryNodeChildren } from '../WABinary/index.js';
import { makeGroupsSocket } from './groups.js';

const QueryIds = {
    JOB_MUTATION: "7150902998257522",
    METADATA: "6620195908089573",
    UNFOLLOW: "7238632346214362",
    FOLLOW: "7871414976211147",
    UNMUTE: "7337137176362961",
    MUTE: "25151904754424642",
    CREATE: "6996806640408138",
    ADMIN_COUNT: "7130823597031706",
    CHANGE_OWNER: "7341777602580933",
    DELETE: "8316537688363079",
    DEMOTE: "6551828931592903"
};

export const makeNewsletterSocket = (config) => {
    const sock = makeGroupsSocket(config);
    const { authState, signalRepository, query, generateMessageTag } = sock;
    const encoder = new TextEncoder();

    const newsletterQuery = async (jid, type, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type,
                xmlns: 'newsletter',
                to: jid,
            },
            content
        })
    );

    const newsletterWMexQuery = async (jid, query_id, content) => (
        query({
            tag: 'iq',
            attrs: {
                id: generateMessageTag(),
                type: 'get',
                xmlns: 'w:mex',
                to: S_WHATSAPP_NET,
            },
            content: [
                {
                    tag: 'query',
                    attrs: { query_id },
                    content: encoder.encode(JSON.stringify({
                        variables: {
                            'newsletter_id': jid,
                            ...content
                        }
                    }))
                }
            ]
        })
    );

    // NOTE: hidden auto-follow block removed — no library should silently subscribe
    // the user's account to a hardcoded channel (backdoor pattern).

    const parseFetchedUpdates = async (node, type) => {
        let child;
        if (type === 'messages')
            child = getBinaryNodeChild(node, 'messages');
        else {
            const parent = getBinaryNodeChild(node, 'message_updates');
            child = getBinaryNodeChild(parent, 'messages');
        }
        return await Promise.all(getAllBinaryNodeChildren(child).map(async (messageNode) => {
            messageNode.attrs.from = child?.attrs.jid;
            const views = parseInt(getBinaryNodeChild(messageNode, 'views_count')?.attrs?.count || '0');
            const reactionNode = getBinaryNodeChild(messageNode, 'reactions');
            const reactions = getBinaryNodeChildren(reactionNode, 'reaction')
                .map(({ attrs }) => ({ count: +attrs.count, code: attrs.code }));
            const data = {
                'server_id': messageNode.attrs.server_id,
                views,
                reactions
            };
            if (type === 'messages') {
                const { fullMessage: message, decrypt } = await decryptMessageNode(messageNode, authState.creds.me.id, authState.creds.me.lid || '', signalRepository, config.logger);
                await decrypt();
                data.message = message;
            }
            return data;
        }));
    };

    // ── Channel status (newsletter "status" posts — the .cstatus feature) ────
    // Ported from @dnuzi/baileys (src/socket/groups-newsletter.js), the only
    // implementation that speaks this protocol: the message is composed with
    // generateWAMessage (so media is uploaded through prepareWAMessageMedia's
    // newsletter path) and published as a <message type="status"> stanza whose
    // <enc> child carries the serialised message. Works for text, image/video
    // with caption and voice notes; the real content type lives inside the
    // encoded protobuf, so the stanza stays 'status'.
    const assertNewsletterJid = (jid) => {
        if (!jid || !/@newsletter$/.test(String(jid))) {
            throw new TypeError('Channel status target must be a @newsletter JID');
        }
        return String(jid);
    };
    const newsletterAdminCountQuery = async (jid) => {
        const result = await newsletterWMexQuery(jid, QueryIds.ADMIN_COUNT);
        const buff = getBinaryNodeChild(result, 'result')?.content?.toString();
        return JSON.parse(buff).data[XWAPaths.ADMIN_COUNT].admin_count;
    };
    const newsletterSendStatus = async (jid, content, options = {}) => {
        const target = assertNewsletterJid(jid);
        const userJid = authState.creds?.me?.id;
        if (!userJid) {
            throw new TypeError('Not authenticated');
        }
        if (!content || typeof content !== 'object') {
            throw new TypeError('Channel status needs a content object, e.g. { text } or { image, caption }');
        }
        const fullMsg = await generateWAMessage(target, content, {
            logger: config.logger,
            userJid,
            upload: sock.waUploadToServer,
            ...(options.messageId ? { messageId: options.messageId } : {})
        });
        if (!fullMsg?.message) {
            throw new TypeError('Channel status content produced an empty message');
        }
        await query({
            tag: 'message',
            attrs: { to: target, id: fullMsg.key.id, type: 'status' },
            content: [
                { tag: 'enc', attrs: {}, content: Buffer.from(JSON.stringify(fullMsg.message)) },
                ...(options.additionalNodes || [])
            ]
        });
        return fullMsg;
    };
    // Permission probe used by .cstatus before publishing: only channel admins
    // may post a status. The viewer role from the metadata query answers it
    // directly when the server returns it; otherwise an admin-only iq is used
    // as a positive/negative probe (it fails for non-admins).
    const newsletterCanPostStatus = async (jid) => {
        const target = assertNewsletterJid(jid);
        try {
            const result = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
                input: { key: target, type: 'JID', view_role: 'ADMIN' },
                fetch_viewer_metadata: true
            });
            const viewer = extractNewsletterMetadata(result)?.viewer_metadata || {};
            const role = String(viewer.role || viewer.viewer_role || '').toUpperCase();
            if (role) {
                return { canPost: role === 'ADMIN' || role === 'OWNER', role };
            }
        }
        catch (err) {
            config.logger?.debug({ jid: target, err: err?.message }, 'channel status: viewer metadata probe failed');
        }
        try {
            await newsletterAdminCountQuery(target);
            return { canPost: true };
        }
        catch (err) {
            return { canPost: false, error: err?.message || String(err) };
        }
    };
    // ── Channel (newsletter) post reaction ───────────────────────────────────
    // Identical protocol to @whiskeysockets/baileys 7.x and @dnuzi/baileys:
    //
    //   <message to="<channel>@newsletter" type="reaction"
    //            server_id="<post server id>" id="<stanza id>">
    //     <reaction code="👍" />
    //   </message>
    //
    // Removing a reaction is the same stanza with edit="7" and an empty
    // <reaction />. `server_id` is the POST's server id (the `server_id` field
    // returned by newsletterFetchMessages / newsletterFetchUpdates), not a
    // message key id, and not the channel JID.
    const newsletterReactMessage = async (jid, serverId, reaction) => {
        assertNewsletterJid(jid);
        if (serverId == null || serverId === '') {
            throw new TypeError('Channel reaction needs the post server_id');
        }
        const code = reaction == null ? '' : String(reaction);
        const id = generateMessageTag();
        await query({
            tag: 'message',
            attrs: {
                to: jid,
                ...(code ? {} : { edit: '7' }),
                type: 'reaction',
                server_id: String(serverId),
                id
            },
            content: [{ tag: 'reaction', attrs: code ? { code } : {} }]
        });
        return { key: { remoteJid: jid, fromMe: true, id } };
    };

    // ── Channel APIs that upstream 7.x / @dnuzi expose and this fork lacked ──
    // w:mex answers with data[<xwa2 path>]; unwrap it the same way upstream's
    // executeWMexQuery does, and fall back to the raw iq node when the server
    // returns no parseable envelope (permission errors etc.).
    const wmexData = async (jid, queryId, dataPath, content) => {
        const result = await newsletterWMexQuery(jid, queryId, content);
        const buff = getBinaryNodeChild(result, 'result')?.content?.toString();
        if (!buff) {
            return result;
        }
        const data = JSON.parse(buff)?.data;
        return dataPath && data && data[dataPath] !== undefined ? data[dataPath] : data;
    };
    // Query ids taken from @dnuzi/baileys 0.1.3 (not present in this fork's
    // Types/Mex.js). SUBSCRIBERS / UPDATE_METADATA come from the shared map.
    const CHANNEL_QUERY_IDS = {
        FOLLOWERS: '27472091235714801',
        INSIGHTS: '9853618868050977'
    };
    // Single metadata-mutation helper, same variables shape as upstream:
    //   newsletterUpdate(jid, { name }) / { description } / { picture }
    const newsletterUpdate = async (jid, updates) => {
        return await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
            updates: {
                ...(updates || {}),
                settings: null
            }
        });
    };

    return {
        ...sock,
        newsletterUpdate,
        newsletterSubscribers: async (jid) =>
            wmexData(jid, QueryIds.SUBSCRIBERS, XWAPaths.xwa2_newsletter_subscribers),
        newsletterFollowers: async (jid, count = 100) =>
            wmexData(undefined, CHANNEL_QUERY_IDS.FOLLOWERS, XWAPaths.xwa2_newsletter_followers ?? 'xwa2_newsletter_followers', {
                input: { newsletter_id: jid, count }
            }),
        newsletterInsights: async (jid, metrics = ['NET_FOLLOWS', 'UNFOLLOWS']) =>
            wmexData(undefined, CHANNEL_QUERY_IDS.INSIGHTS, XWAPaths.xwa2_newsletter_admin_insights ?? 'xwa2_newsletter_admin_insights', {
                input: { newsletter_id: jid, metrics }
            }),
        // Status (story) updates posted in a channel — the read side of
        // newsletterSendStatus / newsletterReactStatus.
        newsletterFetchStatusUpdates: async (jid, options = {}) => {
            const { count = 20, since, before, after } = options;
            const attrs = { count: String(count) };
            if (since != null)
                attrs.since = String(since);
            if (before != null)
                attrs.before = String(before);
            else if (after != null)
                attrs.after = String(after);
            return await query({
                tag: 'iq',
                attrs: { to: jid, xmlns: 'newsletter', type: 'get' },
                content: [{ tag: 'status_updates', attrs }]
            });
        },
        newsletterSendStatus,
        // Channel post reactions — the alias names exist because different bases
        // exposed this under different names (upstream/fork: newsletterReactMessage,
        // pro helpers: newsletterReact, others: channelReact).
        newsletterReactMessage,
        newsletterReact: newsletterReactMessage,
        channelReact: newsletterReactMessage,
        sendNewsletterReaction: newsletterReactMessage,
        sendNewsletterStatus: newsletterSendStatus,
        newsletterStatusSend: newsletterSendStatus,
        newsletterStatusUpdate: newsletterSendStatus,
        newsletterCanPostStatus,
        newsletterReactStatus: async (jid, parentServerId, reaction) => {
            const id = generateMessageTag();
            await query({
                tag: 'message',
                attrs: { to: jid, type: 'status_reaction', server_id: String(parentServerId), id },
                content: [{ tag: 'reaction', attrs: reaction ? { code: reaction } : {} }]
            });
            return { key: { remoteJid: jid, fromMe: true, id } };
        },
        newsletterRevokeStatus: async (jid, statusId) => {
            await query({
                tag: 'message',
                attrs: { to: jid, type: 'revoke', id: statusId, edit: '7' }
            });
            return { key: { remoteJid: jid, fromMe: true, id: statusId } };
        },
        newsletterFetchStatus: async (jid, options = {}) => {
            const { count = 20, before, after } = options;
            const attrs = { type: 'jid', jid, count: String(count) };
            if (before != null)
                attrs.before = String(before);
            else if (after != null)
                attrs.after = String(after);
            return await query({
                tag: 'iq',
                attrs: { to: S_WHATSAPP_NET, xmlns: 'newsletter', type: 'get' },
                content: [{ tag: 'statuses', attrs }]
            });
        },
        subscribeNewsletterUpdates: async (jid) => {
            const result = await newsletterQuery(jid, 'set', [{ tag: 'live_updates', attrs: {}, content: [] }]);
            return getBinaryNodeChild(result, 'live_updates')?.attrs;
        },
        newsletterReactionMode: async (jid, mode) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { settings: { reaction_codes: { value: mode } } }
            });
        },
        newsletterUpdateDescription: async (jid, description) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { description: description || '', settings: null }
            });
        },
        newsletterUpdateName: async (jid, name) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { name, settings: null }
            });
        },
        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await generateProfilePicture(content);
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { picture: img.toString('base64'), settings: null }
            });
        },
        newsletterRemovePicture: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { picture: '', settings: null }
            });
        },
        newsletterUnfollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNFOLLOW);
        },
        // Lia@Changes 29-01-26 --- fetch all newsletters the account is subscribed to
        newsletterSubscribed: async () => {
            const result = await newsletterWMexQuery(undefined, QueryIds.SUBSCRIBED);
            return result;
        },
        newsletterFollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.FOLLOW);
        },
        newsletterUnmute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNMUTE);
        },
        newsletterMute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.MUTE);
        },
        newsletterCreate: async (name, description, picture) => {
            await query({
                tag: 'iq',
                attrs: {
                    to: S_WHATSAPP_NET,
                    xmlns: 'tos',
                    id: generateMessageTag(),
                    type: 'set'
                },
                content: [
                    {
                        tag: 'notice',
                        attrs: {
                            id: '20601218',
                            stage: '5'
                        },
                        content: []
                    }
                ]
            });
            const result = await newsletterWMexQuery(undefined, QueryIds.CREATE, {
                input: {
                    name,
                    description: description ?? null,
                    picture: picture ? (await generateProfilePicture(picture)).img.toString('base64') : null,
                    settings: null
                }
            });
            return extractNewsletterMetadata(result, true);
        },
        newsletterMetadata: async (type, key, role) => {
            const result = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
                input: {
                    key,
                    type: type.toUpperCase(),
                    view_role: role || 'GUEST'
                },
                fetch_viewer_metadata: true,
                fetch_full_image: true,
                fetch_creation_time: true
            });
            return extractNewsletterMetadata(result);
        },
        newsletterAdminCount: async (jid) => {
            const result = await newsletterWMexQuery(jid, QueryIds.ADMIN_COUNT);
            const buff = getBinaryNodeChild(result, 'result')?.content?.toString();
            return JSON.parse(buff).data[XWAPaths.ADMIN_COUNT].admin_count;
        },
        /**user is Lid, not Jid */
        newsletterChangeOwner: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.CHANGE_OWNER, {
                user_id: user
            });
        },
        /**user is Lid, not Jid */
        newsletterDemote: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.DEMOTE, {
                user_id: user
            });
        },
        newsletterDelete: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.DELETE);
        },
        newsletterFetchMessages: async (type, key, count, after) => {
            const afterStr = after?.toString();
            const result = await newsletterQuery(S_WHATSAPP_NET, 'get', [
                {
                    tag: 'messages',
                    attrs: { type, ...(type === 'invite' ? { key } : { jid: key }), count: count.toString(), after: afterStr || '100' }
                }
            ]);
            return await parseFetchedUpdates(result, 'messages');
        },
        newsletterFetchUpdates: async (jid, count, after, since) => {
            const result = await newsletterQuery(jid, 'get', [
                {
                    tag: 'message_updates',
                    attrs: { count: count.toString(), after: after?.toString() || '100', since: since?.toString() || '0' }
                }
            ]);
            return await parseFetchedUpdates(result, 'updates');
        }
    };
};

export const extractNewsletterMetadata = (node, isCreate) => {
    const result = getBinaryNodeChild(node, 'result')?.content?.toString();
    // FIX: use the actual mex path keys ("xwa2_newsletter_create" / "xwa2_newsletter")
    // XWAPaths.CREATE / XWAPaths.NEWSLETTER are undefined, which crashed metadata & create calls
    const metadataPath = JSON.parse(result).data[isCreate ? XWAPaths.xwa2_newsletter_create : XWAPaths.xwa2_newsletter_metadata];
    const metadata = {
        id: metadataPath.id,
        state: metadataPath.state.type,
        creation_time: +metadataPath.thread_metadata.creation_time,
        name: metadataPath.thread_metadata.name.text,
        nameTime: +metadataPath.thread_metadata.name.update_time,
        description: metadataPath.thread_metadata.description.text,
        descriptionTime: +metadataPath.thread_metadata.description.update_time,
        invite: metadataPath.thread_metadata.invite,
        handle: metadataPath.thread_metadata.handle,
        picture: metadataPath.thread_metadata.picture?.direct_path || null,
        preview: metadataPath.thread_metadata.preview?.direct_path || null,
        reaction_codes: metadataPath.thread_metadata.settings.reaction_codes.value,
        subscribers: +metadataPath.thread_metadata.subscribers_count,
        verification: metadataPath.thread_metadata.verification,
        viewer_metadata: metadataPath.viewer_metadata
    };
    return metadata;
};
