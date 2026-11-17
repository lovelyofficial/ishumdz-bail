// Bot compatibility layer (ported from the bot's old vendor/ishumdz-bail shim).
//
// Everything here is dependency-injected so it stays small and testable.
// The interactive biz/bot stanza nodes, channel status and LID refresh are
// already built into this library, so they are NOT repeated here. What this
// adds on top of the library:
//   1. sock.sendGroupStatus / sock.sendStatusToGroup  (status posted in one group)
//   2. sendMessage content shapes the bot's menus use:
//        { image|video, text, title, subtitle, footer, interactiveButtons: [{name, buttonParamsJson}] }
//        { text, title, footer, buttonText, sections: [{ title, rows: [...] }] }
//      A broken header image/video no longer costs the whole card: the card is
//      sent without the media instead of throwing.

export function createBotCompat(deps) {
  const { generateWAMessageContent, generateWAMessageFromContent, prepareWAMessageMedia, generateMessageID, randomBytes } = deps

  function attachGroupStatus(sock) {
    // A group status is a groupStatusMessageV2 relayed to the group. Text only
    // needs the wrapper, but MEDIA is dropped unless the inner media message
    // carries the same group-status markers the Web client puts on it:
    // contextInfo.statusSourceType (IMAGE/VIDEO/GIF/AUDIO), statusAttributions
    // [{ type: GROUP_STATUS }], featureEligibilities and isGroupStatus.
    const STATUS_SOURCE_TYPE = { image: 0, video: 1, gif: 2, audio: 3, text: 4 }
    const groupStatusContext = (kind) => ({
      forwardingScore: 0,
      isForwarded: false,
      isGroupStatus: true,
      featureEligibilities: { canBeReshared: true, canReceiveMultiReact: true },
      statusSourceType: STATUS_SOURCE_TYPE[kind] ?? STATUS_SOURCE_TYPE.text,
      statusAttributions: [{ type: 5 /* StatusAttribution.Type.GROUP_STATUS */ }]
    })
    sock.sendGroupStatus = async (jid, content, options = {}) => {
      if (!/@g\.us$/.test(String(jid || ''))) {
        throw new Error('Group status target must be a @g.us JID')
      }
      const mediaKind = ['image', 'video', 'gif', 'audio'].find((k) => content && content[k])
      let inner
      if (mediaKind) {
        const prepared = await prepareWAMessageMedia({ ...content }, { upload: sock.waUploadToServer })
        const key = mediaKind === 'gif' ? 'videoMessage' : mediaKind + 'Message'
        if (!prepared || !prepared[key]) {
          throw new Error('Group status media could not be prepared (' + mediaKind + ')')
        }
        prepared[key].contextInfo = { ...(prepared[key].contextInfo || {}), ...groupStatusContext(mediaKind) }
        if (mediaKind === 'gif') prepared[key].gifPlayback = true
        inner = { [key]: prepared[key] }
      } else {
        const text = content?.text || content?.caption || ''
        if (!text) throw new Error('Group status needs text or media')
        inner = { conversation: text }
      }
      const messageSecret = randomBytes(32)
      const message = {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: { message: { ...inner, messageContextInfo: { messageSecret } } }
      }
      const messageId = options.messageId || generateMessageID()
      await sock.relayMessage(jid, message, { messageId })
      return { key: { remoteJid: jid, fromMe: true, id: messageId }, message }
    }
    sock.sendStatusToGroup = sock.sendGroupStatus
    return sock
  }

  const isRawNativeButton = (b) =>
    !!b && typeof b.name === 'string' && (typeof b.buttonParamsJson === 'string' || typeof b.paramsJson === 'string')

  function attachContentShapes(sock) {
    if (typeof sock.sendMessage !== 'function') return sock
    const originalSendMessage = sock.sendMessage.bind(sock)

    const buildHeader = async (content) => {
      const header = { hasMediaAttachment: false }
      if (content.title) {
        header.title = content.title
        header.subtitle = content.subtitle || ''
      }
      const tryMedia = async (kind, value) => {
        try {
          const prepared = await prepareWAMessageMedia({ [kind]: value }, { upload: sock.waUploadToServer })
          const key = kind + 'Message'
          if (prepared && prepared[key]) {
            header[key] = prepared[key]
            header.hasMediaAttachment = true
          }
        } catch (e) {
          console.error('[compat] header ' + kind + ' failed, sending card without it:', (e && e.message) || e)
        }
      }
      if (content.image) await tryMedia('image', content.image)
      else if (content.video) await tryMedia('video', content.video)
      else if (content.thumbnail) {
        header.jpegThumbnail = content.thumbnail
        header.hasMediaAttachment = true
      }
      return header
    }

    const buildInteractive = async (content) => {
      const interactiveMessage = {
        nativeFlowMessage: {
          buttons: content.interactiveButtons.map((b) => ({
            name: b.name || 'quick_reply',
            buttonParamsJson: b.buttonParamsJson || b.paramsJson || '{}'
          })),
          messageParamsJson: content.messageParams || '{}',
          messageVersion: content.messageVersion || 1
        }
      }
      const bodyText = content.text || content.caption
      if (bodyText) interactiveMessage.body = { text: bodyText }
      if (content.footer) interactiveMessage.footer = { text: content.footer }
      const header = await buildHeader(content)
      if (header.title || header.subtitle || header.hasMediaAttachment) interactiveMessage.header = header
      return { interactiveMessage }
    }

    const buildList = (content) => ({
      interactiveMessage: {
        body: { text: content.text || content.caption || '' },
        ...(content.footer ? { footer: { text: content.footer } } : {}),
        ...(content.title
          ? { header: { title: content.title, subtitle: content.subtitle || '', hasMediaAttachment: false } }
          : {}),
        nativeFlowMessage: {
          buttons: [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: content.buttonText || 'Select',
              sections: (content.sections || []).map((s) => ({
                title: s.title || '',
                highlight_label: '',
                rows: (s.rows || []).map((r) => ({
                  header: '',
                  title: r.title || '',
                  description: r.description || '',
                  id: r.rowId || r.id || ''
                }))
              }))
            })
          }],
          messageParamsJson: '',
          messageVersion: 1
        }
      }
    })

    sock.sendMessage = async (jid, content, options = {}) => {
      if (content && typeof content === 'object') {
        let message = null
        try {
          if (Array.isArray(content.interactiveButtons) && content.interactiveButtons.length &&
              content.interactiveButtons.every(isRawNativeButton)) {
            message = await buildInteractive(content)
          } else if (Array.isArray(content.sections) && content.sections.length &&
                     typeof content.buttonText === 'string' && !content.productListInfo) {
            message = buildList(content)
          }
        } catch (e) {
          console.error('[compat] interactive content build failed, sending as-is:', (e && e.message) || e)
          message = null
        }
        if (message) {
          const fullMsg = await generateWAMessageFromContent(jid, message, {
            userJid: sock.user && sock.user.id,
            quoted: options.quoted
          })
          await sock.relayMessage(jid, message, { messageId: fullMsg.key.id })
          return fullMsg
        }
      }
      return originalSendMessage(jid, content, options)
    }
    return sock
  }

  return {
    attachGroupStatus,
    attachContentShapes,
    attach(sock) {
      attachGroupStatus(sock)
      attachContentShapes(sock)
      return sock
    }
  }
}
