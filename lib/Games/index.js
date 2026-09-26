/**
 * WhatsApp Games Module for ishu-md
 * Add fun games to your WhatsApp bot!
 */

import { sendChess, buildChessMessage } from './chess.js';
import { sendTicTacToe, buildTicTacToeMessage } from './tictactoe.js';
import { sendConnectFour, buildConnectFourMessage } from './connect4.js';
import { send2048, build2048Message } from './game2048.js';
import { sendSnake, buildSnakeMessage } from './snake.js';
import { sendMemory, buildMemoryMessage } from './memory.js';
import { sendHtmlGame, buildHtmlGameMessage } from './htmlGame.js';

export { buildChessMessage, sendChess, CHESS_HTML } from './chess.js';
export { buildTicTacToeMessage, sendTicTacToe } from './tictactoe.js';
export { buildConnectFourMessage, sendConnectFour } from './connect4.js';
export { build2048Message, send2048 } from './game2048.js';
export { buildSnakeMessage, sendSnake } from './snake.js';
export { buildMemoryMessage, sendMemory } from './memory.js';
export { buildHtmlGameMessage, sendHtmlGame } from './htmlGame.js';

// ==================== BLACKJACK ====================
const CARD_SUITS = ['♠️', '♥️', '♦️', '♣️'];
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
    const deck = [];
    for (const suit of CARD_SUITS) {
        for (const value of CARD_VALUES) {
            deck.push({ suit, value });
        }
    }
    return shuffleArray(deck);
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

function calculateHand(hand) {
    let sum = 0;
    let aces = 0;
    
    for (const card of hand) {
        sum += getCardValue(card);
        if (card.value === 'A') aces++;
    }
    
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    
    return sum;
}

function formatCard(card) {
    return `${card.value}${card.suit}`;
}

function formatHand(hand) {
    return hand.map(formatCard).join(' ');
}

