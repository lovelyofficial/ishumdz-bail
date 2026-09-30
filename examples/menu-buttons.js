/**
 * menu-buttons.js — ISHAN-X MD PRO .menu with horizontal buttons + full menu sheet
 * (ishumdz-bail v1.0.19+)
 *
 * Renders:
 *  ┌────────────────────────────┐
 *  │     [custom img / GIF]     │
 *  │  menu message (caption)    │
 *  │  footer                    │
 *  ├────────────────────────────┤
 *  │  ☰ menu   │  🔍 owner      │ ← horizontal quick replies
 *  │  📂 allmenus               │ ← tap → full list sheet
 *  └────────────────────────────┘
 *
 * This is a REFERENCE file — copy `resolveButtonResponse` and the
 * `case 'menu'` body into your own bot command switch.
 */

const axios = require('axios')
const os = require('os')
const moment = require('moment-timezone')

// ─────────────────────────────────────────────────────────────
// Button click → command bridge
// Put this ONCE inside your messages.upsert handler, BEFORE
// the command parser. Native flow clicks get rewritten into
// normal text commands so all existing cases keep working.
// ─────────────────────────────────────────────────────────────
function resolveButtonResponse(msg) {
    // classic horizontal buttons
    const classic = msg.message?.buttonsResponseMessage?.selectedButtonId
    if (classic) return classic

    // native flow (single_select sheet / quick_reply)
    const nf = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage
    if (nf?.paramsJson) {
        try {
            const p = JSON.parse(nf.paramsJson)
            return p.id || p.selectedId || p.selected_row_id || null
        } catch { /* ignore */ }
    }
    // list response (classic listMessage)
    const list = msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId
    if (list) return list

    return null
}

