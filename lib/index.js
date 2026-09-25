import makeWASocket from './Socket/index.js';
import chalk from "chalk";
import { enableCallAutoAnswer, getActiveVoipClient, CallState } from './Caller/auto-answer.js';
import { attachProMethods } from './Pro/index.js';
import * as PollsPro from './Pro/polls.js';
import * as NewsletterPro from './Pro/newsletter.js';
import * as StatusPro from './Pro/status.js';
import * as ChatsPro from './Pro/chats.js';
import * as GroupsPro from './Pro/groups.js';
import * as ProfilePro from './Pro/profile.js';

// === BANNER ASCII SMD — ishu-md ===
console.log(chalk.hex("#FFC72C")("     ╦  ╦┌─┐┬ ┬┌─┐┬┌─ "));
console.log(chalk.hex("#FF9933")("     │  ││ │││││  ├┴┐ "));
console.log(chalk.hex("#FF7A00")("     └─┘└─┘└┴┘└─┘┴ ┴ "));

// === INFO ===
const smdLine = chalk.hex("#FFC72C")("─────────────────────────────────────────────");
console.log("\n" + smdLine);
console.log(
  chalk.hex("#FFC72C")("  🦁 ") +
  chalk.hex("#FF7A00").bold("AYSU") +
  chalk.gray("  •  ") +
  chalk.hex("#FFC72C").bold("By Lovely") +
  chalk.hex("#FF7A00")("")
);
console.log(chalk.gray("  📦  npm     ") + chalk.hex("#FFC72C")("ishumdz-bail"));
console.log(chalk.gray("  🌐  web     ") + chalk.hex("#FFC72C")("ishanx-pro.site.je"));
console.log(chalk.gray("  💬  channel ") + chalk.hex("#FFC72C")("web-api"));
console.log(smdLine);
console.log(chalk.hex("#FF7A00").bold("  ✓  ") + chalk.greenBright("Baileys Connected — Online") + "\n");
// === EXPORTS ===
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './Store/index.js';
export * from './Socket/ban-checker.js';
export * from './Games/index.js';
export * from './Caller/index.mjs';

// Pro Methods - Polls
export const sendPoll = PollsPro.sendPoll;
export const sendPollVote = PollsPro.sendPollVote;
export const getAggregatePollVotes = PollsPro.getAggregatePollVotes;

// Pro Methods - Newsletter
export const channelVote = NewsletterPro.channelVote;
export const newsletterVoteMessage = NewsletterPro.newsletterVoteMessage;
export const newsletterReact = NewsletterPro.newsletterReact;
export const newsletterGetMessages = NewsletterPro.newsletterGetMessages;
export const newsletterSearch = NewsletterPro.newsletterSearch;
export const newsletterList = NewsletterPro.newsletterList;

// Pro Methods - Status
export const sendStatusText = StatusPro.sendStatusText;
export const sendStatusMedia = StatusPro.sendStatusMedia;
export const readStatus = StatusPro.readStatus;
export const reactStatus = StatusPro.reactStatus;

// Pro Methods - Chat
export const editMessage = ChatsPro.editMessage;
export const deleteMessage = ChatsPro.deleteMessage;
export const pinMessage = ChatsPro.pinMessage;
export const unpinMessage = ChatsPro.unpinMessage;
export const starMessage = ChatsPro.starMessage;
export const reactMessage = ChatsPro.reactMessage;
export const sendPresence = ChatsPro.sendPresence;
export const reply = ChatsPro.reply;

// Pro Methods - Groups
export const groupGetInviteInfo = GroupsPro.groupGetInviteInfo;
export const groupJoinViaInvite = GroupsPro.groupJoinViaInvite;
export const groupSetAnnouncement = GroupsPro.groupSetAnnouncement;
export const groupSetLocked = GroupsPro.groupSetLocked;
export const groupRequestParticipantsList = GroupsPro.groupRequestParticipantsList;
export const groupApproveParticipants = GroupsPro.groupApproveParticipants;
export const groupRejectParticipants = GroupsPro.groupRejectParticipants;

// Pro Methods - Profile
export const checkNumber = ProfilePro.checkNumber;
export const setBio = ProfilePro.setBio;
export const updateProfileName = ProfilePro.updateProfileName;
export const setProfilePicture = ProfilePro.setProfilePicture;
export const removeProfilePicture = ProfilePro.removeProfilePicture;
export const rejectCall = ProfilePro.rejectCall;

export { enableCallAutoAnswer, getActiveVoipClient, CallState, attachProMethods, makeWASocket };
export default makeWASocket;
//# sourceMappingURL=index.js.map