export function blackjack(action, playerHand = [], dealerHand = [], bet = 0) {
    if (action === 'start') {
        const deck = createDeck();
        const player = [deck.pop(), deck.pop()];
        const dealer = [deck.pop(), deck.pop()];
        
        const playerSum = calculateHand(player);
        const dealerVisible = dealer[0];
        
        if (playerSum === 21) {
            return {
                status: 'blackjack',
                playerHand: formatHand(player),
                dealerHand: formatHand(dealer),
                playerSum,
                dealerSum: calculateHand(dealer),
                win: true,
                payout: Math.floor(bet * 2.5),
                message: `🎰 *BLACKJACK!*\n\nYour cards: ${formatHand(player)}\nDealer cards: ${formatHand(dealer)}\n\nYou win ${Math.floor(bet * 2.5)} coins!`
            };
        }
        
        return {
            status: 'playing',
            playerHand: player,
            dealerHand: dealer,
            deck,
            playerSum,
            dealerVisible: formatCard(dealerVisible),
            bet,
            message: `🃏 *Blackjack*\n\nYour cards: ${formatHand(player)} (${playerSum})\nDealer shows: ${formatCard(dealerVisible)} ?\n\nHit / Stand / Double?`
        };
    }
    
    if (action === 'hit') {
        const deck = playerHand.deck || createDeck();
        playerHand.player.push(deck.pop());
        const playerSum = calculateHand(playerHand.player);
        
        if (playerSum > 21) {
            return {
                status: 'bust',
                playerHand: formatHand(playerHand.player),
                dealerHand: formatHand(playerHand.dealerHand),
                playerSum,
                win: false,
                payout: 0,
                message: `💥 *BUST!*\n\nYour cards: ${formatHand(playerHand.player)} (${playerSum})\nDealer cards: ${formatHand(playerHand.dealerHand)}\n\nYou lose ${playerHand.bet} coins!`
            };
        }
        
        if (playerSum === 21) {
            return blackjack('stand', playerHand, null, playerHand.bet);
        }
        
        return {
            status: 'playing',
            playerHand: playerHand.player,
            dealerHand: playerHand.dealerHand,
            deck,
            playerSum,
            bet: playerHand.bet,
            message: `🃏 *Blackjack*\n\nYour cards: ${formatHand(playerHand.player)} (${playerSum})\nDealer shows: ${playerHand.dealerVisible} ?\n\nHit / Stand?`
        };
    }
    
    if (action === 'stand') {
        let dealer = [...playerHand.dealerHand];
        const deck = createDeck();
        
        while (calculateHand(dealer) < 17) {
            dealer.push(deck.pop());
        }
        
        const playerSum = calculateHand(playerHand.player);
        const dealerSum = calculateHand(dealer);
        
        let result;
        if (dealerSum > 21) {
            result = 'win';
        } else if (playerSum > dealerSum) {
            result = 'win';
        } else if (playerSum < dealerSum) {
            result = 'lose';
        } else {
            result = 'push';
        }
        
        const payout = result === 'win' ? playerHand.bet * 2 : (result === 'push' ? playerHand.bet : 0);
        
        return {
            status: result,
            playerHand: formatHand(playerHand.player),
            dealerHand: formatHand(dealer),
            playerSum,
            dealerSum,
            win: result === 'win',
            push: result === 'push',
            payout,
            message: `🃏 *Blackjack Result*\n\nYour cards: ${formatHand(playerHand.player)} (${playerSum})\nDealer cards: ${formatHand(dealer)} (${dealerSum})\n\n${result === 'win' ? `You win ${payout} coins!` : result === 'push' ? 'Push! Bet returned.' : `You lose ${playerHand.bet} coins!`}`
        };
    }
    
    if (action === 'double') {
        if (playerHand.player.length !== 2) {
            return { status: 'error', message: 'Can only double on first two cards!' };
        }
        
        const deck = playerHand.deck || createDeck();
        playerHand.player.push(deck.pop());
        const playerSum = calculateHand(playerHand.player);
        
        if (playerSum > 21) {
            return {
                status: 'bust',
                playerHand: formatHand(playerHand.player),
                dealerHand: formatHand(playerHand.dealerHand),
                playerSum,
                win: false,
                payout: 0,
                message: `💥 *BUST!*\n\nYour cards: ${formatHand(playerHand.player)} (${playerSum})\nDealer cards: ${formatHand(playerHand.dealerHand)}\n\nYou lose ${playerHand.bet * 2} coins!`
            };
        }
        
        return blackjack('stand', { ...playerHand, bet: playerHand.bet * 2 }, null, playerHand.bet * 2);
    }
    
    return { status: 'error', message: 'Invalid action!' };
}

// ==================== SLOT MACHINE ====================
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐'];
const SLOT_WEIGHTS = [30, 25, 20, 15, 5, 3, 2];

function getWeightedRandom() {
    const totalWeight = SLOT_WEIGHTS.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
        random -= SLOT_WEIGHTS[i];
        if (random <= 0) return SLOT_SYMBOLS[i];
    }
    
    return SLOT_SYMBOLS[0];
}

export function slotMachine(bet = 100) {
    const reels = [
        getWeightedRandom(),
        getWeightedRandom(),
        getWeightedRandom()
    ];
    
    const display = `🎰 *SLOT MACHINE* 🎰\n\n[${reels[0]}] [${reels[1]}] [${reels[2]}]\n`;
    
    let payout = 0;
    let message = '';
    
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
        // Three of a kind
        if (reels[0] === '7️⃣') {
            payout = bet * 100;
            message = '🎉 *JACKPOT!* Three 7️⃣!';
        } else if (reels[0] === '💎') {
            payout = bet * 50;
            message = '💎 *DIAMOND WIN!*';
        } else {
            payout = bet * 20;
            message = '⭐ *THREE OF A KIND!*';
        }
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        payout = bet * 2;
        message = '✨ *TWO MATCH!*';
    } else {
        payout = 0;
        message = '😔 *NO MATCH*';
    }
    
    return {
        reels,
        win: payout > 0,
        payout,
        bet,
        message: `${display}\n${message}\n\n${payout > 0 ? `You win ${payout} coins!` : `You lose ${bet} coins!`}`
    };
}