// ─────────────────────────────────────────────────────────────
// case 'menu' — reference implementation (paste inside your
// bot's switch(command) block; the wrapping switch is omitted
// so this file stays valid standalone JS)
// ─────────────────────────────────────────────────────────────
async function menuCase() {
  // eslint-disable-next-line no-unreachable
  switch (0) {
  case 'menu': {
  try {
    // 📖 Initial reaction
    await socket.sendMessage(sender, { react: { text: "📖", key: msg.key } });

    let pingMsg = await socket.sendMessage(sender, { text: '`LOADING`' }, { quoted: msg });
    await socket.sendMessage(sender, { text: '`BOT/S MENU` ✅', edit: pingMsg.key });

    // Hostname check
    let hostname;
    const hostLen = os.hostname().length;
    if (hostLen === 12) hostname = "Replit";
    else if (hostLen === 36) hostname = "Heroku";
    else if (hostLen === 8) hostname = "Koyeb";
    else hostname = os.hostname();

    // RAM / uptime / CPU
    const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const ramTotal = Math.round(os.totalmem() / 1024 / 1024);
    const uptimeSec = process.uptime();
    const ud = Math.floor(uptimeSec / (24 * 3600));
    const uh = Math.floor((uptimeSec % (24 * 3600)) / 3600);
    const um = Math.floor((uptimeSec % 3600) / 60);
    const uptimeStr = `${ud}d ${uh}h ${um}m`;

    // 🌐 Owner data from GitHub
    const ownerdata = (await axios.get(
      "https://raw.githubusercontent.com/Dilu-x/OWNER_DATA/refs/heads/main/ownerdata"
    )).data;

    const { footer, imageurl0, version, botname, ownername, ownernumber, platform } = ownerdata;
    const ownerNumbers = getPublicOwnerNumber() || ownernumber;
    const pairlink = BOT_WEB_URL;
    const pushname = msg.pushName || 'Guest';

    const bc = await resolveDisplayBotConfig(socket, nowsender);
    const personalBotname = bc.botName;
    const menuVars = { botname: personalBotname, pushname, name: pushname, jid: nowsender, version: config.BOT_VERSION };
    const menuHeaderLine = bc.menuHeader ? renderBaseTemplate(bc.menuHeader, menuVars) : '*╭〔 𝙄𝙎𝙃𝘼𝙉-𝙓 𝙈𝘿 𝙋𝙍𝙊 𝙈𝙀𝙉𝙐 〕┈⊷❖●►*';
    const menuFooterLine = `> *├➣🌍ʙᴏᴛ ᴡᴇʙ:* *${pairlink}*`;

    // Sinhala greeting (Sri Lanka time)
    const nowSL = moment().tz('Asia/Colombo');
    const hourSL = nowSL.hour();
    let sinhalaGreeting, greetingEmoji;
    if (hourSL >= 5 && hourSL < 12)      { sinhalaGreeting = 'සුභ උදෑසනක් 🌄'; greetingEmoji = '🌤️'; }
    else if (hourSL >= 12 && hourSL < 17){ sinhalaGreeting = 'සුභ දහවලක් 🏞️'; greetingEmoji = '🌞'; }
    else if (hourSL >= 17 && hourSL < 21){ sinhalaGreeting = 'සුභ හැන්දෑවක් 🌅'; greetingEmoji = '🌥️'; }
    else                                 { sinhalaGreeting = 'සුභ රාත්‍රියක් 🌌'; greetingEmoji = '🌕'; }

    // CPU usage
    const cpuUsage = (() => {
      const cpus = os.cpus();
      let totalIdle = 0, totalTick = 0;
      cpus.forEach(cpu => {
        for (const type in cpu.times) totalTick += cpu.times[type];
        totalIdle += cpu.times.idle;
      });
      return (100 - (totalIdle / totalTick * 100)).toFixed(1) + '%';
    })();

    // Respond speed
    const _pingStart = Date.now();
    await new Promise(r => setTimeout(r, 0));
    const respondSpeed = (Date.now() - _pingStart) + 'ms';

    const menuTime = nowSL.format('hh:mm:ss A');
    const menuDate = nowSL.format('YYYY-MM-DD');
    const dayEmojiMap = { 0: '☀️', 1: '🌙', 2: '🔥', 3: '💧', 4: '⚡', 5: '🌟', 6: '🎉' };
    const dateEmoji = dayEmojiMap[nowSL.day()] || '📆';

    // 📜 Menu message
    const menuMessage = `👋 *${sinhalaGreeting}* *${pushname}* 

${menuHeaderLine}
*❒╮*
*├➣${greetingEmoji}ɢʀᴇᴇᴛɪɴɢ:* *${sinhalaGreeting}*
*├➣⏰𝚃𝙸𝙼𝙴:* *${menuTime}*
*├➣⚡𝙳𝙰𝚃𝙴:* *${menuDate}*
*├➣📟ᴜᴘᴛɪᴍᴇ:* *${uptimeStr}*
*├➣💾ʀᴀᴍ: ${ramUsed}MB / ${ramTotal}MB*
*├➣🖥️ᴄᴘᴜ ᴜꜱᴀɢᴇ:* *${cpuUsage}*
*├➣⚡ʀᴇꜱᴘᴏɴᴅ ꜱᴘᴇᴇᴅ:* *${respondSpeed}*
*├➣🤖ʙᴏᴛɴᴀᴍᴇ:* *${personalBotname}*
*├➣💻ᴘʟᴀᴛꜰᴏʀᴍ:* *ʟɪɴᴜx*
*├➣🧬ᴠᴇʀꜱɪᴏɴ:* *${version}*
*├➣🧑‍💻ᴏᴡɴᴇʀ:* *${ownername}*
*├➣🤝ᴘᴀʀᴛɴᴇʀ:* *© ʟᴏᴠᴇʟʏ ᴏꜰꜰɪᴄɪᴀʟ*
*├➣📞ᴏᴡɴᴇʀ ɴᴜᴍʙᴇʀ:* *${ownerNumbers}*
*❒╯*
*╰──────────────❍┈⊷❖◆►*

╭━━〔 📂 𝐒𝐄𝐋𝐄𝐂𝐓 𝐌𝐄𝐍𝐔 〕━━⬣

│ ❶ ➤ 📥 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐌𝐞𝐧𝐮
│ ❷ ➤ ✨ 𝐀𝐈 𝐌𝐞𝐧𝐮
│ ❸ ➤ 🔍 𝐒𝐞𝐚𝐫𝐜𝐡 𝐌𝐞𝐧𝐮
│ ❹ ➤ 📑 𝐎𝐭𝐡𝐞𝐫 𝐌𝐞𝐧𝐮
│ ❺ ➤ 🎨 𝐋𝐨𝐠𝐨 𝐌𝐞𝐧𝐮
│ ❻ ➤ 🎬 𝐌𝐨𝐯𝐢𝐞 𝐌𝐞𝐧𝐮
│ ❼ ➤ 🏠 𝐌𝐚𝐢𝐧 𝐌𝐞𝐧𝐮
│ ❽ ➤ 👨‍💻 𝐎𝐰𝐧𝐞𝐫 𝐌𝐞𝐧𝐮
│ ❾ ➤ 👥 𝐆𝐫𝐨𝐮𝐩 𝐌𝐞𝐧𝐮
│ ❿ ➤ 📰 𝐍𝐞𝐰𝐬 𝐌𝐞𝐧𝐮
│ ⓫ ➤ 🐱 𝐒𝐭𝐢𝐜𝐤𝐞𝐫 𝐌𝐞𝐧𝐮
│ ⓬ ➤ 🧑‍🔧 𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬
│ ⓭ ➤ ⚡ 𝐏𝐢𝐧𝐠𝟐 𝐃𝐚𝐬𝐡𝐛𝐨𝐚𝐫𝐝
│ ⓮ ➤ 🎌 𝐀𝐧𝐢𝐦𝐞 𝐌𝐞𝐧𝐮
│ ⓯ ➤ 🔞 𝐍𝐒𝐅𝐖 𝐌𝐞𝐧𝐮

╰━━━━━━━━━━━━━━━⬣

${menuFooterLine}`;

    // ─────────────────────────────────────────────────────
    // 🔘 Horizontal buttons + tap-to-open list sheet
    // (ishumdz-bail v1.0.22+: button `sections`/`rows` option —
    //  the library builds the single_select sheet for you)
    // ─────────────────────────────────────────────────────
    const menuSections = [
      {
        title: '𝙄𝙎𝙃𝘼𝙉-𝙓 𝙈𝘿 ᴠ.𝟽.𝟶.𝟶 ᴘʀᴏ — ᴍᴇɴᴜ ʟɪꜱᴛ ⭐',
        highlight_label: '⭐ MAIN',
        rows: [
          { title: '📥 Download Menu',    description: 'Downloader commands',  rowId: `${config.PREFIX}downloadmenu` },
          { title: '✨ AI Menu',          description: 'AI commands',          rowId: `${config.PREFIX}aimenu` },
          { title: '🔍 Search Menu',      description: 'Search commands',      rowId: `${config.PREFIX}searchmenu` },
          { title: '📑 Other Menu',       description: 'Other commands',       rowId: `${config.PREFIX}othermenu` },
          { title: '🎨 Logo Menu',        description: 'Logo maker',           rowId: `${config.PREFIX}logomenu` },
          { title: '🎬 Movie Menu',       description: 'Movie commands',       rowId: `${config.PREFIX}moviemenu` },
          { title: '🎌 Anime Menu',       description: 'Anime commands',       rowId: `${config.PREFIX}animemenu` }
        ]
      },
      {
        title: '𝙄𝙎𝙃𝘼𝙉-𝙓 𝙈𝘿 ᴠ.𝟽.𝟶.𝟶 ᴘʀᴏ — ꜱᴇᴄᴏɴᴅ ʟɪꜱᴛ 🔥',
        highlight_label: '🔥 MORE',
        rows: [
          { title: '🏡 Main Menu',        description: 'Main commands',        rowId: `${config.PREFIX}mainmenu` },
          { title: '🧑‍💻 Owner Menu',     description: 'Owner commands',       rowId: `${config.PREFIX}ownermenu` },
          { title: '👥 Group Menu',       description: 'Group commands',       rowId: `${config.PREFIX}groupmenu` },
          { title: '📰 News Menu',        description: 'News commands',        rowId: `${config.PREFIX}newsmenu` },
          { title: '🐱 Sticker Menu',     description: 'Sticker commands',     rowId: `${config.PREFIX}stickermenu` },
          { title: '🧑‍🔧 Settings',       description: 'Bot settings',         rowId: `${config.PREFIX}settings` },
          { title: '⚡ Ping2 Dashboard',  description: 'Image dashboard',      rowId: `${config.PREFIX}ping2` },
          { title: '🔞 NSFW Menu',        description: 'NSFW commands',        rowId: `${config.PREFIX}nsfwmenu` }
        ]
      }
    ];

    const mk = (label, id) => ({
      buttonId: id,
      buttonText: { displayText: label },
      type: 1
    });

    const buttons = [
      mk('☰ menu',      `${config.PREFIX}menu`),
      mk('🔍 owner',    `${config.PREFIX}owner`),
      // ← tap opens the highlighted menu sheet (rows/sections on a button)
      { ...mk('📂 allmenus', `${config.PREFIX}allmenus`), sections: menuSections }
    ];

    const menuSendFooter = footer || config.BOT_FOOTER;
    const anyCustomMenuImg = hasCustomMenuImage(bc);

    // ishumdz-bail v1.0.19+: classic ButtonsMessage with auto header
    // → guaranteed horizontal row, no "doesn't support" error
    if (anyCustomMenuImg) {
      await socket.sendMessage(sender, {
        image: { url: resolveBaseMenuImage(bc, null) },  // custom pic header
        caption: menuMessage,
        footer: menuSendFooter,
        buttons
      }, { quoted: msg });
    } else {
      await socket.sendMessage(sender, {
        gif: { url: imageurl0 },                          // animated GIF header
        caption: menuMessage,
        footer: menuSendFooter,
        buttons
      }, { quoted: msg });
    }

  } catch (e) {
    console.log("❌ Menu Error:", e);
    socket.sendMessage(sender, { text: `*🚩 Menu Error :-*\n${e.message}` }).catch(() => {});
  }
  break;
  } // case 'menu'
  } // switch
}

module.exports = { resolveButtonResponse };