// ==================== DICE ====================
export function diceGame(bet = 100, prediction = 'high') {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    let win = false;
    if (prediction === 'high' && total >= 8) win = true;
    if (prediction === 'low' && total <= 6) win = true;
    if (prediction === 'seven' && total === 7) win = true;
    
    const payout = prediction === 'seven' ? (win ? bet * 5 : 0) : (win ? bet * 2 : 0);
    
    return {
        dice1,
        dice2,
        total,
        win,
        payout,
        prediction,
        message: `🎲 *DICE GAME* 🎲\n\n${diceEmojis[dice1-1]} ${diceEmojis[dice2-1]}\n\nTotal: *${total}*\n\n${win ? `🎉 *YOU WIN ${payout} coins!*` : `😔 *You lose ${bet} coins!*`}`
    };
}

// ==================== COIN FLIP ====================
export function coinFlip(bet = 100, prediction = 'heads') {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const emoji = result === 'heads' ? '👑' : '🌙';
    
    const win = prediction === result;
    const payout = win ? bet * 2 : 0;
    
    return {
        result,
        emoji,
        win,
        payout,
        prediction,
        message: `🪙 *COIN FLIP* 🪙\n\n${emoji} *${result.toUpperCase()}*\n\nYour prediction: ${prediction}\n\n${win ? `🎉 *YOU WIN ${payout} coins!*` : `😔 *You lose ${bet} coins!*`}`
    };
}

// ==================== ROULETTE ====================
export function roulette(bet = 100, prediction = 'red') {
    const numbers = {
        red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
        black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
        green: [0]
    };
    
    const result = Math.floor(Math.random() * 37);
    const color = result === 0 ? 'green' : numbers.red.includes(result) ? 'red' : 'black';
    
    const colorEmoji = { red: '🔴', black: '⚫', green: '🟢' };
    
    let win = false;
    let payout = 0;
    
    if (prediction === color) {
        win = true;
        payout = color === 'green' ? bet * 36 : bet * 2;
    } else if (prediction === 'odd' && result !== 0 && result % 2 !== 0) {
        win = true;
        payout = bet * 2;
    } else if (prediction === 'even' && result !== 0 && result % 2 === 0) {
        win = true;
        payout = bet * 2;
    } else if (prediction === 'low' && result >= 1 && result <= 18) {
        win = true;
        payout = bet * 2;
    } else if (prediction === 'high' && result >= 19 && result <= 36) {
        win = true;
        payout = bet * 2;
    }
    
    return {
        number: result,
        color,
        emoji: colorEmoji[color],
        win,
        payout,
        prediction,
        message: `🎰 *ROULETTE* 🎰\n\n${colorEmoji[color]} *${result} ${color.toUpperCase()}*\n\nYour bet: ${prediction}\n\n${win ? `🎉 *YOU WIN ${payout} coins!*` : `😔 *You lose ${bet} coins!*`}`
    };
}

// ==================== MINES ====================
export function createMines(rows = 5, cols = 5, mineCount = 5) {
    const grid = [];
    const mines = new Set();
    
    // Place mines randomly
    while (mines.size < mineCount) {
        const pos = Math.floor(Math.random() * (rows * cols));
        mines.add(pos);
    }
    
    // Create grid
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const pos = i * cols + j;
            row.push({
                isMine: mines.has(pos),
                revealed: false
            });
        }
        grid.push(row);
    }
    
    return {
        grid,
        rows,
        cols,
        mineCount,
        revealed: 0,
        totalSafe: (rows * cols) - mineCount
    };
}

export function revealTile(game, row, col) {
    if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) {
        return { error: 'Invalid position!' };
    }
    
    const tile = game.grid[row][col];
    if (tile.revealed) {
        return { error: 'Already revealed!' };
    }
    
    tile.revealed = true;
    
    if (tile.isMine) {
        // Reveal all mines
        for (const row of game.grid) {
            for (const t of row) {
                t.revealed = true;
            }
        }
        return {
            mine: true,
            game,
            message: '💥 *BOOM!* You hit a mine!'
        };
    }
    
    game.revealed++;
    
    // Calculate multiplier based on revealed tiles
    const multiplier = 1 + (game.revealed * 0.5);
    
    return {
        mine: false,
        multiplier: multiplier.toFixed(1),
        game,
        message: `✅ Safe! Multiplier: x${multiplier.toFixed(1)}`
    };
}

export function cashoutMines(game, bet) {
    const multiplier = 1 + (game.revealed * 0.5);
    const payout = Math.floor(bet * multiplier);
    
    return {
        payout,
        multiplier: multiplier.toFixed(1),
        message: `💰 *CASHOUT*\n\nRevealed: ${game.revealed} tiles\nMultiplier: x${multiplier.toFixed(1)}\n\nYou win ${payout} coins!`
    };
}

// ==================== TRIVIA ====================
const TRIVIA_QUESTIONS = [
    { q: "What planet is known as the Red Planet?", options: ["A) Venus", "B) Mars", "C) Jupiter", "D) Saturn"], answer: "B" },
    { q: "What is the largest ocean on Earth?", options: ["A) Atlantic", "B) Indian", "C) Pacific", "D) Arctic"], answer: "C" },
    { q: "How many continents are there?", options: ["A) 5", "B) 6", "C) 7", "D) 8"], answer: "C" },
    { q: "What gas do plants absorb?", options: ["A) Oxygen", "B) Nitrogen", "C) Carbon Dioxide", "D) Hydrogen"], answer: "C" },
    { q: "What is the speed of light?", options: ["A) 300,000 km/s", "B) 150,000 km/s", "C) 450,000 km/s", "D) 600,000 km/s"], answer: "A" },
    { q: "What is the largest mammal?", options: ["A) Elephant", "B) Blue Whale", "C) Giraffe", "D) Hippo"], answer: "B" },
    { q: "How many days in a leap year?", options: ["A) 364", "B) 365", "C) 366", "D) 367"], answer: "C" },
    { q: "What element has symbol 'O'?", options: ["A) Gold", "B) Oxygen", "C) Osmium", "D) All"], answer: "D" },
    { q: "What is the smallest prime number?", options: ["A) 0", "B) 1", "C) 2", "D) 3"], answer: "C" },
    { q: "What year did WW2 end?", options: ["A) 1943", "B) 1944", "C) 1945", "D) 1946"], answer: "C" },
];

export function trivia(bet = 100) {
    const question = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    
    return {
        question: question.q,
        options: question.options,
        answer: question.answer,
        bet,
        message: `🧠 *TRIVIA*\n\n${question.q}\n\n${question.options.join('\n')}\n\nReply with A, B, C, or D!`
    };
}

export function checkTriviaAnswer(answer, correctAnswer, bet) {
    const win = answer.toUpperCase() === correctAnswer;
    const payout = win ? bet * 2 : 0;
    
    return {
        win,
        payout,
        correctAnswer,
        message: win ? `✅ *CORRECT!* You win ${payout} coins!` : `❌ *WRONG!* The answer was ${correctAnswer}. You lose ${bet} coins!`
    };
}

// ==================== RPS (Rock Paper Scissors) ====================
export function rps(playerChoice = 'rock') {
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    const botChoice = choices[Math.floor(Math.random() * 3)];
    
    let result;
    if (playerChoice === botChoice) {
        result = 'draw';
    } else if (
        (playerChoice === 'rock' && botChoice === 'scissors') ||
        (playerChoice === 'paper' && botChoice === 'rock') ||
        (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
        result = 'win';
    } else {
        result = 'lose';
    }
    
    return {
        playerChoice,
        botChoice,
        result,
        message: `✊ *ROCK PAPER SCISSORS*\n\nYou: ${emojis[playerChoice]} ${playerChoice.toUpperCase()}\nBot: ${emojis[botChoice]} ${botChoice.toUpperCase()}\n\n${result === 'win' ? '🎉 *YOU WIN!*' : result === 'lose' ? '😔 *YOU LOSE!*' : '🤝 *DRAW!*'}`
    };
}

export default {
    blackjack,
    slotMachine,
    diceGame,
    coinFlip,
    roulette,
    createMines,
    revealTile,
    cashoutMines,
    trivia,
    checkTriviaAnswer,
    rps,
    sendChess,
    buildChessMessage,
    sendTicTacToe,
    buildTicTacToeMessage,
    sendConnectFour,
    buildConnectFourMessage,
    send2048,
    build2048Message,
    sendSnake,
    buildSnakeMessage,
    sendMemory,
    buildMemoryMessage,
    sendHtmlGame,
    buildHtmlGameMessage
};
